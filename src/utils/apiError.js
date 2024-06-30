class apiError extends Error{
    constructor(
        status,
        message,
        errors = [],
        stack = ''
    ){
        super(message);
        this.status = status;
        this.errors = errors;
        this.message = message;
        this.data = null;
        this.success = false;

        if(stack){
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { apiError }