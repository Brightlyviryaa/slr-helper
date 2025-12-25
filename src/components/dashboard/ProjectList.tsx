"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectCard } from "./ProjectCard"
import { ProjectFormDialog } from "./ProjectFormDialog"
import type { Prisma } from "@prisma/client"

type ProjectWithCount = Prisma.SlrProjectGetPayload<{
    include: { _count: { select: { studies: true } } }
}>

interface ProjectListProps {
    projects: ProjectWithCount[]
}

export function ProjectList({ projects }: ProjectListProps) {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingProject, setEditingProject] = React.useState<ProjectWithCount | undefined>(undefined)

    const handleCreate = () => {
        setEditingProject(undefined)
        setIsDialogOpen(true)
    }

    const handleEdit = (project: ProjectWithCount) => {
        setEditingProject(project)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
                    <p className="text-slate-700">Manage your Systematic Literature Reviews.</p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Project
                </Button>
            </div>

            {projects.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50/50 p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <Plus className="h-6 w-6 text-slate-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">No projects yet</h3>
                    <p className="mb-4 text-sm text-slate-700 max-w-sm">
                        Start by creating your first SLR project to track protocols and studies.
                    </p>
                    <Button onClick={handleCreate}>Create Project</Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} onEdit={handleEdit} />
                    ))}
                </div>
            )}

            <ProjectFormDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                project={editingProject}
            />
        </div>
    )
}
