/**
 * Input Component
 * 
 * A reusable input component with validation and icons.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```typescript
 * const input = new Input({
 *   type: 'text',
 *   placeholder: 'Enter your name...',
 *   icon: Icons.search,
 *   onChange: (value) => console.log(value)
 * });
 * 
 * container.appendChild(input.render());
 * ```
 */

export type InputType = 'text' | 'email' | 'password' | 'search' | 'number' | 'url';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps {
    type?: InputType;
    value?: string;
    placeholder?: string;
    size?: InputSize;
    icon?: string;
    iconPosition?: 'left' | 'right';
    error?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    fullWidth?: boolean;
    className?: string;
    onChange?: (value: string, event: Event) => void;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
}

export class Input {
    private props: InputProps;
    private container: HTMLDivElement | null = null;
    private input: HTMLInputElement | null = null;
    private errorElement: HTMLDivElement | null = null;

    constructor(props: InputProps) {
        this.props = {
            type: 'text',
            size: 'md',
            iconPosition: 'left',
            disabled: false,
            readonly: false,
            required: false,
            fullWidth: false,
            ...props,
        };
    }

    /**
     * Render input element
     */
    render(): HTMLDivElement {
        const container = document.createElement('div');
        container.className = this.getContainerClassName();

        // Input wrapper (for icon positioning)
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';

        // Icon (left)
        if (this.props.icon && this.props.iconPosition === 'left') {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'input-icon input-icon-left';
            iconSpan.innerHTML = this.props.icon;
            wrapper.appendChild(iconSpan);
        }

        // Input element
        const input = document.createElement('input');
        input.type = this.props.type!;
        input.className = this.getInputClassName();
        input.placeholder = this.props.placeholder || '';
        input.value = this.props.value || '';
        input.disabled = this.props.disabled || false;
        input.readOnly = this.props.readonly || false;
        input.required = this.props.required || false;

        if (this.props.maxLength) input.maxLength = this.props.maxLength;
        if (this.props.minLength) input.minLength = this.props.minLength;
        if (this.props.pattern) input.pattern = this.props.pattern;

        // Event listeners
        if (this.props.onChange) {
            input.addEventListener('input', (e) => {
                this.props.onChange!(input.value, e);
            });
        }

        if (this.props.onFocus) {
            input.addEventListener('focus', this.props.onFocus);
        }

        if (this.props.onBlur) {
            input.addEventListener('blur', this.props.onBlur);
        }

        if (this.props.onKeyDown) {
            input.addEventListener('keydown', this.props.onKeyDown);
        }

        wrapper.appendChild(input);
        this.input = input;

        // Icon (right)
        if (this.props.icon && this.props.iconPosition === 'right') {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'input-icon input-icon-right';
            iconSpan.innerHTML = this.props.icon;
            wrapper.appendChild(iconSpan);
        }

        container.appendChild(wrapper);

        // Error message
        if (this.props.error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'input-error';
            errorDiv.textContent = this.props.error;
            container.appendChild(errorDiv);
            this.errorElement = errorDiv;
        }

        this.container = container;
        return container;
    }

    /**
     * Get container class name
     */
    private getContainerClassName(): string {
        const classes = ['input-container'];

        if (this.props.fullWidth) classes.push('input-full-width');
        if (this.props.className) classes.push(this.props.className);

        return classes.join(' ');
    }

    /**
     * Get input class name
     */
    private getInputClassName(): string {
        const classes = ['input'];

        // Size
        classes.push(`input-${this.props.size}`);

        // Icon padding
        if (this.props.icon) {
            if (this.props.iconPosition === 'left') {
                classes.push('input-with-icon-left');
            } else {
                classes.push('input-with-icon-right');
            }
        }

        // Error state
        if (this.props.error) classes.push('input-error-state');

        return classes.join(' ');
    }

    /**
     * Get input value
     */
    getValue(): string {
        return this.input?.value || '';
    }

    /**
     * Set input value
     */
    setValue(value: string): void {
        if (this.input) {
            this.input.value = value;
        }
    }

    /**
     * Set error message
     */
    setError(error: string | null): void {
        this.props.error = error || undefined;

        if (this.input) {
            if (error) {
                this.input.classList.add('input-error-state');
            } else {
                this.input.classList.remove('input-error-state');
            }
        }

        if (error) {
            if (!this.errorElement && this.container) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'input-error';
                errorDiv.textContent = error;
                this.container.appendChild(errorDiv);
                this.errorElement = errorDiv;
            } else if (this.errorElement) {
                this.errorElement.textContent = error;
            }
        } else if (this.errorElement) {
            this.errorElement.remove();
            this.errorElement = null;
        }
    }

    /**
     * Focus input
     */
    focus(): void {
        this.input?.focus();
    }

    /**
     * Select input text
     */
    select(): void {
        this.input?.select();
    }

    /**
     * Get input styles (for Shadow DOM)
     */
    static getStyles(): string {
        return `
      /* Input Container */
      .input-container {
        display: inline-block;
      }

      .input-full-width {
        width: 100%;
      }

      .input-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: 100%;
      }

      /* Input Base */
      .input {
        font-family: var(--font-sans);
        font-size: var(--text-base);
        color: var(--gray-900);
        background: white;
        border: 2px solid var(--gray-300);
        border-radius: var(--radius-small);
        outline: none;
        transition: all var(--duration-fast) var(--ease-in-out);
        width: 100%;
      }

      .input::placeholder {
        color: var(--gray-400);
      }

      .input:focus {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      .input:disabled {
        background: var(--gray-50);
        color: var(--gray-500);
        cursor: not-allowed;
      }

      .input:read-only {
        background: var(--gray-50);
      }

      /* Sizes */
      .input-sm {
        padding: var(--space-1) var(--space-3);
        font-size: var(--text-sm);
        height: 32px;
      }

      .input-md {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-base);
        height: 40px;
      }

      .input-lg {
        padding: var(--space-3) var(--space-4);
        font-size: var(--text-lg);
        height: 48px;
      }

      /* With icon */
      .input-with-icon-left {
        padding-left: var(--space-10);
      }

      .input-with-icon-right {
        padding-right: var(--space-10);
      }

      /* Icon */
      .input-icon {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--gray-400);
        pointer-events: none;
      }

      .input-icon-left {
        left: var(--space-3);
      }

      .input-icon-right {
        right: var(--space-3);
      }

      .input-icon svg {
        width: var(--icon-sm);
        height: var(--icon-sm);
      }

      .input:focus ~ .input-icon {
        color: var(--primary-500);
      }

      /* Error state */
      .input-error-state {
        border-color: var(--danger-500);
      }

      .input-error-state:focus {
        border-color: var(--danger-500);
        box-shadow: 0 0 0 3px var(--danger-100);
      }

      .input-error {
        margin-top: var(--space-1);
        font-size: var(--text-sm);
        color: var(--danger-600);
      }
    `;
    }
}
