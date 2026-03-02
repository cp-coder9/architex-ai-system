/**
 * Error Boundary Component
 * 
 * A React class component that catches JavaScript errors in child component trees,
 * logs those errors, and displays a fallback UI instead of crashing the entire app.
 */

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary - React Error Boundary Implementation
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary componentName="Dashboard" onError={logError}>
 *   <Dashboard />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details
    console.error('[ErrorBoundary] Caught an error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service (e.g., Sentry, LogRocket)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo): void {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    // For now, log to localStorage for debugging
    const errorLog = {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      const existingLogs = JSON.parse(localStorage.getItem('errorBoundaryLogs') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.shift();
      }
      localStorage.setItem('errorBoundaryLogs', JSON.stringify(existingLogs));
    } catch {
      // Ignore localStorage errors
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError) {
      // Custom fallback UI provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">
                Something went wrong
                {componentName && (
                  <span className="text-muted-foreground"> in {componentName}</span>
                )}
              </CardTitle>
              <CardDescription>
                We apologize for the inconvenience. An error has occurred in this component.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error details (collapsed by default in production) */}
              {error && (
                <div className="bg-muted rounded-lg p-4 text-sm">
                  <p className="font-medium text-destructive mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Error Details
                  </p>
                  <p className="text-muted-foreground font-mono text-xs break-all">
                    {error.message}
                  </p>
                  {import.meta.env.DEV && this.state.errorInfo && (
                    <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Support info */}
              <p className="text-xs text-muted-foreground text-center">
                If this problem persists, please contact support with the error details above.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * withErrorBoundary - HOC to wrap components with error boundary
 * 
 * Usage:
 * ```tsx
 * const SafeDashboard = withErrorBoundary(Dashboard, { componentName: 'Dashboard' });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<Props, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P): React.ReactElement => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  // Set display name for debugging
  const componentName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withErrorBoundary(${componentName})`;

  return WrappedComponent;
}

export default ErrorBoundary;
