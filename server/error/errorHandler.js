const CustomError = require('./CustomError.js');

function errorHandler(err, req, res, next) {
    if(res.headerSent) {
        return;
    }
    if (err instanceof CustomError) {
        return res.status(err.status).json({
            success: false,
            code: err.code,
            message: err.message,
            ...(err.details && {details: err.details}),
        });
    } else {
        res.status(500).json({
            success: false,
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 내부 오류가 발생했습니다.',
        });
    }
}

module.exports = errorHandler;