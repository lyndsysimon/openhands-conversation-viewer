import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

// Mock marked library
global.marked = {
  parse: jest.fn(text => text)
};

describe('Conversation Viewer', () => {
  let container;

  beforeEach(() => {
    // Load the HTML file
    const html = fs.readFileSync(new URL('../viewer.html', import.meta.url), 'utf8');
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

  test('loads and displays conversation data', async () => {
    const mockConversation = [
      {
        id: 1,
        source: 'user',
        message: 'Hello',
        timestamp: '2024-02-28T12:00:00Z'
      },
      {
        id: 2,
        source: 'agent',
        message: 'Hi there',
        timestamp: '2024-02-28T12:00:01Z'
      }
    ];

    // Mock FileReader
    const mockFileReader = {
      onload: null,
      readAsText: function(file) {
        setTimeout(() => {
          this.onload({ target: { result: JSON.stringify(mockConversation) } });
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

    // Wait for events to be displayed
    await waitFor(() => {
      expect(container.querySelectorAll('.event')).toHaveLength(2);
    });
    expect(container.querySelector('.event.user')).toBeInTheDocument();
    expect(container.querySelector('.event.agent')).toBeInTheDocument();
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

  test('toggles metadata visibility', async () => {
    const mockConversation = [{
      id: 1,
      source: 'user',
      message: 'Hello',
      timestamp: '2024-02-28T12:00:00Z',
      tool_call_metadata: { key: 'value' }
    }];

    // Mock FileReader
    const mockFileReader = {
      onload: null,
      readAsText: function(file) {
        setTimeout(() => {
          this.onload({ target: { result: JSON.stringify(mockConversation) } });
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

    // Wait for events to be displayed and metadata toggle to appear
    await waitFor(() => {
      expect(container.querySelector('.metadata-toggle')).toBeInTheDocument();
    });

    // Click metadata toggle
    const toggle = container.querySelector('.metadata-toggle');
    const metadata = document.getElementById('metadata-1');
    
    // Call toggleMetadata directly since it's not in the global scope
    window.toggleMetadata(1);

    // Check if metadata is visible
    expect(metadata).not.toHaveClass('hidden');
    expect(toggle.textContent.trim()).toBe('Hide Metadata ▲');

    // Click again to hide
    window.toggleMetadata(1);
    expect(metadata).toHaveClass('hidden');
    expect(toggle.textContent.trim()).toBe('Show Metadata ▼');
  });
});