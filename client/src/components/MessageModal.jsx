export default function MessageModal({message, show, onClose}) {
    if (!show) {
        return null;
    }

    return (
        <div className="modal-overlay" style={{backgroundColor: 'white'}}>
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">알림</h5>
                    <button type="button" className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}