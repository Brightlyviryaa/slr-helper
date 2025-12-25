"use client"

import { Edit, Trash2, FolderOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { deleteProject } from "@/actions/project"
import type { Prisma } from "@prisma/client"

// Use a type that matches what getProjects returns
type ProjectWithCount = Prisma.SlrProjectGetPayload<{
    include: { _count: { select: { studies: true } } }
}>

interface ProjectCardProps {
    project: ProjectWithCount
    onEdit: (project: ProjectWithCount) => void
}

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
    const [isDeleting, setIsDeleting] = React.useState(false)

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return
        setIsDeleting(true)
        await deleteProject(project.id)
        setIsDeleting(false)
    }

    return (
        <div className="group relative rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-indigo-700" />
                        <h3 className="font-semibold text-lg text-slate-900 hover:text-indigo-700 transition-colors">
                            <Link href={`/projects/${project.id}`} className="focus:outline-none">
                                <span aria-hidden="true" className="absolute inset-0" />
                                {project.name}
                            </Link>
                        </h3>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 min-h-[2.5rem]">
                        {project.description || "No description provided."}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="text-xs text-slate-700">
                    <span className="font-medium text-slate-900">{project._count.studies}</span> studies
                    <span className="mx-2">•</span>
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                </div>

                <div className="relative z-10 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-900 hover:text-indigo-700"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(project)
                        }}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-900 hover:text-red-700"
                        disabled={isDeleting}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDelete()
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

import * as React from "react"
