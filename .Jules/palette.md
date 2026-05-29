## 2026-05-29 - Next.js Link and Button Accessibility
**Learning:** Next.js `<Link>` components render as `<a>` tags by default. Placing a `<button>` inside them results in invalid HTML (nested interactive elements) and screen reader issues.
**Action:** Use a `<div>` inside a `<Link>` instead of a `<button>` and apply focus states (`focus-visible`) directly to the `<Link>` element to maintain visual styling and ensure valid, accessible HTML.
