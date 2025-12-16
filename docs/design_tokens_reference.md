# Design System Quick Reference

**Version**: 1.0.0  
**For**: Developers & Designers  
**Quick lookup for design tokens and common patterns**

---

## 🎨 Colors

### Neutrals (Gray Scale)
```css
--gray-50: #F9FAFB;    /* Lightest backgrounds */
--gray-100: #F3F4F6;   /* Hover states, disabled */
--gray-200: #E5E7EB;   /* Borders, dividers */
--gray-300: #D1D5DB;   /* Inactive borders */
--gray-400: #9CA3AF;   /* Placeholders, tertiary icons */
--gray-500: #6B7280;   /* Secondary text, default icons */
--gray-600: #4B5563;   /* Primary text hover */
--gray-700: #374151;   /* Headings, emphasized */
--gray-800: #1F2937;   /* Dark backgrounds */
--gray-900: #111827;   /* Primary text, headings */
```

### Primary (Blue)
```css
--primary-50: #EFF6FF;   /* Selected backgrounds */
--primary-100: #DBEAFE;  /* Hover backgrounds */
--primary-500: #3B82F6;  /* Primary buttons, links */
--primary-600: #2563EB;  /* Hover state */
--primary-700: #1D4ED8;  /* Active state */
```

### Semantic
```css
/* Success (Green) */
--success-50: #F0FDF4;
--success-500: #22C55E;
--success-600: #16A34A;

/* Warning (Amber) */
--warning-50: #FFFBEB;
--warning-500: #F59E0B;
--warning-600: #D97706;

/* Danger (Red) */
--danger-50: #FEF2F2;
--danger-500: #EF4444;
--danger-600: #DC2626;
```

---

## 📏 Spacing (8px Grid)

```css
--space-0: 0px;
--space-1: 4px;    /* Micro spacing */
--space-2: 8px;    /* Small gaps, button padding */
--space-3: 12px;   /* Default gaps, input padding */
--space-4: 16px;   /* Component padding */
--space-5: 20px;
--space-6: 24px;   /* Section spacing */
--space-8: 32px;   /* Large sections */
--space-10: 40px;
--space-12: 48px;  /* Page sections */
--space-16: 64px;  /* Major divisions */
```

**Common Uses**:
- Buttons: `padding: 8px 16px` (space-2 space-4)
- Inputs: `padding: 12px` (space-3)
- Cards: `padding: 16px` or `24px` (space-4 or space-6)
- Element gaps: `gap: 8px` or `12px` (space-2 or space-3)

---

## 📝 Typography

### Font Families
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "SF Mono", Monaco, "Cascadia Code", monospace;
```

### Font Sizes
```css
--text-xs: 12px;     /* Captions */
--text-sm: 13px;     /* Secondary text */
--text-base: 14px;   /* Body text (default) */
--text-lg: 16px;     /* Large body */
--text-xl: 18px;     /* Subheadings */
--text-2xl: 20px;    /* Section headings */
--text-3xl: 24px;    /* Page titles */
```

### Font Weights
```css
--font-normal: 400;     /* Body text */
--font-medium: 500;     /* Emphasis, labels */
--font-semibold: 600;   /* Subheadings */
--font-bold: 700;       /* Headings */
```

### Line Heights
```css
--leading-tight: 1.25;     /* Headings */
--leading-normal: 1.5;     /* Body text */
--leading-relaxed: 1.75;   /* Long-form */
```

**Common Combos**:
```css
h1 { font-size: 24px; font-weight: 700; line-height: 1.25; }
h2 { font-size: 20px; font-weight: 600; line-height: 1.25; }
h3 { font-size: 18px; font-weight: 600; line-height: 1.5; }
p  { font-size: 14px; font-weight: 400; line-height: 1.5; }
```

---

## ⭕ Border Radius

```css
--radius-sm: 6px;    /* Buttons, inputs */
--radius-md: 8px;    /* Cards, list items */
--radius-lg: 12px;   /* Modals, panels */
--radius-xl: 16px;   /* Large containers */
--radius-full: 9999px; /* Circular */
```

---

## 🌑 Shadows

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

**Usage**:
- Hover: `shadow-sm`
- Dropdowns: `shadow-md`
- Modals: `shadow-lg`
- Main panels: `shadow-xl`

---

## 🎯 Icons

### Sizes
```css
--icon-xs: 14px;   /* Inline with text */
--icon-sm: 16px;   /* Default UI */
--icon-md: 20px;   /* Large buttons */
--icon-lg: 24px;   /* Headers */
--icon-xl: 32px;   /* Feature highlights */
```

### Common Icons (Lucide)
```typescript
import { 
    Bookmark, BookmarkCheck,
    Folder, FolderOpen,
    Search, Filter,
    Plus, Minus, X,
    Edit2, Trash2,
    Eye, EyeOff,
    ChevronDown, ChevronRight,
    Check, AlertCircle,
    Copy, Download, Upload,
    Settings,
    MoreHorizontal
} from 'lucide';
```

---

## ⏱️ Animations

### Duration
```css
--duration-fast: 150ms;    /* Micro-interactions */
--duration-base: 200ms;    /* Standard */
--duration-slow: 300ms;    /* Complex */
```

###Easing
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

**Standard Transition**:
```css
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
/* Or using tokens: */
transition: all var(--duration-base) var(--ease-in-out);
```

---

## 🧩 Component Quick Reference

### Button
```css
.btn {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    transition: all var(--duration-fast);
}

.btn-primary {
    background: var(--primary-600);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-700);
}
```

### Input
```css
.input {
    padding: var(--space-3);
    border: 1.5px solid var(--gray-200);
    border-radius: var(--radius-sm);
    font-size: var(--text-base);
}

.input:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### Card
```css
.card {
    padding: var(--space-6);
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
}
```

### Modal
```css
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
}

.modal-container {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    max-width: 560px;
    max-height: 90vh;
}
```

---

## ✅ Do's & Don'ts

### Colors
```css
/* ✅ Do */
color: var(--gray-900);        /* Use design tokens */
background: var(--primary-50);

/* ❌ Don't */
color: #333333;                /* Hardcoded values */
background: lightblue;
```

### Spacing
```css
/* ✅ Do */
margin: var(--space-4);        /* Use 8px grid */
gap: var(--space-2);

/* ❌ Don't */
margin: 15px;                  /* Arbitrary values */
gap: 7px;
```

### Typography
```css
/* ✅ Do */
font-size: var(--text-base);   /* Use type scale */
font-weight: var(--font-medium);

/* ❌ Don't */
font-size: 15px;               /* Off-scale size */
font-weight: 550;
```

---

## 🏃 Common Patterns

### Hover State
```css
.element {
    background: var(--gray-50);
    transition: all var(--duration-fast);
}

.element:hover {
    background: var(--gray-100);
}
```

### Focus State
```css
.element:focus {
    outline: 2px solid var(--primary-500);
    outline-offset: 2px;
}

/* Or for inputs */
.input:focus {
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### Disabled State
```css
.element:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

### Loading State
```css
.element.loading {
    pointer-events: none;
    opacity: 0.6;
}

.element.loading::after {
    content: '';
    /* Spinner animation */
}
```

---

## 🎨 Platform-Specific Styles

### ChatGPT
```css
.chatgpt-badge {
    background: var(--chatgpt-light);  /* #D1FAE5 */
    color: var(--chatgpt-dark);        /* #065F46 */
}

.chatgpt-icon {
    color: #10A37F;  /* ChatGPT brand color */
}
```

### Gemini
```css
.gemini-badge {
    background: var(--gemini-light);   /* #DBEAFE */
    color: var(--gemini-dark);         /* #1E40AF */
}

.gemini-icon {
    color: #4285F4;  /* Gemini brand color */
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## ♿ Accessibility Checklist

- [ ] Color contrast ≥ 4.5:1 for text
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (2px outline)
- [ ] ARIA labels for icon-only buttons
- [ ] Support `prefers-reduced-motion`
- [ ] Minimum 32px touch targets
- [ ] Semantic HTML elements

---

## 🔗 Related Files

- **Full Documentation**: `design_system.md`
- **UI Redesign PRD**: `ui_redesign_prd.md`
- **Search Logic PRD**: `search_logic_prd.md`
- **Implementation Plan**: `implementation_plan.md`

---

**Last Updated**: 2025-12-16  
**For questions**: Contact Design Team
