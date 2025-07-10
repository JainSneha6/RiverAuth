import React, { Component, ReactNode } from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <IonPage>
          <IonContent className="ion-padding">
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
              <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
              <p className="text-gray-600 mb-4">
                There was an error loading this page. This might happen when accessing pages directly.
              </p>
              <div className="space-y-2">
                <IonButton 
                  fill="solid" 
                  color="primary"
                  onClick={() => window.location.href = '/login'}
                >
                  Go to Login
                </IonButton>
                <IonButton 
                  fill="outline" 
                  color="primary"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </IonButton>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left max-w-md">
                  <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
                  <pre className="text-xs text-red-500 mt-2 overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </IonContent>
        </IonPage>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
