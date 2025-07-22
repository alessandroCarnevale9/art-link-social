import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "./ConfirmModal.css";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmButtonColor = "#dc3545",
  confirmButtonHoverColor = "#c82333",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-button" onClick={onClose}>
            <FaTimes size={14} />
          </button>
        </div>

        <p className="modal-message">{message}</p>

        <div className="modal-buttons">
          <button
            className="modal-button modal-button-cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className="modal-button modal-button-confirm"
            onClick={onConfirm}
            style={{
              backgroundColor: confirmButtonColor,
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = confirmButtonHoverColor;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = confirmButtonColor;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
