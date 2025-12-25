"use client"

import { cn } from "@/lib/utils"

interface StatusBadgeProps {
    status: string
    className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const styles: Record<string, string> = {
        TO_READ: "bg-slate-100 text-slate-700 border-slate-200",
        READING: "bg-indigo-50 text-indigo-700 border-indigo-200",
        EXTRACTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        INCLUDED: "bg-blue-50 text-blue-700 border-blue-200",
        EXCLUDED: "bg-red-50 text-red-700 border-red-200",
    }

    const currentStyle = styles[status] || styles.TO_READ

    return (
        <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider",
            currentStyle,
            className
        )}>
            {status.replace("_", " ")}
        </span>
    )
}
