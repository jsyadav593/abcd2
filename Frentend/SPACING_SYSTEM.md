# Spacing System Documentation

## Overview

The frontend use a **CSS Variables-based Spacing System** that allows you to scale all padding, margins, gaps, and border-radius values throughout the entire application by changing a **single value**.

This ensures consistency and makes it easy to adjust the overall visual density of the interface.

---

## How It Works

### Base Spacing Unit

In `src/index.css`, there is a root CSS variable:

```css
:root {
  --base-spacing: 1rem;
  /* All other spacing values are calculated from this */
}
```

The `--base-spacing` is set to `1rem` (16px by default in most browsers).

### Spacing Scale

All spacing values are **multiples of the base spacing**:

```css
--spacing-xs:   calc(var(--base-spacing) * 0.25);   /* 0.25rem = 4px */
--spacing-sm:   calc(var(--base-spacing) * 0.5);    /* 0.5rem = 8px */
--spacing-md:   var(--base-spacing);                 /* 1rem = 16px */
--spacing-lg:   calc(var(--base-spacing) * 1.5);    /* 1.5rem = 24px */
--spacing-xl:   calc(var(--base-spacing) * 2);      /* 2rem = 32px */
--spacing-2xl:  calc(var(--base-spacing) * 3);      /* 3rem = 48px */
--spacing-3xl:  calc(var(--base-spacing) * 4);      /* 4rem = 64px */
```

### Border Radius Scale

Border radius also follows the same pattern:

```css
--radius:       0.5rem;
--radius-sm:    calc(var(--radius) * 0.5);
--radius-lg:    calc(var(--radius) * 1.5);
```

---

## How to Use in CSS

Instead of hardcoding values like `padding: 10px;` or `margin: 1rem;`, use the spacing variables:

### ❌ Wrong (Hardcoded)
```css
.button {
  padding: 10px 20px;
  margin: 1rem;
  border-radius: 6px;
  gap: 8px;
}
```

### ✅ Correct (Using Variables)
```css
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  margin: var(--spacing-md);
  border-radius: var(--radius);
  gap: var(--spacing-xs);
}
```

---

## How to Customize the Spacing

### Option 1: Scale Everything Proportionally

To make the entire UI **larger** or **smaller**, change the `--base-spacing` value:

#### Step 1: Open `src/index.css`

```css
:root {
  /* Change this single value to scale the entire app */
  --base-spacing: 1rem;  /* Default */
}
```

#### Step 2: Adjust the value

**Example 1: Make everything 25% smaller**
```css
--base-spacing: 0.75rem;  /* 12px */
```

**Example 2: Make everything 25% larger**
```css
--base-spacing: 1.25rem;  /* 20px */
```

**Example 3: Increase by 50%**
```css
--base-spacing: 1.5rem;  /* 24px */
```

#### Step 3: Refresh the browser

All spacing throughout the app will automatically update! ✨

---

### Option 2: Adjust Border Radius

To change how rounded corners are:

```css
:root {
  /* Default is 0.5rem */
  --radius: 0.5rem;         /* More rounded */
  /* or */
  --radius: 0.25rem;        /* Less rounded */
}
```

---

### Option 3: Adjust Specific Sizes

You can also override individual sizes without changing the base:

```css
:root {
  --base-spacing: 1rem;
  
  /* Override specific size */
  --spacing-sm: 6px;        /* Custom value */
  --spacing-md: 16px;       /* Custom value */
}
```

---

## Examples

### Example 1: Desktop Layout (Default)
```css
:root {
  --base-spacing: 1rem;     /* 16px */
}
```

All spacing: 4px, 8px, 16px, 24px, 32px, 48px, 64px

---

### Example 2: Compact Mobile Layout
```css
:root {
  --base-spacing: 0.75rem;  /* 12px */
}
```

All spacing: 3px, 6px, 12px, 18px, 24px, 36px, 48px

---

### Example 3: Spacious Desktop Layout
```css
:root {
  --base-spacing: 1.25rem;  /* 20px */
}
```

All spacing: 5px, 10px, 20px, 30px, 40px, 60px, 80px

---

## Where Spacing Variables Are Used

Currently implemented in:

- ✅ `src/index.css` - Global variables definition
- ✅ `src/pages/Users/Users.css` - User table components
- ✅ `src/components/Forms/Forms.css` - Form styling
- ✅ `src/components/Layout/Layout.css` - Main layout

### To Update Other Files

Search for hardcoded values like:
- `padding: 1rem;` → `padding: var(--spacing-md);`
- `margin: 0.5rem;` → `margin: var(--spacing-sm);`
- `gap: 12px;` → `gap: var(--spacing-sm);`
- `border-radius: 8px;` → `border-radius: var(--radius);`

---

## Quick Reference Table

| Variable | Default | Pixels |
|----------|---------|--------|
| `--spacing-xs` | 0.25rem | 4px |
| `--spacing-sm` | 0.5rem | 8px |
| `--spacing-md` | 1rem | 16px |
| `--spacing-lg` | 1.5rem | 24px |
| `--spacing-xl` | 2rem | 32px |
| `--spacing-2xl` | 3rem | 48px |
| `--spacing-3xl` | 4rem | 64px |
| `--radius` | 0.5rem | 8px |
| `--radius-sm` | 0.25rem | 4px |
| `--radius-lg` | 0.75rem | 12px |

---

## Live Preview

Once you change `--base-spacing`, refresh the page (<kbd>F5</kbd> or <kbd>Ctrl+R</kbd>) to see all changes applied instantly.

---

## Benefits

✅ **Consistency** - All spacing follows a unified scale  
✅ **Maintainability** - Change once, apply everywhere  
✅ **Flexibility** - Easy to support multiple layouts (mobile, tablet, desktop)  
✅ **Scalability** - Add new sizes without breaking existing code  
✅ **Performance** - No JavaScript needed, pure CSS  

---

## Tips

1. **Always use variables** - Never hardcode `px` or `rem` for spacing
2. **Choose appropriate sizes** - Use `--spacing-sm` for small gaps, `--spacing-md` for standard padding
3. **Test responsively** - Test changes on mobile, tablet, and desktop
4. **Document custom values** - If you override defaults, add comments explaining why

---

## Need Help?

If unsure which variable to use:

- **Very small gaps**: Use `--spacing-xs`
- **Small padding**: Use `--spacing-sm`
- **Standard padding/margin**: Use `--spacing-md`
- **Large sections**: Use `--spacing-lg` or `--spacing-xl`
- **Borders**: Use `--radius` or `--radius-lg`

