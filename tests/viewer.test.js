import { screen, fireEvent } from '@testing-library/dom';
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
    global.fetch = jest.fn();
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
        this.onload({ target: { result: JSON.stringify(mockConversation) } });
      }
    };
    global.FileReader = jest.fn(() => mockFileReader);

    // Trigger file upload
    const fileInput = screen.getByLabelText(/upload conversation json/i);
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['{}'], 'test.json', { type: 'application/json' })]
      }
    });

    // Check if events are displayed
    expect(container.querySelectorAll('.event')).toHaveLength(2);
    expect(container.querySelector('.event.user')).toBeInTheDocument();
    expect(container.querySelector('.event.agent')).toBeInTheDocument();
  });

  test('handles invalid JSON data', () => {
    // Mock window.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock FileReader with invalid JSON
    const mockFileReader = {
      onload: null,
      readAsText: function(file) {
        this.onload({ target: { result: 'invalid json' } });
      }
    };
    global.FileReader = jest.fn(() => mockFileReader);

    // Trigger file upload
    const fileInput = screen.getByLabelText(/upload conversation json/i);
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['{}'], 'test.json', { type: 'application/json' })]
      }
    });

    // Check if alert was called
    expect(mockAlert).toHaveBeenCalled();
    expect(mockAlert.mock.calls[0][0]).toMatch(/error parsing json/i);

    mockAlert.mockRestore();
  });

  test('toggles metadata visibility', () => {
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
        this.onload({ target: { result: JSON.stringify(mockConversation) } });
      }
    };
    global.FileReader = jest.fn(() => mockFileReader);

    // Trigger file upload
    const fileInput = screen.getByLabelText(/upload conversation json/i);
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['{}'], 'test.json', { type: 'application/json' })]
      }
    });

    // Click metadata toggle
    const toggle = screen.getByText(/show metadata/i);
    fireEvent.click(toggle);

    // Check if metadata is visible
    const metadata = document.getElementById('metadata-1');
    expect(metadata).not.toHaveClass('hidden');
    expect(toggle).toHaveTextContent(/hide metadata/i);

    // Click again to hide
    fireEvent.click(toggle);
    expect(metadata).toHaveClass('hidden');
    expect(toggle).toHaveTextContent(/show metadata/i);
  });
});