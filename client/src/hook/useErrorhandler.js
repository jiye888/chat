export function useErrorHandler() {
    return (err) => {
        console.error(err);

        const msg = err?.response?.data?.message ||
            err?.message ||
            '오류가 발생했습니다.';
        
        alert(msg);
    };
}