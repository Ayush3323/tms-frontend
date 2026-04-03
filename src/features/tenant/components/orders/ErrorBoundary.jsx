import React from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You could log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-red-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle size={32} />
          </div>
          
          <h2 className="text-xl font-black text-[#172B4D] mb-2 uppercase tracking-tight">
            Something went wrong
          </h2>
          
          <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">
            We encountered an unexpected error while rendering this part of the order module.
          </p>

          <div className="flex items-center gap-3">
             <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#4a6cf7] text-white rounded-xl text-sm font-black hover:bg-[#3b59d9] shadow-lg shadow-blue-100 transition-all"
              >
                <RefreshCcw size={16} /> Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/tenant/dashboard/orders'}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-black hover:bg-gray-100 border border-gray-200 transition-all"
              >
                <Home size={16} /> Orders List
              </button>
          </div>

          {this.state.error && (
            <div className="mt-8 w-full max-w-2xl">
              <details className="group">
                <summary className="text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer list-none hover:text-gray-600 transition-all flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full group-open:bg-red-400"></span>
                  Technical Support Details
                </summary>
                <div className="mt-4 p-4 bg-gray-900 rounded-xl text-left overflow-auto shadow-2xl border border-gray-800">
                  <pre className="text-[11px] font-mono text-red-300 whitespace-pre-wrap leading-relaxed">
                    {this.state.error.toString()}
                  </pre>
                  <p className="mt-4 text-[9px] text-gray-500 font-bold uppercase tracking-wider border-t border-gray-800 pt-3">
                    Please share a screenshot of this with your technical team.
                  </p>
                </div>
              </details>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
