const {ErrorCodes} = require('./ErrorCodes.js');

class CustomError extends Error {
    constructor(errorKey, message) {
        const errorInfo = ErrorCodes[errorKey];

        if (!errorInfo) {
            super('서버 내부 오류가 발생했습니다.');
            this.status = 500;
            this.code = "INTERNAL_SERVER_ERROR";
            return;
        }

        super(message || errorInfo.message);
        this.name = errorKey;
        this.status = errorInfo.statusCode;
        this.code = errorInfo.errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = CustomError;