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

- **Public Routes**: Accessible without authentication (`/login`, `/register`, `/forgot-password`).
- **Protected Layout**: The `MainLayout` wraps authenticated features (`/dashboard`, `/mfa`), verifying user session posture before rendering child views.
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

### International Phone Number Management
- Integrates the reusable `PhoneInput` with live country selection (245+ countries) and automatic dial code formatting.
- **Verification**: If `phone_number_verified` is false, displays amber `Unverified` badge and launches `VerifyPhoneModal` to send and verify an SMS OTP.
- **Add / Change Flow**: `ChangePhoneNumberModal` supports both adding a phone number when empty and updating an existing one. Submits to `POST /auth/phone/change/request` and confirms with OTP via `POST /auth/phone/change/confirm`.

---

## 5. Two-Step Verification (MFA) Lifecycle

Configured in [`src/features/mfa/MfaPage.tsx`](../src/features/mfa/MfaPage.tsx) aligning with enterprise TOTP standards:

### Onboarding Flow
1. **Setup Initiation**: User clicks **Set Up** on the Authenticator factor (`POST /auth/totp/setup`).
2. **Secret Presentation**: Renders a dynamic QR code (`otpauth://`) alongside a manual Base32 secret key.
3. **Activation**: User enters 6-digit TOTP code (`POST /auth/totp/activate`).
4. **Recovery Codes Issuance**: Backend responds with 10 cryptographically generated emergency recovery codes (`TotpActivationResponse`). The frontend displays them in a secure grid with one-click **Copy All**.

### Active State & Disabling
- While MFA is enabled, the backend rejects duplicate `/setup` requests with `409 Conflict`.
- The factor action displays **Disable**. Clicking opens a security confirmation dialog.
- Upon confirmation (`POST /auth/totp/disable`), the backend revokes TOTP and deletes recovery codes. The UI refreshes profile state, returning the factor to **Set Up**.

### Recovery Codes Management
- Real-time remaining count loaded via `GET /auth/totp/recovery-codes`.
- One-click code regeneration via `POST /auth/totp/recovery-codes/regenerate` with security warning.

---

## 6. UX & Design Principles

- **Clerk-Inspired Aesthetics**: High contrast typography, dark/light mode parity, glassmorphic cards, rounded-2xl containers, and subtle micro-animations.
- **Contextual Inline Errors**: In accordance with enterprise form UX, error messages render directly below the relevant input field with red border outlines, eliminating bulky top notification banners.
- **Zero Information Leakage**: UI suppresses internal cryptographic algorithm names or hash methods, preventing reconnaissance.
