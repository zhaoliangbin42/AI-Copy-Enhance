/**
 * Modal styles for Shadow DOM
 * Updated to use design tokens
 */

// Import design tokens
import './design-tokens.css';

export const modalStyles = `
:host {
  font-family: var(--font-sans);
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
  z-index: var(--z-modal-backdrop);
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl);
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--text-2xl);
  color: var(--gray-500);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.modal-close:hover {
  background: var(--gray-100);
  color: var(--gray-900);
}

.modal-body {
  padding: var(--space-5);
  overflow-y: auto;
  flex: 1;
}

.modal-content {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  color: var(--gray-900);
}

.modal-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.modal-button {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-300);
  background: white;
  color: var(--gray-700);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.modal-button:hover {
  background: var(--gray-100);
  border-color: var(--gray-400);
}

.modal-button.primary {
  background: var(--primary-600);
  color: white;
  border-color: var(--primary-600);
}

.modal-button.primary:hover {
  background: var(--primary-700);
  border-color: var(--primary-700);
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
