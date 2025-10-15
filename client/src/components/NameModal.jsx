export default function NameModal({show, onClose, onSave, message, value, onChange}) {
    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1"
            style={{background: "rgba(0,0,0,0.5)"}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-titme">{message}</h5>
                        <button className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <input
                            className="form-control"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            autoFocus
                        />
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