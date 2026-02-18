import React from 'react';

class ErrorBoundary extends React.Component {
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

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#09090B',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#ef4444', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Component Error</h4>
          <p style={{ color: '#52525B', fontSize: '13px', margin: 0 }}>
            Unable to load this component. Please refresh the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
