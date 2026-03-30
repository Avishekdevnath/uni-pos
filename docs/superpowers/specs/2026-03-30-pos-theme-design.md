# POS Theme Design Spec

**Date:** 2026-03-30
**Status:** Draft
**Scope:** Add polished light and dark themes to the Electron POS app with OS-aware defaults and device-local override controls.

---

## 1. Overview

The POS app currently has a single dark-only visual system driven by semantic CSS variables in `apps/pos/src/index.css`. The goal of this change is to add a production-usable light theme without rewriting component markup or creating parallel styling logic.

The design keeps semantic theme tokens as the single source of truth and adds a small theme preference layer that:

1. follows the operating system color scheme by default
2. allows a device-local manual override
3. exposes both a quick toggle in the shell header and an explicit three-state control in Settings

This is a presentation-layer feature only. It does not change backend data contracts or branch settings.

---

## 2. Objectives

### 2.1 Primary Outcomes

- Operators can use the POS in both dark and light themes.
- New terminals follow the OS color scheme automatically.
- Operators can override that behavior locally without affecting other terminals.
- Theme changes apply immediately across the shell without reload.

### 2.2 Success Definition

- Theme preference supports `system`, `light`, and `dark`.
- The effective theme resolves correctly from OS preference when `system` is selected.
- All existing shell/components continue to use the same semantic color classes.
- Theme selection is persistent across app restarts on the same device.

### 2.3 Non-Goals

- No backend persistence for theme choice.
- No branch-wide shared theme setting.
- No Tailwind `dark:` migration across all components.
- No redesign of individual screens beyond palette/token polish and minimal theme controls.

---

## 3. In Scope / Out of Scope

### In Scope

- Dual theme token sets in `apps/pos/src/index.css`
- Theme preference state in the POS app store
- DOM theme synchronization through `document.documentElement`
- Header quick toggle
- Settings page theme control
- Local persistence and system-theme tracking
- Unit tests for preference resolution and DOM synchronization

### Out of Scope

- Backend settings endpoints for theming
- Per-user server-side preferences
- Separate high-contrast or accessibility theme variants
- Full UI redesign beyond token refinements needed for light mode

---

## 4. Architecture Decisions

### 4.1 Theme Model

Use two concepts:

- `themePreference`: the saved operator choice, one of `system | light | dark`
- `resolvedTheme`: the actual active theme, one of `light | dark`

`resolvedTheme` is derived:

- `light` if preference is `light`
- `dark` if preference is `dark`
- OS-dependent if preference is `system`

This avoids storing redundant state while still giving the UI clear access to both "what the user chose" and "what is active now."

### 4.2 State Ownership

Extend `apps/pos/src/store/app-store.ts` rather than adding a new provider.

Reasons:

- shell-level view state already lives there
- theme is global UI state, not domain data
- `zustand` is already the app pattern for terminal-wide state

### 4.3 Persistence Strategy

Persist only `themePreference` to `localStorage` using a POS-specific key such as `uni-pos.pos.theme-preference`.

Rules:

- missing key -> default to `system`
- invalid key -> fallback to `system`
- persistence is device-local only

### 4.4 DOM Sync Strategy

Write the active theme to `document.documentElement.dataset.theme`.

Example:

- `data-theme="light"`
- `data-theme="dark"`

This lets CSS switch token values without touching component class names or introducing runtime class toggling across the tree.

### 4.5 System Theme Tracking

When preference is `system`, subscribe to `window.matchMedia('(prefers-color-scheme: dark)')`.

Rules:

- if the OS theme changes, update `resolvedTheme` immediately
- if preference is explicit `light` or `dark`, OS changes are ignored
- if `matchMedia` is unavailable, fallback to `light`

---

## 5. Styling Strategy

### 5.1 Token Contract

Keep the existing semantic variables as the public contract used by Tailwind and component classes:

- `--bg`
- `--surface`
- `--surface2`
- `--surface3`
- `--accent`
- `--accent-dim`
- `--green`
- `--red`
- `--amber`
- `--blue`
- `--text1`
- `--text2`
- `--text3`
- `--border`
- `--border2`

Components should continue to render classes like `bg-surface`, `text-text1`, and `border-border`.

### 5.2 Theme Definitions

Define two full palettes in `apps/pos/src/index.css`:

- dark theme: preserve the current POS direction with minor polish only
- light theme: neutral, readable, and professional, avoiding a flat white-only look

The light theme should include:

- soft tinted page background rather than pure white
- clear surface separation for cards and side panels
- strong text contrast without harsh black-on-white
- the same semantic accent and status behavior as dark mode

### 5.3 Global Theme Hooks

Global styles should react to `data-theme` for:

- root tokens
- body background treatment
- scrollbar styling
- selection styling
- legacy login card styling still used outside the new shell components

---

## 6. Component Changes

### 6.1 App Store

Update `apps/pos/src/store/app-store.ts` to include:

- `themePreference`
- `setThemePreference(preference)`
- `toggleTheme()`

`toggleTheme()` behavior:

- if active theme is dark, switch to explicit `light`
- if active theme is light, switch to explicit `dark`
- if current preference is `system`, use the current resolved theme to decide the opposite explicit target

### 6.2 Shell-Level Theme Sync

Add a small synchronization hook or effect at shell level, likely in `apps/pos/src/components/shell/AppShell.tsx` or a dedicated theme utility.

Responsibilities:

- read `themePreference`
- compute `resolvedTheme`
- apply `data-theme` to `document.documentElement`
- subscribe/unsubscribe to `matchMedia` updates when needed

This logic should remain isolated from feature pages.

### 6.3 Top Bar

Add a compact theme toggle in `apps/pos/src/components/shell/TopBar.tsx`.

Requirements:

- sit near the clock and window controls
- clearly indicate current theme intent
- one click switches between explicit light and dark
- when preference is `system`, the button still behaves predictably by flipping to the opposite explicit mode based on the current resolved theme

### 6.4 Settings Page

Add a dedicated Theme section to `apps/pos/src/components/settings/SettingsPage.tsx`.

Requirements:

- three visible options: `System`, `Light`, `Dark`
- show current resolved theme when `System` is selected
- update immediately on selection
- theme preference remains local and should not be sent in branch settings PATCH payload

The current "Save Changes" flow in Settings applies only to branch settings. Theme controls should not depend on that save button.

---

## 7. Data Flow

1. App store initializes `themePreference` from `localStorage`
2. Theme sync logic resolves the active theme
3. Theme sync logic writes `data-theme` to `<html>`
4. `index.css` token definitions react to `data-theme`
5. Existing components re-render naturally using unchanged semantic classes
6. Header toggle or Settings controls update `themePreference`
7. Updated preference persists back to `localStorage`

If preference is `system`, an OS theme change re-runs steps 2 through 5 without modifying the saved preference.

---

## 8. Error Handling And Edge Cases

- Invalid stored preference: ignore and reset behavior to `system`
- Missing `localStorage`: use in-memory fallback for the session
- Missing `matchMedia`: resolve `system` as `light`
- Repeated DOM writes: safe and idempotent
- Early render before sync completes: default theme should be stable enough to avoid major flash; current implementation may accept a small first-render mismatch if needed, but the design should prefer immediate initialization where practical

---

## 9. Testing Strategy

### Unit Tests

- store initializes with `system` when storage is empty
- store ignores invalid stored preference
- setting preference persists expected value
- toggle switches from dark to light
- toggle switches from light to dark
- toggle from `system` respects current resolved theme

### Integration/DOM Tests

- resolved theme writes `data-theme="light"` when appropriate
- resolved theme writes `data-theme="dark"` when appropriate
- `system` mode follows mocked `matchMedia`
- OS theme change updates the DOM when preference is `system`
- explicit light/dark preferences do not change on OS theme events

### Manual Verification

- start POS app on a dark OS theme and confirm initial dark render
- start POS app on a light OS theme and confirm initial light render
- switch via TopBar and confirm immediate shell update
- switch via Settings and confirm persistence after restart
- return to `System` and confirm OS theme changes are reflected live

---

## 10. Risks And Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Light palette exposes low-contrast component states | unreadable UI in some panels | keep semantic tokens centralized and test key pages under both themes |
| Theme control mixes with branch settings save flow | confusing operator behavior | keep theme state local and independent from branch settings mutation |
| OS theme listener leaks or duplicates | stale updates or unnecessary handlers | isolate listener setup/cleanup in one theme sync effect |
| Incomplete token coverage | some screens remain dark-biased in light mode | keep existing semantic token contract and verify each referenced token has both theme values |

---

## 11. Deliverables

1. Theme preference support in POS app store
2. Light and dark token sets in `apps/pos/src/index.css`
3. Theme synchronization logic for DOM + OS preference tracking
4. TopBar quick toggle
5. Settings page theme controls
6. Regression tests for preference resolution and DOM application
