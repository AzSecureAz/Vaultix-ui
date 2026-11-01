# Vaultix Web Console - UI Components & Design System

Comprehensive reference guide for the design tokens, surface layering, Radix UI primitives, domain-specific components, and modal dialog architectures implemented in the **Vaultix Web Console**.

---

## 1. Design System Tokens & Foundations

The frontend uses **Tailwind CSS v4** with a high-contrast monochrome design system inspired by **Clerk** and **Linear**:

### 1.1 Color Palette & Surface Hierarchy
- **Base Neutrals**: Tailored `zinc` spectrum (`zinc-50` through `zinc-950`).
- **Surface Elevation Tokens**:
  - `--surface-0`: Page canvas background (`#fafbfc` light / `#09090b` dark).
  - `--surface-1`: Primary card and modal containers (`#ffffff` light / `#111116` dark).
  - `--surface-2`: Subtle inset panels, table headers, and badges (`#f4f4f6` light / `#18181f` dark).
  - `--surface-border`: High-definition container borders (`rgba(228, 228, 231, 0.9)` light / `rgba(255, 255, 255, 0.08)` dark).
- **Semantic Accents**:
  - **Success / Emerald**: `emerald-600` / `emerald-400` with `emerald-500/10` backgrounds for verified status tags and active sessions.
  - **Warning / Amber**: `amber-600` / `amber-400` with `amber-500/10` backgrounds for unverified badges and recovery codes.
  - **Destructive / Red**: `red-600` / `red-400` with `red-500/10` backgrounds for error states and session revocation modals.

### 1.2 Specular Glass Surfaces & Pattern Effects
Defined in [`src/index.css`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/index.css):
- **`.glass-surface`**: Backdrop blur (`backdrop-filter: blur(16px)`) with subtle specular border reflections for cards and floating dialogs.
- **`.specular-top`**: Inset box-shadow highlight (`inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`) simulating overhead illumination.
- **`.bg-grid-pattern`**: Fine 32px enterprise grid pattern with soft radial falloff for login and splash screens.
- **Typography**: Form fields, OTP inputs, token hashes, and key IDs use tabular monospace fonts (`JetBrains Mono`, `Fira Code`).

---

## 2. Layout Components

Located in [`src/components/layout/`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/layout/):

### 2.1 `AppLayout` ([`AppLayout.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/layout/AppLayout.tsx))
- Master layout wrapper for all authenticated views.
- Mounts the [`Sidebar`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/layout/Sidebar.tsx), [`TopNav`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/layout/TopNav.tsx), [`SudoModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/sudo/SudoModal.tsx), and [`CommandPalette`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/CommandPalette.tsx).
- Manages mobile drawer toggle state with auto-close on route change.

### 2.2 `Sidebar` ([`Sidebar.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/layout/Sidebar.tsx))
- Desktop fixed navigation sidebar with collapsible responsive mobile drawer.
- Grouped navigation sections:
  - **Account & Security**: Dashboard, Connected Accounts, Active Sessions, Multi-Factor Auth, Passkeys.
  - **Administration**: Users, Roles, Permissions, Signing Keys.
- Active route highlighting with left accent indicators and Lucide icon pairings.

### 2.3 `TopNav` ([`TopNav.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/layout/TopNav.tsx))
- Top application bar featuring:
  - Mobile hamburger drawer toggle.
  - Quick-search search button launching the Command Palette (`Cmd+K` / `Ctrl+K`).
  - [`ThemeToggle`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/ThemeToggle.tsx) button.
  - [`UserButton`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/UserButton.tsx) avatar menu.

---

## 3. Core UI Primitives

Located in [`src/components/ui/`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/):

| Component | File | Variants & Features |
| :--- | :--- | :--- |
| **`Button`** | [`button.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/button.tsx) | `default` (black/white), `outline`, `ghost`, `secondary`, `destructive`. Supports Radix `Slot` (`asChild`). |
| **`Input`** | [`input.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/input.tsx) | Focus ring transitions, placeholder styling, tabular number alignment, and error states. |
| **`Card`** | [`card.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/card.tsx) | Composable hierarchy: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`. |
| **`Badge`** | [`badge.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/badge.tsx) | Status tags: `default`, `secondary`, `success` (green active posture), and `outline`. |
| **`Skeleton`** | [`skeleton.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/skeleton.tsx) | Shimmer placeholder elements during asynchronous data fetching. |
| **`ThemeToggle`** | [`ThemeToggle.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/ThemeToggle.tsx) | Animated switcher cycling between Light, Dark, and System preferences with media query synchronization. |
| **`Command`** | [`command.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/command.tsx) | Accessible command dialog primitives powered by `cmdk`. |

---

## 4. Specialized Domain Primitives

### 4.1 International Phone Input ([`PhoneInput.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/PhoneInput.tsx))
An enterprise international phone selector:
- **Comprehensive Database**: ISO 3166-1 database containing 245+ countries and territories ([`countries.ts`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/countries.ts)) with country codes, dial prefixes (`+1`, `+91`, etc.), and flag assets.
- **Searchable Country Popover**: Real-time filtering by country name or dial code prefix.
- **Automatic Browser Detection**: Resolves initial default country from user timezone/locale settings.
- **E.164 Formatting**: Generates clean E.164 strings (`+12025550199`) for backend storage while presenting user-friendly local digit formatting.
- **Privacy Masking**: Pairs with `maskPhoneNumber(...)` and the interactive **Eye / EyeOff** toggle to protect user PII in dashboards.

### 4.2 Global Command Palette ([`CommandPalette.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/CommandPalette.tsx))
- Universal keyboard shortcut listener for `Cmd+K` (macOS) and `Ctrl+K` (Windows/Linux).
- Instant fuzzy search across:
  - Navigation destinations (Dashboard, MFA, Passkeys, Sessions, Connected Accounts).
  - Admin tools (Users, Roles, Permissions, Signing Keys).
  - Quick actions (Toggle theme, change password, register passkey, log out).

---

## 5. Modal Dialogs & Credential Workflows

### 5.1 Profile & Security Modals ([`src/features/dashboard/components/`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/dashboard/components/))

| Modal Component | Trigger & Flow | Security Guards |
| :--- | :--- | :--- |
| [`VerifyEmailModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/dashboard/components/VerifyEmailModal.tsx) | Dispatches 6-digit verification code to email | 60-second countdown cooldown timer |
| [`VerifyPhoneModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/dashboard/components/VerifyPhoneModal.tsx) | Dispatches 6-digit SMS OTP to registered phone | Inline error presentation, 60s cooldown |
| [`ChangeEmailModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/dashboard/components/ChangeEmailModal.tsx) | Two-step request and OTP confirmation | Session invalidation warning, auto-redirect to `/login` |
| [`ChangePhoneNumberModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/dashboard/components/ChangePhoneNumberModal.tsx) | Adds or updates phone with `PhoneInput` + OTP verification | Session invalidation on change, auto-redirect to `/login` |
| [`ChangePasswordModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/dashboard/components/ChangePasswordModal.tsx) | Password change with current + new password fields | Client-side strength validation (8+ chars, mixed case, symbols) |
| [`ChangeUsernameModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/dashboard/components/ChangeUsernameModal.tsx) | Lowercase alphanumeric handle update | Instant reservation & collision checking |
| [`ChangeFullNameModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/dashboard/components/ChangeFullNameModal.tsx) | Update user display name | Immediate local state synchronization |
| [`DeleteAccountModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/dashboard/components/DeleteAccountModal.tsx) | Soft-deletes user account | Highlights 90-day grace recovery window before permanent purge |

### 5.2 Passkey Lifecycle Modals ([`src/features/passkeys/components/`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/passkeys/components/))

- **[`RegisterPasskeyModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/passkeys/components/RegisterPasskeyModal.tsx)**: Prompts for device nickname (e.g. "MacBook Pro Touch ID") and initiates the `@simplewebauthn/browser` registration ceremony.
- **[`RenamePasskeyModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/passkeys/components/RenamePasskeyModal.tsx)**: In-place label editing via `PATCH /auth/mfa/passkeys/{id}`.
- **[`DeletePasskeyModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/passkeys/components/DeletePasskeyModal.tsx)**: Deletion confirmation dialog. If zero passkeys remain, synchronizes `user.passkey_enabled = false`.

### 5.3 Session Revocation Modals ([`src/components/ui/`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/))

- **[`LogoutOtherModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/LogoutOtherModal.tsx)**: Confirmation dialog revoking all active sessions across other devices while keeping the current session intact (`POST /auth/logout-other`).
- **[`LogoutAllModal`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/components/ui/LogoutAllModal.tsx)**: Confirmation dialog revoking all platform sessions globally and routing the user to `/login` (`POST /auth/logout-all`).

### 5.4 Sudo Elevation Modal ([`SudoModal.tsx`](file:///c:/Users/vimal/Documents/Projects/Vaultix/ui/src/features/sudo/SudoModal.tsx))
- Automatically mounted by `AppLayout` and triggered by `useSudoStore.requestElevation()`.
- Presents selectable elevation options:
  - Current Password input.
  - Biometric Passkey ceremony (`startAuthentication`).
  - 6-digit TOTP code.
- On successful elevation, fulfills the pending Axios request promise and replays the original API call transparently.
