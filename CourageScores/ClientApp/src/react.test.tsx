import fetch from 'isomorphic-fetch';

describe('testing', () => {
    it('can make a http request', async () => {
        const response = await fetch(
            'https://courageleague.azurewebsites.net/data/api/Status',
        );
        const json = await response.json();
        expect(json.success).toEqual(true);
    });
});
