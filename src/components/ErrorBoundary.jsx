import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6 text-charcoal">
          <div className="clean-card max-w-lg w-full p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-charcoal">
              Something went wrong
            </h1>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              An unexpected application error occurred. You can reload the page or return home.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-left text-xs font-mono text-red-800 break-all max-h-36 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn-outline text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="btn-neutral-outline text-xs"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
