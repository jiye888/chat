const ErrorCodes = {
    BAD_REQUEST:
        {statusCode: 400, errorCode: 'REQ001', message: '잘못된 요청입니다.'},
    REQUEST_CONFLICT:
        {statusCode: 409, errorCode: 'REQ002', message: '필요한 선행 작업이 완료되지 않아 요청을 처리할 수 없습니다.'},
    NOT_FOUND:
        {statusCode: 404, errorCode: 'DB001', message: '요청한 리소스를 찾을 수 없습니다.'},
    EMAIL_DUPLICATE:
        {statusCode: 409, errorCode: 'MEMBER001', message: '이미 존재하는 이메일입니다.'},
    USER_NOT_FOUND:
        {statusCode: 404, errorCode: "MEMBER002", message: '사용자를 찾을 수 없습니다.'},
    USER_CONFLICT:
        {statusCode: 409, errorCode: "MEMBER003", message: '이미 요청이 처리된 회원입니다.'},
    INVALID_CREDENTIALS:
        {statusCode: 401, errorCode: "AUTH001", message: '아이디 또는 비밀번호를 다시 확인해주세요.'},
    TOKEN_EXPIRED:
        {statusCode: 401, errorCode: "AUTH002", message: '인증 토큰이 만료되었습니다.'},
    INVALID_TOKEN:
        {statusCode: 401, errorCode: "AUTH003", message: '유효하지 않은 토큰입니다.'},
    MISSING_TOKEN:
        {statusCode: 401, errorCode: "AUTH004", message: '인증 토큰이 필요합니다.'},
    FORBIDDEN:
        {statusCode: 403, errorCode: "AUTH005", message: '접근 권한이 없습니다.'},
    INVALID_INPUT:
        {statusCode: 400, errorCode: "VALID001", message: '입력 값이 유효하지 않습니다.'},
    INTERNAL_SERVER_ERROR:
        {statusCode: 500, errorCode: "SERVER001", message: '서버 내부 오류가 발생했습니다.'},
};

module.exports = {ErrorCodes};