class apiResponse {
    constructor(
        data,
        status,
        message = "Success"
    ) {
        this.data = data;
        this.status = status;
        this.message = message;
        this.success = status < 400;
    }
}

export { apiResponse }