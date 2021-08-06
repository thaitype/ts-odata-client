import { Response } from 'node-fetch';

/**
 * Extremely simple mock of the fetch method
 */
export class MockFetch {
    lastRequest: Request | undefined;
    lastInit: RequestInit | undefined;
    fetch(request: Request, options: RequestInit) {
        this.lastRequest = request;
        this.lastInit = options;
        return Promise.resolve(new Response("{}", {status: 200}));
    }
}