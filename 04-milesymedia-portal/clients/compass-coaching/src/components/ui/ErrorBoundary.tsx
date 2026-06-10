"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  label?: string;
  fallback?: (err: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (typeof console !== "undefined") {
      console.error(`[Compass Coaching · ErrorBoundary${this.props.label ? ` · ${this.props.label}` : ""}]`, error, info.componentStack);
    }
  }

  reset = (): void => { this.setState({ error: null }); };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback, label } = this.props;
    if (!error) return children;
    if (fallback) return fallback(error, this.reset);
    return (
      <div role="alert" className="mx-auto my-8 max-w-md rounded-md border border-red-200 bg-red-50 p-6 text-center">
        <h3 className="text-base font-semibold text-red-900">
          Something went wrong{label ? ` loading ${label}` : ""}.
        </h3>
        <p className="mt-2 text-sm text-red-800/80">{error.message || "An unexpected error occurred."}</p>
        <button type="button" onClick={this.reset} className="mt-4 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100">
          Retry
        </button>
      </div>
    );
  }
}
