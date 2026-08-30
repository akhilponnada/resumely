"use client";

import { Component, type ReactNode } from "react";

export class QuietErrorBoundary extends Component<
    { children: ReactNode; fallback?: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        if (this.state.failed) return this.props.fallback ?? null;
        return this.props.children;
    }
}
