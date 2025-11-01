"use client";
export default function Alert({ title = "Something went wrong", message, onClose }) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card">
        <h3 style={{marginTop:0}}>{title}</h3>
        <p style={{marginBottom:12}}>{message || "Please try again."}</p>
        <div className="row" style={{justifyContent:"flex-end"}}>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
