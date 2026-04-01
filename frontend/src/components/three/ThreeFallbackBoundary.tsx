import { Component } from "react";
import type { ReactNode } from "react";

type ThreeFallbackBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type ThreeFallbackBoundaryState = {
  hasError: boolean;
};

export class ThreeFallbackBoundary extends Component<ThreeFallbackBoundaryProps, ThreeFallbackBoundaryState> {
  state: ThreeFallbackBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ThreeFallbackBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Prevent 3D runtime errors from crashing the entire app.
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
