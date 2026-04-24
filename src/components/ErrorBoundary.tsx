// \components\ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import '../styles/ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-overlay">
          <div className="error-boundary-card panel">
            <div className="error-icon">⚠️</div>
            <h2>Ups! Coś poszło nie tak</h2>
            <p className="error-message">Wystąpił nieoczekiwany błąd w aplikacji.</p>
            {this.state.error && (
              <pre className="error-details">{this.state.error.toString()}</pre>
            )}
            <div className="error-actions">
              <button className="primary-btn" onClick={this.handleReset}>
                Zrestartuj Grę
              </button>
              <button 
                className="secondary-btn" 
                onClick={() => window.location.href = '/'}
              >
                Powrót do menu
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
