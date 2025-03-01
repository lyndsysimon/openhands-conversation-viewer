import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

const getExampleFiles = () => {
  const examplesDir = path.join(new URL('.', import.meta.url).pathname, 'examples');
  return fs.readdirSync(examplesDir)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      name: file,
      content: fs.readFileSync(path.join(examplesDir, file), 'utf8')
    }));
};

// Mock marked library
global.marked = {
  parse: jest.fn(text => text)
};

describe('Conversation Viewer', () => {
  let container;

  beforeEach(() => {
    // Load the HTML file
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    document.documentElement.innerHTML = html;
    container = document.body;

    // Mock fetch
    global.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve([])
    }));

    // Extract and execute the JavaScript code
    const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    eval(scriptContent);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test.each(getExampleFiles())('loads and displays conversation data from $name', async ({ name, content }) => {
    const conversation = JSON.parse(content);

    // Mock FileReader
    const mockFileReader = {
      onload: null,
      readAsText: function(file) {
        setTimeout(() => {
          this.onload({ target: { result: content } });
        }, 0);
      }
    };
    global.FileReader = jest.fn(() => mockFileReader);

    // Trigger file upload
    const fileInput = document.getElementById('file-input');
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['{}'], name, { type: 'application/json' })]
      }
    });

    // Wait for events to be displayed
    await waitFor(() => {
      expect(container.querySelectorAll('.event')).toHaveLength(conversation.length);
    });

    // Verify that both user and agent messages are present
    const hasUserMessage = conversation.some(msg => msg.source === 'user');
    const hasAgentMessage = conversation.some(msg => msg.source === 'agent');

    if (hasUserMessage) {
      expect(container.querySelector('.event.user')).toBeInTheDocument();
    }
    if (hasAgentMessage) {
      expect(container.querySelector('.event.agent')).toBeInTheDocument();
    }
  });

  test('handles invalid JSON data', async () => {
    // Mock window.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock FileReader with invalid JSON
    const mockFileReader = {
      onload: null,
      readAsText: function(file) {
        setTimeout(() => {
          this.onload({ target: { result: 'invalid json' } });
        }, 0);
      }
    };
    global.FileReader = jest.fn(() => mockFileReader);

    // Trigger file upload
    const fileInput = document.getElementById('file-input');
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['{}'], 'test.json', { type: 'application/json' })]
      }
    });

    // Wait for alert to be called
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
    });
    expect(mockAlert.mock.calls[0][0]).toMatch(/error parsing json/i);

    mockAlert.mockRestore();
  });

  test.each(getExampleFiles())('toggles metadata visibility in $name', async ({ name, content }) => {
    const conversation = JSON.parse(content);
    const messageWithMetadata = conversation.find(msg => msg.metadata);
    
    if (!messageWithMetadata) {
      // Skip test if no metadata found
      return;
    }

    // Mock FileReader
    const mockFileReader = {
      onload: null,
      readAsText: function(file) {
        setTimeout(() => {
          this.onload({ target: { result: content } });
        }, 0);
      }
    };
    global.FileReader = jest.fn(() => mockFileReader);

    // Trigger file upload
    const fileInput = document.getElementById('file-input');
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['{}'], name, { type: 'application/json' })]
      }
    });

    // Wait for events to be displayed and metadata toggle to appear
    await waitFor(() => {
      expect(container.querySelector('.metadata-toggle')).toBeInTheDocument();
    });

    // Click metadata toggle
    const toggle = container.querySelector('.metadata-toggle');
    const metadata = document.getElementById(`metadata-${messageWithMetadata.id}`);
    
    // Click the toggle button
    fireEvent.click(toggle);

    // Check if metadata is visible
    expect(metadata).not.toHaveClass('hidden');
    expect(toggle.textContent.trim()).toBe('Hide Metadata ▲');

    // Click again to hide
    fireEvent.click(toggle);
    expect(metadata).toHaveClass('hidden');
    expect(toggle.textContent.trim()).toBe('Show Metadata ▼');
  });
});