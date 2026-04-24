// \components\ErrorBoundary.jsx
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg, #1a1a2e)',
          color: 'var(--text, #eee)',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Coś poszło nie tak</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.8, maxWidth: 500, marginBottom: '1.5rem' }}>
            Wystąpił niespodziewany błąd w grze. Możesz spróbować zresetować grę.
          </p>
          {this.state.error && (
            <pre style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '1rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              maxWidth: 600,
              overflow: 'auto',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 32px',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--button-selected-bg, #4a9eff)',
              color: 'var(--button-selected-text, #fff)',
            }}
          >
            Zresetuj grę
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
