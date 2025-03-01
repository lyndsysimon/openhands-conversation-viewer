// Test file listing functionality
describe('File Listing', () => {
    let fetchMock;
    let filesDiv;

    beforeEach(() => {
        // Create a mock DOM environment
        document.body.innerHTML = `
            <div id="conversation-files"></div>
            <div id="file-list" class="hidden"></div>
        `;
        filesDiv = document.getElementById('conversation-files');

        // Mock fetch API
        fetchMock = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve([
                    { name: 'test1.json' },
                    { name: 'test2.json' }
                ])
            })
        );
        global.fetch = fetchMock;
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('listConversations fetches from correct path', async () => {
        await listConversations();
        expect(fetchMock).toHaveBeenCalledWith('conversations.json');
    });

    test('listConversations displays files correctly', async () => {
        await listConversations();
        const fileLinks = filesDiv.querySelectorAll('div');
        expect(fileLinks.length).toBe(2);
        expect(fileLinks[0].textContent).toBe('test1.json');
        expect(fileLinks[1].textContent).toBe('test2.json');
    });

    test('clicking file updates URL and hides file list', async () => {
        await listConversations();
        const fileLinks = filesDiv.querySelectorAll('div');
        
        // Mock window.history and URL
        const pushStateSpy = jest.spyOn(window.history, 'pushState');
        global.URL = jest.fn(() => ({
            searchParams: {
                set: jest.fn()
            }
        }));

        fileLinks[0].click();
        
        expect(pushStateSpy).toHaveBeenCalled();
        expect(document.getElementById('file-list').classList.contains('hidden')).toBe(true);
    });
});