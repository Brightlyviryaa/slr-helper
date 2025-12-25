"use client"

import * as React from "react"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Select } from "@/components/ui/select"
import { updateStudyStatus } from "@/actions/study"
import { MoreHorizontal, ExternalLink, FileEdit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StudyRowProps {
    study: any
    projectId: string
    onEdit: (study: any) => void
    onDelete: (id: string) => void
}

export function StudyRow({ study, projectId, onEdit, onDelete }: StudyRowProps) {
    const [isUpdating, setIsUpdating] = React.useState(false)

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === "EXCLUDED") {
            const reason = prompt("Please provide an exclusion reason:")
            if (!reason) return
            setIsUpdating(true)
            await updateStudyStatus(study.id, projectId, newStatus, reason)
        } else {
            setIsUpdating(true)
            await updateStudyStatus(study.id, projectId, newStatus)
        }
        setIsUpdating(false)
    }

    return (
        <tr
            className="group hover:bg-slate-50 border-b last:border-0 cursor-pointer transition-colors"
            onClick={() => onEdit(study)}
        >
            <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                {study.paperKey}
            </td>
            <td className="px-4 py-3">
                <div className="font-medium text-slate-900 line-clamp-1">{study.title}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {study.authors || "Unknown Authors"}
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                {study.year}
            </td>
            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <Select
                    value={study.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={isUpdating}
                    className="h-8 text-[10px] font-bold py-0 w-32 border-transparent bg-transparent hover:bg-white hover:border-slate-200"
                >
                    <option value="TO_READ">TO READ</option>
                    <option value="READING">READING</option>
                    <option value="EXTRACTED">EXTRACTED</option>
                    <option value="INCLUDED">INCLUDED</option>
                    <option value="EXCLUDED">EXCLUDED</option>
                </Select>
            </td>
            <td className="px-4 py-3 text-xs text-slate-500 line-clamp-1">
                {study.venue || "-"}
            </td>
            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                {new Date(study.updatedAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Link href={`/projects/${projectId}/studies/${study.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="View Details">
                            <Eye size={14} className="text-indigo-600" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(study)} title="Edit">
                        <FileEdit size={14} className="text-slate-600" />
                    </Button>
                    {study.url && (
                        <a
                            href={study.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-100 transition-colors"
                            title="Open Source"
                        >
                            <ExternalLink size={14} className="text-slate-600" />
                        </a>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-600" onClick={() => onDelete(study.id)} title="Delete">
                        <Trash2 size={14} />
                    </Button>
                </div>
            </td>
        </tr>
    )
}
