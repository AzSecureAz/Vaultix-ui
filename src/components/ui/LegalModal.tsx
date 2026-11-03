import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Shield, Lock, X, CheckCircle2, ShieldCheck, KeyRound, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type LegalModalType = 'terms' | 'privacy' | 'security' | null

interface LegalModalProps {
  type: LegalModalType
  isOpen: boolean
  onClose: () => void
}

export function LegalModal({ type, isOpen, onClose }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'security'>('terms')

  useEffect(() => {
    if (type) {
      setActiveTab(type)
    }
  }, [type])

  /* Close on Escape key */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              {activeTab === 'terms' && <FileText className="h-5 w-5" />}
              {activeTab === 'privacy' && <Lock className="h-5 w-5" />}
              {activeTab === 'security' && <Shield className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {activeTab === 'terms' && 'Terms of Service'}
                {activeTab === 'privacy' && 'Privacy Policy'}
                {activeTab === 'security' && 'Security & Compliance Architecture'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Effective: November 2026 &bull; Vaultix Enterprise IAM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: 'terms' as const, label: 'Terms of Service', icon: FileText },
            { id: 'privacy' as const, label: 'Privacy Policy', icon: Lock },
            { id: 'security' as const, label: 'Security Architecture', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-blue-400 dark:text-blue-600' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {/* Terms Tab */}
          {activeTab === 'terms' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>1. Enterprise Service Provision</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Vaultix provides unified identity, single sign-on (SSO), multi-factor verification, and fine-grained authorization infrastructure. Access to the IAM console and underlying APIs is governed by organization administrative policies.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>2. Authentication & Credential Governance</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Users are responsible for safeguarding their physical FIDO2 security keys, authenticator app configurations, and credentials. Vaultix enforces automated step-up verification (Sudo Mode) before authorizing sensitive modifications such as key rotation or account termination.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>3. Session Life-Cycle & Automated Revocation</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Active sessions may be revoked at any time by the account holder or administrators. Account deletion triggers an immediate cryptographic session teardown followed by a 90-day retention grace cycle before permanent database purge.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>4. Acceptable Use & API Rate Guarding</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Attempts to brute-force authentication endpoints, bypass token verification, or flood gateway routes will trigger automated IP throttling, temporary token locking, and security event logging.
                </p>
              </section>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>1. Data Minimization Principles</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Vaultix collects only the data strictly required to prove identity: your username, email address, and optional phone number. We do not sell or monetize personal identity telemetry.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>2. Biometric Privacy (FIDO2 / WebAuthn)</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Biometric credentials (fingerprint, Touch ID, Windows Hello) <strong>never leave your physical device</strong>. Vaultix only receives and stores the cryptographic public key used to verify digital signatures.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>3. Encryption in Transit & At Rest</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  All HTTP communications require TLS 1.3 encryption. Passwords and recovery codes are irreversibly hashed using modern adaptive functions. Database storage utilizes AES-256-GCM encryption.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>4. User Control & Right to Erasure</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  In compliance with GDPR and CCPA, you retain full rights to inspect, update, export, and permanently delete your user profile and active security credentials directly from your Dashboard.
                </p>
              </section>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-purple-500 shrink-0" />
                  <span>1. Cryptographic Key Management (JWKS)</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Vaultix rotates asymmetric RSA/EC signing keys automatically. Keys maintain dual active and retiring states to prevent in-flight token verification failures during enterprise rotation windows.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-500 shrink-0" />
                  <span>2. Multi-Factor Enforcement & Sudo Mode</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Time-based One-Time Passwords (TOTP RFC 6238) and SMS verification codes ensure multi-factor protection. Critical administrative actions require real-time elevated step-up challenges.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-500 shrink-0" />
                  <span>3. Microservices Isolation & Zero Trust Mesh</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  All service-to-service communication is orchestrated through Spring Cloud Gateway and Eureka discovery with distributed token authentication, ShedLock mutual exclusion, and rate-limiting filters.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span>SOC2 Type II &amp; GDPR Compliant</span>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="h-8.5 px-4 font-semibold rounded-lg text-xs sm:text-sm"
          >
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
