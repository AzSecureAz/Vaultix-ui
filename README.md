# Vaultix Web Console

Modern, high-performance **Identity & Access Management (IAM)** Single Page Application (SPA) for the **Vaultix** enterprise platform, built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Zustand**.

---

## Service Overview

| Attribute | Value |
| :--- | :--- |
| **Port** | `3000` (Production Preview) / `5173` (Vite Dev Server) |
| **Framework** | React 19.3 + TypeScript 6.0 + Vite 8.3 |
| **Styling** | Tailwind CSS v4 + Radix UI Primitives + Lucide Icons |
| **State Management** | Zustand 5 (Global Auth & Theme Stores) + TanStack React Query 5 |
| **API Client** | Axios with automatic JWT rotation, concurrency queues, and credential cookies |
| **Gateway Route** | All `/api/v1/**` requests route through Spring Cloud Gateway (`http://localhost:8085`) |

---

## Documentation Index

Detailed architectural breakdowns, state management specifications, and design system components are maintained in the [`docs/`](docs/) directory:

| Document | Description |
| :--- | :--- |
| 📖 [**Frontend Architecture & Design**](docs/ARCHITECTURE.md) | In-depth breakdown of client-side security architecture: React Router access guards, Axios token rotation concurrency queues, Zustand global stores, identity credential lifecycles, TOTP two-factor authentication, and inline error UX principles. |
| 🎨 [**UI Components & Design System**](docs/COMPONENTS.md) | Comprehensive reference for design tokens, monochrome color palettes, Radix UI primitives, the 245+ country `PhoneInput` selector, credential modals, and Clerk-inspired design patterns. |

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

## Directory Structure

```
ui/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   └── COMPONENTS.md
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── MainLayout.tsx
    │   └── ui/
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── input.tsx
    │       ├── badge.tsx
    │       ├── PhoneInput.tsx
    │       ├── countries.ts
    │       └── ThemeToggle.tsx
    ├── features/
    │   ├── auth/
    │   │   ├── api/
    │   │   │   └── authApi.ts
    │   │   └── components/
    │   │       ├── LoginForm.tsx
    │   │       ├── RegisterPage.tsx
    │   │       └── ForgotPasswordPage.tsx
    │   ├── dashboard/
    │   │   ├── DashboardPage.tsx
    │   │   └── components/
    │   │       ├── VerifyEmailModal.tsx
    │   │       ├── VerifyPhoneModal.tsx
    │   │       ├── ChangeEmailModal.tsx
    │   │       ├── ChangePhoneNumberModal.tsx
    │   │       ├── ChangePasswordModal.tsx
    │   │       └── ChangeUsernameModal.tsx
    │   └── mfa/
    │       └── MfaPage.tsx
    ├── lib/
    │   ├── api-client.ts
    │   └── utils.ts
    ├── stores/
    │   ├── authStore.ts
    │   └── themeStore.ts
    └── types/
        └── api.ts
```

---

## Configuration Reference

Configured in [`vite.config.ts`](vite.config.ts):

### 1. Reverse Proxy Routing
In development, all `/api` requests are forwarded seamlessly to the **Vaultix API Gateway**:

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8085',
      changeOrigin: false,
    },
  },
},
preview: {
  port: 3000,
}
```

### 2. Production Chunking
Production bundles are automatically code-split into discrete vendor chunks to optimize browser caching:
- `vendor-react`: React 19, React DOM, and React Router.
- `vendor-tanstack`: TanStack React Query and TanStack Table.
- `vendor-charts`: Recharts charting dependencies.

---

## Quick Start

### 1. Install Dependencies
```powershell
npm install
```

### 2. Run in Development Mode
Starts the Vite dev server with Hot Module Replacement (HMR) and API reverse-proxying:
```powershell
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build & Preview
Type-checks the entire TypeScript codebase and compiles optimized production chunks:
```powershell
npm run build
npm run preview
```
Open [http://localhost:3000](http://localhost:3000) to preview the production build.
