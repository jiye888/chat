export default function PasswordModal({
    show,
    onClose,
    onSave,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
}) {
    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1"
            style={{background: "rgba(0,0,0,0.5)"}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-titme">비밀번호 변경</h5>
                        <button className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label">현재 비밀번호</label>
                            <input
                                type="password"
                                className="form-control"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">새 비밀번호</label>
                            <input
                                type="password"
                                className="form-control"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>취소</button>
                        <button className="btn btn-primary" onClick={onSave}>저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}