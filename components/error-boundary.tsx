'use client'

import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-risk-bg bg-risk-bg/50 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-high-risk" />
          <h2 className="text-lg font-black">Something went wrong</h2>
          <p className="max-w-md text-sm font-semibold text-muted">
            {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
          </p>
          {this.state.error && (
            <pre className="max-w-md overflow-auto rounded-lg bg-surface p-3 text-xs text-muted">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background hover:bg-safe transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
