import React, { useState, useEffect, useRef } from "react";
import "./ReportModal.css";

export default function ReportModal({ isOpen, onClose, onSubmit }) {
  const [reason, setReason] = useState("inappropriate_content");
  const [otherText, setOtherText] = useState("");
  const overlayRef = useRef();

  // Chiudi se clicco fuori dalla modal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (overlayRef.current === e.target) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" ref={overlayRef}>
      <div className="modal">
        <h2>Report Artwork</h2>
        <label className="modal-label">
          Reason:
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="modal-select"
          >
            <option value="spam">Spam</option>
            <option value="inappropriate_content">Inappropriate</option>
            <option value="privacy_violation">Privacy violation</option>
            <option value="intellectual_property">IP issue</option>
            <option value="other">Other</option>
          </select>
        </label>
        {reason === "other" && (
          <textarea
            className="modal-textarea"
            placeholder="Describe the issue..."
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
          />
        )}
        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-submit"
            onClick={() => {
              onSubmit({ reasonType: reason, otherReason: otherText });
            }}
          >
            Send Report
          </button>
        </div>
      </div>
    </div>
  );
}
