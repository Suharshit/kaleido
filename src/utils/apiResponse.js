class apiResponse {
    constructor(
        data,
        status,
        message = "Success",
        success = true,
    ) {
        this.data = data;
        this.status = status;
        this.message = message;
        this.success = status < 400 || success;
    }
}

export { apiResponse }