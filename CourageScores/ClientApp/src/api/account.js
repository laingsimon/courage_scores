class AccountApi {
    constructor(http) {
        this.http = http;
    }

    login() {
        return this.http.get(`/api/Account/Login`, {});
    }

    account() {
        return this.http.get(`/api/Account`, {});
    }

    update(account) {
        return this.http.post(`/api/Account`, account);
    }
}

export { AccountApi };