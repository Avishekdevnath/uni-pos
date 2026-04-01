# UniMart POS - Distribution Guide

**Status:** Production-Ready with Full Branding

## Branding & UI/UX Updates
- ✓ Professional logo mark + wordmark (serif) in TopBar
- ✓ Branded login screen with logo and welcome message
- ✓ Responsive Logo component (sm/md/lg sizes)
- ✓ Consistent accent color theming throughout

## Distribution Options

### Option 1: ZIP Distribution (Recommended for Now)
- **File**: `out/UniMartPOS-1.0.0-win32-x64.zip` (136 MB)
- **Distribution**: Direct download or cloud storage
- **Installation**: Users extract ZIP and run `UniMartPOS.exe`
- **Pros**: No dependencies, works immediately, fully branded UI, easiest to distribute
- **Cons**: Larger file size

### Option 2: Portable Executable
- **File**: `out/UniMartPOS-win32-x64/UniMartPOS.exe` (213 MB)
- **Distribution**: Direct file sharing
- **Installation**: Run directly
- **Pros**: Single file, no extraction needed
- **Cons**: Larger single file

### Option 3: Installer (Requires System Setup)
**Currently unavailable** - Requires Windows SDK/Build Tools
- Would use Squirrel.Windows to create `UniMartPOS-Setup.exe`
- Future: Install Windows SDK and run `pnpm --filter pos make` again

## Quick Start for Users

### Using ZIP Distribution:
1. Download `UniMartPOS-1.0.0-win32-x64.zip`
2. Extract to desired location (e.g., `C:\Program Files\UniMartPOS`)
3. Run `UniMartPOS.exe`

### System Requirements:
- Windows 7 or later
- No additional software required (.NET, Node.js, etc.)
- ~500 MB disk space

## Backend Configuration
The app is configured to connect to: `http://uni-pos-backend.vercel.app/api/v1`

If you need to change this for development or testing, edit `apps/pos/.env` and rebuild:
```bash
pnpm --filter pos make
```

## Logo & Branding Components

### Logo Component Usage
Located at: `apps/pos/src/components/shared/Logo.tsx`

Used in:
- **TopBar** - Displays full logo (md size) with wordmark
- **Login Form** - Displays prominent logo (lg size) above login fields
- **Can be reused** - With size props: `sm`, `md`, `lg` and `showText` toggle

### Customization
To modify logo, colors, or typography:
1. Logo mark: Update the "U" initial in `Logo.tsx` line 34
2. Wordmark: Change "uniPOS" and "Billing System" text in `Logo.tsx`
3. Colors: Logo uses `var(--accent)` and `var(--bg)` CSS variables from `apps/pos/src/index.css`

### Logo Sizes
- `sm`: 20px mark, 12px text (compact use)
- `md`: 34px mark, 18px text (topbar, default)
- `lg`: 48px mark, 24px text (login, splash screens)

## Development Environment
- `.env` - Development (localhost:3001)
- `.env.production` - Production (uni-pos-backend.vercel.app)
- Start dev: `pnpm --filter pos start`
- Rebuild: `pnpm --filter pos make`
