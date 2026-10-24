# Vaultix Web Console - UI Components & Design System

This document outlines the UI component library, design tokens, modal architectures, and interactive primitives implemented in the **Vaultix Web Console**.

---

## 1. Design System Tokens & Foundations

The frontend uses **Tailwind CSS v4** with a curated, high-contrast monochrome design system inspired by **Clerk** and **Vercel**:

### Color Palette
- **Base Neutral**: Tailored `zinc` scale (`zinc-50` through `zinc-950`).
- **Surface Elevation**:
  - Light mode: Pure white (`#ffffff`) surfaces with subtle `zinc-200` borders and soft shadows.
  - Dark mode: Deep `zinc-900` / `zinc-950` cards with semi-transparent `zinc-800/80` borders and dark backdrop blur.
- **Accents**:
  - **Success / Emerald**: `emerald-600` / `emerald-400` with `emerald-500/10` backgrounds for verified badges and active postures.
  - **Warning / Amber**: `amber-600` / `amber-400` with `amber-500/10` backgrounds for unverified badges and emergency recovery codes.
  - **Destructive / Red**: `red-600` / `red-400` with `red-500/10` backgrounds for input error outlines and confirmation buttons.

---

## 2. Core UI Primitives

Located in [`src/components/ui/`](../src/components/ui/):

| Component | File | Description |
| :--- | :--- | :--- |
| **`Button`** | `button.tsx` | Variants: `default` (black/white), `outline`, `ghost`, `secondary`, `destructive`. Sizes: `sm` (h-8), `default` (h-9), `lg` (h-10). |
| **`Input`** | `input.tsx` | Monospace-ready form inputs with focus rings, hover transitions, and error boundary support. |
| **`Card`** | `card.tsx` | Composable container primitives: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`. |
| **`Badge`** | `badge.tsx` | Compact status tags: `default`, `secondary`, `success` (green), and `outline`. |
| **`ThemeToggle`** | `ThemeToggle.tsx` | Animated theme switcher cycling through Light, Dark, and System preferences. |

---

## 3. Specialized Domain Components

### `PhoneInput` ([`src/components/ui/PhoneInput.tsx`](../src/components/ui/PhoneInput.tsx))
An enterprise-grade international phone number selector:
- **Country Database**: Complete ISO 3166-1 directory of 245+ countries ([`countries.ts`](../src/components/ui/countries.ts)) with country codes, dial prefixes (`+1`, `+91`, etc.), and flag assets.
- **Live Search**: Dropdown popover includes a real-time search input filtering by country name or dial code.
- **Auto-Detection**: Dynamically resolves the user's initial country from browser timezone settings or provided overrides.
- **Standard Formatting**: Formats outputs to standard E.164 strings (e.g., `+916387778976`) while maintaining clean national digit input.
- **Inline Validation**: Seamlessly integrates with form error states to highlight invalid dial codes or incomplete phone lengths.

---

## 4. Modal Dialogs & Credential Workflows

Located in [`src/features/dashboard/components/`](../src/features/dashboard/components/):

### `VerifyEmailModal`
- Dispatches a 6-digit verification code to the user's primary email address.
- Monospace 6-digit input with numeric filtering.
- 60-second countdown timer for code resend.
- Immediate profile synchronization on success.

### `VerifyPhoneModal`
- Dispatches an SMS verification OTP to the user's registered phone number.
- Inline error presentation directly below the input field on invalid code entry.
- 60-second cooldown timer.
- Refreshes profile state, transitioning the user's phone status to **Verified**.

### `ChangeEmailModal`
- Two-step flow:
  1. Input new email address with format and duplicate checking.
  2. Input confirmation OTP sent to the new email.
- Displays security warning that active sessions will be invalidated.
- Redirects to `/login` upon completion.

### `ChangePhoneNumberModal`
- Adaptive modal supporting both **Add Phone** (when none is attached) and **Change Phone**.
- Integrates the `PhoneInput` country selector.
- Dispatches SMS OTP to the target number.
- Confirms ownership, updates database, invalidates existing sessions, and redirects to `/login`.

### `ChangePasswordModal`
- Enforces strict password requirements (minimum 8 characters, mixed case, numbers, special characters).
- Client-side confirmation matching before API submission.
- Does not disclose internal hashing algorithms or encryption parameters.

### `ChangeUsernameModal`
- Validates alphanumeric constraints and lowercase formatting.
- Instant feedback on username collision or reservation.

---

## 5. Passkey & WebAuthn Dialogs

Located in [`src/features/passkeys/components/`](../src/features/passkeys/components/):

### `RegisterPasskeyModal`
- Prompts for an optional device nickname (e.g., "MacBook Pro", "YubiKey 5C").
- Communicates with `@simplewebauthn/browser`'s `startRegistration` ceremony to interface with browser biometrics.
- Dispatches public key attestation to `POST /auth/webauthn/register`.
- Automatically refreshes the passkey list and updates `user.passkey_enabled`.

### `RenamePasskeyModal`
- Allows modifying existing passkey labels via `PATCH /auth/mfa/passkeys/{id}`.
- Inline validation with 128-character limits.

### `DeletePasskeyModal`
- Safety confirmation modal before permanently deleting a registered credential (`DELETE /auth/mfa/passkeys/{id}`).
- Highlights security consequences and automatically updates account status if zero passkeys remain.
