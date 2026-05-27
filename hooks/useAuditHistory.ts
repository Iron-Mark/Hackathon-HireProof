import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { AuditReport, AuditReportSchema } from '@/lib/schemas'
import { SafeStorage } from '@/lib/safe-storage'

const STORAGE_KEY = 'hireproof_audit_history'
const MAX_HISTORY = 50 
const HistorySchema = z.array(AuditReportSchema)

function createLocalReportId() {
  return `report_${globalThis.crypto.randomUUID()}`
}

export function useAuditHistory() {
  const [history, setHistory] = useState<AuditReport[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount (client-side only)
  const loadHistory = useCallback(() => {
    const stored = SafeStorage.get(STORAGE_KEY, HistorySchema)
    if (stored) {
      setHistory(stored)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    loadHistory()

    // Cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadHistory()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadHistory])

  const addReport = (report: AuditReport) => {
    const newReport = {
      ...report,
      id: report.id || createLocalReportId(),
      timestamp: report.timestamp || new Date().toISOString(),
    }
    
    // Use functional update to ensure we have the latest history in case of race conditions
    setHistory(prev => {
      const updated = [newReport, ...prev].slice(0, MAX_HISTORY)
      SafeStorage.set(STORAGE_KEY, updated)
      return updated
    })
    
    return newReport
  }

  const clearHistory = () => {
    setHistory([])
    SafeStorage.remove(STORAGE_KEY)
  }

  const getReport = (id: string) => {
    return history.find(report => report.id === id)
  }

  return {
    history,
    isLoaded,
    addReport,
    clearHistory,
    getReport,
  }
}
