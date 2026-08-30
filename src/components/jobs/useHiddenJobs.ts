"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "resumely:hidden-jobs";

function readHidden(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
}

function writeHidden(ids: string[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
        /* ignore quota */
    }
}

export function useHiddenJobs() {
    const [hidden, setHidden] = useState<Set<string>>(new Set());

    useEffect(() => {
        setHidden(new Set(readHidden()));
    }, []);

    const hide = useCallback((id: string) => {
        setHidden((prev) => {
            const next = new Set(prev);
            next.add(id);
            writeHidden([...next]);
            return next;
        });
    }, []);

    const unhide = useCallback((id: string) => {
        setHidden((prev) => {
            const next = new Set(prev);
            next.delete(id);
            writeHidden([...next]);
            return next;
        });
    }, []);

    return { hidden, hide, unhide };
}
