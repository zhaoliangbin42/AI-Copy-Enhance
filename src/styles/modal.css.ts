/**
 * Modal styles for Shadow DOM
 */
export const modalStyles = `
:host {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.15s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  color: #111827;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-button {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.modal-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.modal-button.primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.modal-button.primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background: #1f2937;
  }

  .modal-header {
    border-bottom-color: #374151;
  }

  .modal-title {
    color: #f9fafb;
  }

  .modal-close {
    color: #9ca3af;
  }

  .modal-close:hover {
    background: #374151;
    color: #f9fafb;
  }

  .modal-content {
    background: #111827;
    border-color: #374151;
    color: #f9fafb;
  }

  .modal-footer {
    border-top-color: #374151;
  }

  .modal-button {
    background: #374151;
    color: #f9fafb;
    border-color: #4b5563;
  }

  .modal-button:hover {
    background: #4b5563;
    border-color: #6b7280;
  }
}
`;
