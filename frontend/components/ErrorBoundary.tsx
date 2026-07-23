'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logError } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context = `ErrorBoundary:${this.props.sectionName || 'Section'}`;
    logError(context, error, { extra: { componentStack: errorInfo.componentStack } });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const sectionName = this.props.sectionName || 'section';
      return (
        <div className="w-full my-6 p-6 rounded-2xl bg-[#121326]/70 border border-rose-500/30 backdrop-blur-md text-center flex flex-col items-center justify-center gap-3 shadow-lg transition-all">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-base sm:text-lg mb-1">
              {this.props.fallbackTitle || `This ${sectionName} could not be loaded.`}
            </h4>
            <p className="text-gray-400 text-xs sm:text-sm">
              An unexpected error occurred while fetching content. Please try again.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
