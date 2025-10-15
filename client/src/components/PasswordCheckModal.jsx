export default function PasswordCheckModal({show, onClose, onSave, value, onChange}) {
    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1"
            style={{bbackground: "rgba(0,0,0,0.5)"}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-titme">비밀번호 확인</h5>
                        <button className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <input
                            type="password"
                            className="form-control"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>취소</button>
                        <button className="btn btn-primary" onClick={onSave}>확인</button>
                    </div>
                </div>
            </div>
        </div>
    );
}