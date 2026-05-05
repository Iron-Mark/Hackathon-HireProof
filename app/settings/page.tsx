'use client'

import { useState, useEffect } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { useAuditHistory } from '@/hooks/useAuditHistory'
import { motion } from 'framer-motion'
import {
  Settings,
  Zap,
  Shield,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Bell,
  Database,
  Globe,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { showToast } from '@/components/system/toast'

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-border-soft bg-surface p-6 transition-colors hover:bg-background">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border-soft text-muted">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-black">{label}</div>
          <div className="text-xs font-medium text-muted mt-0.5">{description}</div>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-11 w-[68px] rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-safe ${
        checked ? 'bg-safe' : 'bg-border-soft'
      }`}
    >
      <span
        className={`absolute left-1 top-1 h-9 w-9 rounded-full bg-background shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { history, clearHistory } = useAuditHistory()
  const { theme, setTheme } = useTheme()
  const [themeReady, setThemeReady] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  useEffect(() => {
    setThemeReady(true)
    try {
      setNotifications(localStorage.getItem('hp_notifications') === 'true')
      const saved = localStorage.getItem('hp_autosave')
      setAutoSave(saved === null ? true : saved === 'true')
    } catch {}
  }, [])

  const handleClearHistory = () => {
    if (window.confirm(`Permanently delete ${history.length} case file${history.length !== 1 ? 's' : ''}?`)) {
      clearHistory()
      showToast('Local archive cleared.', 'success')
    }
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8 lg:py-20">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface px-4 py-1.5 text-xs font-black uppercase tracking-widest text-muted">
            <Settings className="h-4 w-4" />
            Preferences
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Settings</h1>
          <p className="mt-4 text-lg font-medium text-muted">
            Manage your investigator profile, data, and platform behaviour.
          </p>
        </div>

        <div className="space-y-10">
          {/* Appearance */}
          <section>
            <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted">Appearance</h2>
            <div className="rounded-[2rem] border border-border-soft bg-surface overflow-hidden">
              <div className="p-6 flex items-center gap-4 border-b border-border-soft">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border-soft text-muted">
                  <Moon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black">Theme</div>
                  <div className="text-xs font-medium text-muted mt-0.5">Choose how HireProof looks on your device</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4">
                {themeOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-black transition-all ${
                      themeReady && theme === value
                        ? 'border-safe bg-safe/5 text-safe'
                        : 'border-border-soft bg-background text-muted hover:border-foreground/20'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                    {themeReady && theme === value && <span className="sr-only">(selected)</span>}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Engine */}
          <section>
            <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted">Forensic Engine</h2>
            <div className="space-y-3">


              <SettingRow
                icon={Database}
                label="Auto-save Reports"
                description="Automatically save completed audits to local case history"
              >
                <Toggle
                  checked={autoSave}
                  onChange={() => {
                    const next = !autoSave
                    setAutoSave(next)
                    try { localStorage.setItem('hp_autosave', String(next)) } catch {}
                    showToast(next ? 'Auto-save enabled.' : 'Auto-save disabled.', 'info')
                  }}
                />
              </SettingRow>

              <SettingRow
                icon={Bell}
                label="Notifications"
                description="Show toast alerts when investigations complete"
              >
                <Toggle
                  checked={notifications}
                  onChange={() => {
                    const next = !notifications
                    setNotifications(next)
                    try { localStorage.setItem('hp_notifications', String(next)) } catch {}
                  }}
                />
              </SettingRow>
            </div>
          </section>

          {/* Data */}
          <section>
            <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted">Data & Privacy</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-6 rounded-2xl border border-border-soft bg-surface p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border-soft text-muted">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black">Local Case Archive</div>
                    <div className="text-xs font-medium text-muted mt-0.5">
                      {history.length === 0
                        ? 'No reports stored'
                        : `${history.length} report${history.length !== 1 ? 's' : ''} stored in browser`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClearHistory}
                  disabled={history.length === 0}
                  className="flex items-center gap-2 rounded-xl border border-risk-bg/30 bg-risk-bg/5 px-4 py-2 text-xs font-black text-risk-text transition-all hover:bg-risk-bg/10 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Archive
                </button>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-border-soft bg-surface p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-safe/10 border border-safe/20 text-safe">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black">Privacy First</div>
                  <div className="text-xs font-medium text-muted mt-0.5">
                    All audit history is stored locally in your browser only. Nothing is sent to HireProof servers without your explicit action.
                  </div>
                </div>
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-safe" />
              </div>
            </div>
          </section>

          {/* Developer */}
          <section>
            <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted">Advanced</h2>
            <a
              href="/developer"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-surface p-6 transition-all hover:bg-background hover:border-evidence/30"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border-soft text-evidence">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black">Developer Portal</div>
                  <div className="text-xs font-medium text-muted mt-0.5">API keys, webhooks, and SDK integration settings</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1" />
            </a>
          </section>

          {/* Version */}
          <div className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted/40 pt-4">
            HireProof Platform · v1.0.0 · Forensic Engine v9.4
          </div>
        </div>
      </main>
    </div>
  )
}
