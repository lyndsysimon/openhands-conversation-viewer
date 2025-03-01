import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('URL Parameter Tests', () => {
    let dom;
    let window;
    let document;
    let fetchMock;
    let consoleErrorMock;

    beforeEach(() => {
        // Create a new DOM for each test
        const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
        dom = new JSDOM(html, {
            url: 'http://localhost',
            runScripts: 'dangerously',
            resources: 'usable'
        });
        window = dom.window;
        document = window.document;

        // Mock fetch
        fetchMock = jest.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({})
        }));
        window.fetch = fetchMock;

        // Mock marked
        window.marked = {
            parse: jest.fn(text => text)
        };

        // Mock console.error
        consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorMock.mockRestore();
    });

    async function runScript() {
        // Get all scripts except external ones
        const scripts = Array.from(document.querySelectorAll('script:not([src])'));
        for (const script of scripts) {
            window.eval(script.textContent);
        }
        // Wait for any async operations
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    test('loads example.json by default when no URL parameter is present', async () => {
        await runScript();
        expect(fetchMock).toHaveBeenCalledWith('example.json');
    });

    test('loads conversation file from conversations directory when URL parameter is present', async () => {
        // Set URL parameter
        delete window.location;
        window.location = new URL('http://localhost/?file=test.json');

        await runScript();
        expect(fetchMock).toHaveBeenCalledWith('conversations/test.json');
    });

    test('displays error message when file loading fails', async () => {
        // Mock a failed fetch
        window.fetch = jest.fn(() => Promise.reject(new Error('File not found')));

        // Set URL parameter
        delete window.location;
        window.location = new URL('http://localhost/?file=nonexistent.json');

        await runScript();

        const timeline = document.getElementById('timeline');
        expect(timeline.innerHTML).toContain('Error Loading Conversation');
        expect(timeline.innerHTML).toContain('File not found');
    });
});