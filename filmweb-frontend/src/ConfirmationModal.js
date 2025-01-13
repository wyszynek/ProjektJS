// ConfirmationModal.js
import React from 'react';
import './ConfirmationModal.css'; // Import custom CSS for modal styling

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-button confirm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
