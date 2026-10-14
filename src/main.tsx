import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CampusPulse caught an unhandled application error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f8fafc', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '560px', width: '100%', backgroundColor: '#1e293b', borderRadius: '12px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', border: '1px solid #334155' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#f87171' }}>Application Runtime Error</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
              CampusPulse encountered an unexpected runtime exception. This screen prevents a blank white page.
            </p>
            {this.state.error && (
              <div style={{ backgroundColor: '#0f172a', borderRadius: '6px', padding: '12px', fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0', overflowX: 'auto', marginBottom: '20px', border: '1px solid #334155' }}>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{ backgroundColor: '#475569', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Reset Demo Data & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

