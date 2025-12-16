/**
 * Design Tokens Type Definitions
 * 
 * TypeScript type definitions for design tokens.
 * Ensures type safety when using design tokens in code.
 * 
 * @module design-tokens
 * @version 1.0.0
 */

/**
 * Spacing scale based on 8px grid system
 * 
 * @example
 * ```typescript
 * import { spacing } from './design-tokens';
 * const padding = spacing[4]; // "16px"
 * ```
 */
export const spacing = {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
} as const;

export type Spacing = keyof typeof spacing;

/**
 * Color palette
 * 
 * @example
 * ```typescript
 * import { colors } from './design-tokens';
 * const textColor = colors.gray[900]; // "#111827"
 * ```
 */
export const colors = {
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },
    primary: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
        800: '#1E40AF',
    },
    success: {
        50: '#F0FDF4',
        100: '#DCFCE7',
        500: '#22C55E',
        600: '#16A34A',
        700: '#15803D',
    },
    warning: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        500: '#F59E0B',
        600: '#D97706',
        700: '#B45309',
    },
    danger: {
        50: '#FEF2F2',
        100: '#FEE2E2',
        500: '#EF4444',
        600: '#DC2626',
        700: '#B91C1C',
    },
    chatgpt: {
        light: '#D1FAE5',
        dark: '#065F46',
        icon: '#10A37F',
    },
    gemini: {
        light: '#DBEAFE',
        dark: '#1E40AF',
        icon: '#4285F4',
    },
} as const;

export type ColorShade = keyof typeof colors.gray;
export type ColorName = keyof typeof colors;

/**
 * Font sizes
 */
export const fontSize = {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
} as const;

export type FontSize = keyof typeof fontSize;

/**
 * Font weights
 */
export const fontWeight = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
} as const;

export type FontWeight = keyof typeof fontWeight;

/**
 * Border radius
 */
export const borderRadius = {
    none: '0px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
} as const;

export type BorderRadius = keyof typeof borderRadius;

/**
 * Icon sizes
 */
export const iconSize = {
    xs: '14px',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
} as const;

export type IconSize = keyof typeof iconSize;

/**
 * Animation durations
 */
export const duration = {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
} as const;

export type Duration = keyof typeof duration;

/**
 * Helper function to get CSS variable
 * 
 * @example
 * ```typescript
 * const color = getCSSVar('--gray-900'); // "var(--gray-900)"
 * ```
 */
export function getCSSVar(varName: string): string {
    return `var(${varName})`;
}

/**
 * Helper function to build spacing value
 * 
 * @example
 * ```typescript
 * const padding = getSpacing(4); // "var(--space-4)"
 * ```
 */
export function getSpacing(size: Spacing): string {
    return `var(--space-${size})`;
}

/**
 * Helper function to build color value
 * 
 * @example
 * ```typescript
 * const color = getColor('gray', 900); // "var(--gray-900)"
 * ```
 */
export function getColor(colorName: string, shade: number | string): string {
    return `var(--${colorName}-${shade})`;
}
