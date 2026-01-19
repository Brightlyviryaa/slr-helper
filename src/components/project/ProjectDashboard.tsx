"use client"

import * as React from "react"
import { ProjectHeader } from "./ProjectHeader"
import { StudiesTable } from "./StudiesTable"
import { StudyFormDialog } from "./StudyFormDialog"
import { StudyEditorPanel } from "./StudyEditorPanel"
import { ProtocolEditor } from "./ProtocolEditor"
import { PromptBuilderPanel } from "./PromptBuilderPanel"
import { deleteStudy, exportStudiesCSV } from "@/actions/study"
import { reindexProjectStudies } from "@/actions/vector"

interface ProjectDashboardProps {
    project: any
    studies: any[]
}

export function ProjectDashboard({ project, studies }: ProjectDashboardProps) {
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [isPanelOpen, setIsPanelOpen] = React.useState(false)
    const [isProtocolOpen, setIsProtocolOpen] = React.useState(false)
    const [selectedStudy, setSelectedStudy] = React.useState<any>(null)
    const [isExporting, setIsExporting] = React.useState(false)
    const [isReindexing, setIsReindexing] = React.useState(false)

    const handleEditProtocol = () => {
        setIsProtocolOpen(true)
    }

    const handleAddStudy = () => {
        setSelectedStudy(null)
        setIsFormOpen(true)
    }

    const handleExport = async () => {
        setIsExporting(true)
        const result = await exportStudiesCSV(project.id)
        setIsExporting(false)

        if (result.success && result.csvContent) {
            const blob = new Blob([result.csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `slr_export_${project.name.toLowerCase().replace(/\s+/g, '_')}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
            alert(result.error || "Failed to export studies.")
        }
    }

    const handleEditStudy = (study: any) => {
        setSelectedStudy(study)
        setIsPanelOpen(true)
    }

    const handleQuickEdit = (study: any) => {
        setSelectedStudy(study)
        setIsFormOpen(true)
    }

    const handleDeleteStudy = async (id: string) => {
        if (!confirm("Are you sure you want to delete this study?")) return
        await deleteStudy(id, project.id)
    }

    const handleReindex = async () => {
        if (isReindexing) return

        setIsReindexing(true)
        try {
            const result = await reindexProjectStudies(project.id)

            if (result.success) {
                alert(`Successfully indexed ${result.indexed} of ${result.total} INCLUDED studies.${(result.errors ?? 0) > 0 ? ` (${result.errors} errors)` : ''}`)
            } else {
                alert(result.error || "Failed to re-index studies.")
            }
        } catch (error) {
            console.error("Reindex error:", error)
            alert("An error occurred while re-indexing studies.")
        } finally {
            setIsReindexing(false)
        }
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <ProjectHeader
                title={project.protocol?.protocolTitle || project.name}
                description={project.description}
                studyCount={project._count.studies}
                onEditProtocol={handleEditProtocol}
                onAddStudy={handleAddStudy}
                onExport={handleExport}
                onReindex={handleReindex}
                isReindexing={isReindexing}
            />

            <div className="flex-1 min-h-0">
                <StudiesTable
                    projectId={project.id}
                    studies={studies}
                    onEdit={handleEditStudy}
                    onDelete={handleDeleteStudy}
                />
            </div>

            <PromptBuilderPanel
                projectId={project.id}
                protocol={project.protocol}
            />

            <StudyFormDialog
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                projectId={project.id}
            />

            <StudyEditorPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                study={selectedStudy}
                projectId={project.id}
                protocol={project.protocol}
            />

            <ProtocolEditor
                isOpen={isProtocolOpen}
                onClose={() => setIsProtocolOpen(false)}
                protocol={project.protocol}
                projectId={project.id}
            />
        </div>
    )
}
