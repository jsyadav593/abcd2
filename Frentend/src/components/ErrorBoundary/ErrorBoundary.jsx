import React, { useState } from 'react';
import './ErrorBoundary.css';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child components
 */
class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h1>Oops! Something went wrong</h1>
            <p className="error-message">{this.state.error?.message || 'An unexpected error occurred'}</p>
            
            <div className="error-actions">
              <button onClick={this.resetError} className="error-button error-button--primary">
                Try Again
              </button>
              <button onClick={() => window.location.href = '/'} className="error-button error-button--secondary">
                Go to Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre>{this.state.error?.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for hooks
export function ErrorBoundary({ children }) {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
}

/**
 * Error Toast/Alert Component for API errors
 */
export function ErrorNotification({ error, onClose }) {
  if (!error) return null;

  return (
    <div className="error-notification">
      <div className="error-notification__content">
        <span className="error-notification__icon">✕</span>
        <div className="error-notification__message">
          <strong>Error:</strong> {error.message || 'Something went wrong'}
        </div>
      </div>
      <button
        className="error-notification__close"
        onClick={onClose}
        aria-label="Close error notification"
      >
        ✕
      </button>
    </div>
  );
}

export default ErrorBoundary;
