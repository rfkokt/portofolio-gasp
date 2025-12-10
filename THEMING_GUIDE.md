# RDev Portfolio Theming Guide

This guide explains how to build new pages and components that automatically adapt to Light and Dark modes using our semantic design system.

## Core Concept: Semantic Variables

Instead of using fixed colors (like `bg-white` or `text-black`), we use **Semantic Variables**. These variables change their value depending on the active theme.

| Tailwind Class | Description | Light Mode Meaning | Dark Mode Meaning |
| :--- | :--- | :--- | :--- |
| `bg-background` | Main page background | **White** (`oklch(0.985 0 0)`) | **Black** (`oklch(0.05 0 0)`) |
| `text-foreground` | Main body text | **Black** (`oklch(0.1 0 0)`) | **White** (`oklch(0.985 0 0)`) |
| `text-muted-foreground`| Secondary/Subtitle text | **Gray** | **Gray** (adjusted for contrast) |
| `border-border` | Default border color | **Light Gray** | **Dark Gray** |
| `bg-muted` | Secondary backgrounds (cards/items) | **Off-White** | **Dark Gray** |

---

## 🚀 Quick Start: Building a New Page

Always start your page containers with the base background and text colors:

```tsx
export default function NewPage() {
  return (
    // ✅ CORRECT: Adapts to theme
    <main className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold">New Page Title</h1>
      <p className="text-muted-foreground">This is a subtitle.</p>
    </main>
  );
}
```

❌ **AVOID THIS:**
```tsx
// ❌ WRONG: Will look broken in one of the modes
<main className="min-h-screen bg-white text-black"> 
```

---

## 📝 Building Forms

When creating inputs and forms, use `border-input` and `bg-background` to ensure they are readable.

```tsx
<div className="flex flex-col gap-2">
  <label className="text-sm font-medium text-foreground">Email</label>
  <input 
    type="email" 
    className="
      bg-background 
      border border-input 
      text-foreground 
      placeholder:text-muted-foreground 
      rounded-md px-4 py-2
      focus:ring-1 focus:ring-foreground
    "
    placeholder="Enter your email" 
  />
</div>
```

---

## 🃏 Building Cards

For cards or isolated sections, use `border-border` for outlines or `bg-muted` for filled styles.

```tsx
<div className="border border-border rounded-xl p-6 hover:bg-muted/50 transition-colors">
  <h3 className="text-xl font-bold text-foreground">Card Title</h3>
  <p className="text-muted-foreground mt-2">
    Card description text goes here.
  </p>
</div>
```

---

## ✨ Special Elements

### Section Labels (Floating Tags)
We have a global utility class `.section-label` that handles the styling for floating tags like `[ 01. ABOUT ]`.

```tsx
<div className="section-label">[ 05. NEW SECTION ]</div>
```
*Note: This usually requires `relative` on the parent container.*

### Active State
To highlight a label (e.g., via ScrollTrigger), verify that your logic toggles the `.active` class. The CSS automatically handles the color inversion.

```css
/* Defined in globals.css */
.section-label.active {
    background: var(--foreground); /* Black in Light, White in Dark */
    color: var(--background);      /* White in Light, Black in Dark */
}
```

---

## 🎨 Troubleshooting

**"My text is invisible in Light Mode!"**
*   **Cause:** You likely used `text-white` or `mix-blend-difference` on a white background.
*   **Fix:** Change `text-white` to `text-foreground`. Remove `mix-blend-difference`.

**"My button looks weird in Dark Mode!"**
*   **Cause:** You hardcoded a border color like `border-gray-200`.
*   **Fix:** Use `border-border` or `border-white/10`.
