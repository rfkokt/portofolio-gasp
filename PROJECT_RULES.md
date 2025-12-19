# Project Rules & Developer Guidelines

## Technical Constraints

### 1. Environment Variables in Scripts & Docker
**Rule:** External scripts (like `scripts/ai-blogger.mjs`) MUST use **conditional/dynamic imports** for `dotenv`.

**Why:**
Next.js Docker builds use "Standalone Mode" (`output: 'standalone'`). This mode prunes `node_modules` to only include dependencies required by the Next.js app itself. Snippets or scripts outside the main app flow (like standalone maintenance scripts) might not have their specific dependencies (like `dotenv`) included in the production image if they aren't used in the main app.

**Implementation Pattern:**
Instead of `import 'dotenv/config';`, use:
```javascript
// Dynamic import for local dev support
try {
    await import('dotenv/config');
} catch (e) {
    // Ignore in production (env vars provided by Docker/System)
}
```

This ensures:
- **Local Dev:** `.env` file is loaded.
- **Production:** No crash if `dotenv` module is missing (variables are properly injected by Docker/Compose anyway).
