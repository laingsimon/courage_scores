class AccountApi {
    constructor(http) {
        this.http = http;
    }

    get(emailAddress) {
        return this.http.get(`/api/Account/${emailAddress}`, {});
    }

    account() {
        return this.http.get(`/api/Account`, {});
    }

    update(account) {
        return this.http.post(`/api/Account/Access`, account);
    }
}

export { AccountApi };