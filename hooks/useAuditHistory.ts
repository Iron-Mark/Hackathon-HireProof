import { useState, useEffect } from 'react'
import { AuditReport } from '@/lib/schemas'

const STORAGE_KEY = 'hireproof_audit_history'

export function useAuditHistory() {
  const [history, setHistory] = useState<AuditReport[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setHistory(Array.isArray(parsed) ? parsed : [])
      }
    } catch (e) {
      console.error('Failed to load audit history:', e)
    }
    setIsLoaded(true)
  }, [])

  const addReport = (report: AuditReport) => {
    try {
      const newReport = {
        ...report,
        id: report.id || `report_${Date.now()}`,
        timestamp: report.timestamp || new Date().toISOString(),
      }
      const updated = [newReport, ...history]
      setHistory(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return newReport
    } catch (e) {
      console.error('Failed to save audit report:', e)
      return null
    }
  }

  const clearHistory = () => {
    try {
      setHistory([])
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Failed to clear audit history:', e)
    }
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
