# Vaultix Web Console - Frontend Architecture & Technical Design

This document details the architectural patterns, client-side security mechanisms, state management lifecycles, and component design patterns governing the **Vaultix Web Console**.

---

## Architectural Data Flow

```
                      ┌────────────────────────────┐
                      │    Vaultix Web Console     │
                      │     (Port 3000 / 5173)     │
                      └─────────────┬──────────────┘
                                    │ /api/v1/**
                                    ▼
                      ┌────────────────────────────┐
                      │    Spring Cloud Gateway    │
                      │        (Port 8085)         │
                      └──────▲───────────────▲─────┘
                             │               │
               lb://authorization            │ lb://notification
                             ▼               ▼
                      ┌──────────────┐┌──────────────┐
                      │Authorization ││ Notification │
                      │ (Port 8082)  ││ (Port 8084)  │
                      └──────────────┘└──────────────┘
```

---

## 1. Routing & Security Access Control

The application uses **React Router 7** with centralized client-side access control:

- **Public Routes**: Accessible without authentication (`/login`, `/register`, `/forgot-password`). Handles external OAuth2 redirection callbacks cleanly.
- **Protected Layout (`MainLayout`)**: Wraps authenticated features:
  - `/dashboard`: Primary profile, password management, phone & email verification, and security overview.
  - `/connected-accounts`: Management of external identity providers (Google OIDC & GitHub OAuth2).
  - `/mfa`: Multi-factor authentication (TOTP Authenticator app, SMS MFA, and Emergency Recovery Codes).
  - `/passkeys`: WebAuthn / FIDO2 Level 3 biometric security keys.
- **Initialization State**: On application boot, `authStore.initialize()` queries `GET /api/v1/auth/me`. If the session is invalid or expired, the user is seamlessly redirected to `/login` with clean query preservation.

---

## 2. Authentication, Token Rotation & Concurrency Queue

API communication is managed by a customized **Axios client** ([`src/lib/api-client.ts`](../src/lib/api-client.ts)) implementing seamless JWT token rotation:

### Token Storage Strategy
- **Short-Lived Access Tokens**: Stored in memory / authorization headers (`Bearer <token>`).
- **Refresh Tokens**: Persisted exclusively in **`HttpOnly`**, **`SameSite=Strict`** cookies managed by the backend, eliminating exposure to Cross-Site Scripting (XSS).

### Concurrency Refresh Queue
When an access token expires:
1. The first intercepted `401 Unauthorized` request triggers a call to `/auth/public/refresh`.
2. A lock flag `isRefreshing = true` is engaged.
3. Concurrent requests during token rotation are queued in `failedQueue` as pending promises.
4. Upon successful refresh:
   - Queued requests are resolved and automatically retried with the new access token.
   - The queue is drained and reset.
5. If the refresh token has expired or been revoked:
   - All queued requests are rejected.
   - The auth store dispatches `logout()`, invalidating local state and routing to `/login`.

---

## 3. Global State Management

Application state is decoupled into specialized **Zustand 5** stores:

| Store | Location | Responsibility |
| :--- | :--- | :--- |
| **`useAuthStore`** | [`src/stores/authStore.ts`](../src/stores/authStore.ts) | User profile identity, authentication status, role & permission sets, session refresh, and logout routines. |
| **`useThemeStore`** | [`src/stores/themeStore.ts`](../src/stores/themeStore.ts) | Theme mode (`light` / `dark` / `system`), DOM class synchronization (`dark`), and `localStorage` persistence. |

---

## 4. Identity & Profile Lifecycle Management

The account profile portal ([`src/features/dashboard/DashboardPage.tsx`](../src/features/dashboard/DashboardPage.tsx)) provides self-service credential lifecycle actions:

### Primary Email Modification
1. **Initiation**: User specifies new email in `ChangeEmailModal`.
2. **Backend Event**: Dispatches `POST /auth/email/change/request`. Backend sends a 6-digit confirmation OTP to the new email address.
3. **Confirmation**: User submits the OTP to `POST /auth/email/change/confirm`.
4. **Session Invalidation**: Backend updates email, marks verified, revokes all active sessions for security, and returns a clean cookie. Frontend redirects the user to `/login`.

### International Phone Number Management & Privacy Controls
- Integrates the reusable `PhoneInput` with live country selection (245+ countries) and automatic dial code formatting.
- **Verification**: If `phone_number_verified` is false, displays amber `Unverified` badge and launches `VerifyPhoneModal` to send and verify an SMS OTP.
- **Add / Change Flow**: `ChangePhoneNumberModal` supports adding a phone number when empty and updating an existing one. Submits to `POST /auth/phone/change/request` and confirms with OTP via `POST /auth/phone/change/confirm`.
- **Phone Privacy Toggle**: Displays phone numbers masked by default (e.g., `+1 555-***-1234`) using `maskPhoneNumber(...)`. An interactive **Eye / EyeOff** toggle button allows users to reveal or hide their phone number securely across the Dashboard, SMS setup dialogs, and modification modals.

---

## 5. Two-Step Verification (MFA) Lifecycle

Configured in [`src/features/mfa/MfaPage.tsx`](../src/features/mfa/MfaPage.tsx) supporting both Authenticator Apps and SMS:

### 5.1 Authenticator App (RFC 6238 TOTP)
1. **Setup Initiation**: User clicks **Set Up** on the Authenticator factor (`POST /auth/mfa/totp/setup`).
2. **Secret Presentation**: Renders a dynamic QR code (`otpauth://`) alongside a manual Base32 secret key.
3. **Activation**: User enters 6-digit TOTP code (`POST /auth/mfa/totp/activate`).
4. **Recovery Codes Issuance**: Backend responds with 10 cryptographically generated emergency recovery codes (`TotpActivationResponse`). The frontend displays them in a secure grid with one-click **Copy All**.
5. **Disabling**: Clicking **Disable** opens a confirmation dialog, revoking TOTP credentials via `POST /auth/mfa/totp/disable`.

### 5.2 SMS Multi-Factor Authentication
1. **Prerequisite Check**: Verifies that the user has a verified phone number. If unverified or missing, launches the phone verification/setup modal.
2. **Setup Ceremony**: User clicks **Set Up** on the SMS factor (`POST /auth/mfa/sms/send-setup-otp`). A 60-second cooldown timer prevents abuse.
3. **Verification**: User inputs the 6-digit SMS OTP (`POST /auth/mfa/sms/enable`).
4. **Recovery Codes**: If this is the user's first MFA factor, 10 backup recovery codes are issued and displayed.
5. **Disabling**: User confirms disablement via `POST /auth/mfa/sms/disable`.

### 5.3 Unified Login Challenge Dialog
During sign-in, if `authResponse.mfa_required = true`:
- The client opens the MFA challenge dialog.
- The user can select their preferred verification method:
  - **Authenticator App**: Enter current 6-digit TOTP code.
  - **SMS Code**: Click "Send SMS code" (invoking `POST /auth/public/login/mfa/sms/send-otp`) and enter received code.
  - **Emergency Recovery Code**: Enter a single-use `xxxxx-xxxxx` backup code.
- Verification submits to `POST /auth/public/login/mfa`, establishing the authenticated session.

### 5.4 Recovery Codes Management
- Real-time remaining count loaded via `GET /auth/mfa/recovery-codes`.
- One-click code regeneration via `POST /auth/mfa/recovery-codes/regenerate` with security warning.

---

## 6. Passkeys & WebAuthn Level 3 Integration

Configured in [`src/features/passkeys/PasskeysPage.tsx`](../src/features/passkeys/PasskeysPage.tsx) using `@simplewebauthn/browser`:

### Registration Flow
1. **Challenge Options**: User clicks **Create Passkey**; frontend calls `POST /auth/webauthn/register/options`.
2. **Authenticator Ceremony**: Invokes `startRegistration({ optionsJSON })` to prompt Touch ID, Face ID, Windows Hello, or hardware security keys.
3. **Attestation Submission**: Submits credential attestation to `POST /auth/webauthn/register`. Backend validates cryptographic signature, registers the credential, and updates `user.passkey_enabled = true`.
4. **Label Customization**: Updates passkey nickname via `PATCH /auth/mfa/passkeys/{id}`.

### Passwordless Login Flow
1. **Assertion Options**: On the login page (`/login`), user clicks **Sign in with a passkey**; frontend calls `POST /auth/webauthn/authenticate/options`.
2. **Biometric Verification**: Invokes `startAuthentication({ optionsJSON })` to obtain biometric signature assertion.
3. **Session Issuance**: Submits assertion to `POST /auth/login/webauthn`. Backend validates the assertion, sets the `HttpOnly` refresh cookie, and returns the standard `AuthResponse` access token payload.

### Passkey Lifecycle Management
- **List Credentials**: Fetches authorized passkeys via `GET /auth/mfa/passkeys`.
- **Rename**: Allows renaming passkey labels anytime (`PATCH /auth/mfa/passkeys/{id}`).
- **Revocation**: Safely removes passkeys with confirmation (`DELETE /auth/mfa/passkeys/{id}`). If all passkeys are deleted, the backend automatically synchronizes `user.passkey_enabled = false`.

---

## 7. Social Identity Federation & Connected Accounts

Managed via [`src/features/connected-accounts/ConnectedAccountsPage.tsx`](../src/features/connected-accounts/ConnectedAccountsPage.tsx):

### Supported Identity Providers
- **Google OIDC**: Integrates Google Identity Services (`@react-oauth/google`). The frontend captures the cryptographic `id_token` and delivers it to `POST /auth/public/login/google` (login/register) or `POST /auth/social/google/link` (account linking).
- **GitHub OAuth2**: Initiates the GitHub authorization code grant flow, redirecting to GitHub and exchanging the `code` via `POST /auth/public/login/github` or `POST /auth/social/github/link`.

### Direct 1-Click Connect UX
- Both Google and GitHub offer direct, seamless 1-click connect actions without redundant intermediate confirmation modals.
- Real-time status cards display connection badges (`Connected` / `Not connected`), linked provider email addresses, and last connection timestamps.

### Account Unlinking Safety Invariant
- To prevent accidental account lockouts, if a user attempts to unlink a provider when no local password is set and no other login method exists, the backend and UI guard reject the action with a clear warning modal instructing them to configure a password or alternative authentication method first.

---

## 8. UX & Design Principles

- **Clerk-Inspired Aesthetics**: High contrast typography, dark/light mode parity, glassmorphic cards, rounded-2xl containers, and subtle micro-animations.
- **Contextual Inline Errors**: In accordance with enterprise form UX, error messages render directly below the relevant input field with red border outlines, eliminating bulky top notification banners.
- **Privacy by Default**: Sensitive PII such as phone numbers are masked by default with convenient visibility toggles for the user.
- **Zero Information Leakage**: UI suppresses internal cryptographic algorithm names or hash methods, preventing reconnaissance.
