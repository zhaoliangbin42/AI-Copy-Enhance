/**
 * Shadow DOM styles for toolbar component
 * Simple layout with Copy button on left, stats on right
 * 
 * Updated to use design tokens from design-tokens.css
 */

// Import design tokens
import './design-tokens.css';

export const toolbarStyles = `
:host {
  display: block;
  font-family: var(--font-sans);
  margin-bottom: var(--space-2);
  
  /* Light mode theme colors */
  --gradient-solid-from: #ad5389;
  --gradient-solid-to: #3c1053;
  --gradient-light-from: rgba(173, 83, 137, 0.12);
  --gradient-light-to: rgba(60, 16, 83, 0.12);
  --theme-color: #ad5389;
}

/* Dark mode theme colors */
@media (prefers-color-scheme: dark) {
  :host {
    --gradient-solid-from: #e091d0;
    --gradient-solid-to: #c084b3;
    --gradient-light-from: rgba(224, 145, 208, 0.25);
    --gradient-light-to: rgba(192, 132, 179, 0.25);
    --theme-color: #e091d0;
  }
}

.aicopy-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) 0;
}

.aicopy-button-group {
  display: flex;
  align-items: center;
  gap: var(--space-1);  /* Reduced from 8px to 4px for more compact layout */
}

.aicopy-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--gray-500);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
  user-select: none;
}

.aicopy-button:hover {
  background: linear-gradient(135deg, var(--gradient-light-from), var(--gradient-light-to));
  color: var(--theme-color);
}

.aicopy-button:active {
  transform: scale(0.95);
}

.aicopy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Bookmarked state - highlighted with theme color */
.aicopy-button.bookmarked {
  background: linear-gradient(135deg, var(--gradient-light-from), var(--gradient-light-to));
  color: var(--theme-color);
}

.aicopy-button.bookmarked:hover {
  background: linear-gradient(135deg, var(--gradient-solid-from), var(--gradient-solid-to));
  color: white;
}

/* Tooltip on hover */
.aicopy-button::after {
  content: attr(aria-label);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(calc(-1 * var(--space-2)));
  padding: var(--space-1) var(--space-2);
  background: var(--gray-900);
  color: white;
  font-size: var(--text-xs);
  white-space: nowrap;
  border-radius: var(--radius-sm);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration-base) var(--ease-in-out);
  z-index: var(--z-tooltip);
}

.aicopy-button::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-2px);
  border: 5px solid transparent;
  border-top-color: var(--gray-900);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration-base) var(--ease-in-out);
  z-index: var(--z-tooltip);
}

.aicopy-button:hover::after,
.aicopy-button:hover::before {
  opacity: 1;
}

/* Click feedback tooltip */
.aicopy-button-feedback {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  padding: 6px 10px;
  background: var(--theme-color);
  color: white;
  font-size: 12px;
  white-space: nowrap;
  border-radius: 6px;
  opacity: 0;
  pointer-events: none;
  z-index: 1001;
  animation: fadeInOut 1.5s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-8px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(-12px); }
  80% { opacity: 1; transform: translateX(-50%) translateY(-12px); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-16px); }
}

.aicopy-icon {
  width: 20px;
  height: 20px;
  display: block;
}

/* Word count stats - right aligned */
.aicopy-stats {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  text-align: right;
  cursor: text;
}

/* Light mode colors */
:host {
  --text-secondary: #6b7280;
  --bg-secondary: rgba(0, 0, 0, 0.05);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :host {
    --text-secondary: #9ca3af;
    --bg-secondary: rgba(255, 255, 255, 0.1);
  }
}
`;