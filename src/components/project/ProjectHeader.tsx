"use client"

import { Button } from "@/components/ui/button"
import { Download, Edit3, Plus, RefreshCw } from "lucide-react"

interface ProjectHeaderProps {
    title: string
    description?: string | null
    studyCount: number
    onEditProtocol: () => void
    onAddStudy: () => void
    onExport: () => void
    onReindex: () => void
    isReindexing?: boolean
}

export function ProjectHeader({
    title,
    description,
    studyCount,
    onEditProtocol,
    onAddStudy,
    onExport,
    onReindex,
    isReindexing = false
}: ProjectHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 line-clamp-1">{title}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{studyCount} Studies</span>
                    <span>•</span>
                    <span className="line-clamp-1 max-w-md">{description || "No description provided."}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onEditProtocol} className="gap-2">
                    <Edit3 size={16} />
                    Edit Protocol
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onReindex}
                    className="gap-2"
                    disabled={isReindexing}
                >
                    <RefreshCw size={16} className={isReindexing ? "animate-spin" : ""} />
                    {isReindexing ? "Indexing..." : "Re-index"}
                </Button>
                <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
                    <Download size={16} />
                    Export CSV
                </Button>
                <Button size="sm" onClick={onAddStudy} className="gap-2">
                    <Plus size={16} />
                    Add Study
                </Button>
            </div>
        </div>
    )
}
