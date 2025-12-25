"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { createProject, updateProject } from "@/actions/project"
import { Loader2 } from "lucide-react"

interface ProjectFormDialogProps {
    isOpen: boolean
    onClose: () => void
    project?: { id: string; name: string; description: string | null }
}

export function ProjectFormDialog({ isOpen, onClose, project }: ProjectFormDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const isEditing = !!project

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)

        let result
        if (isEditing) {
            result = await updateProject(project.id, formData)
        } else {
            result = await createProject(formData)
        }

        setIsLoading(false)

        if (result.success) {
            onClose()
        } else {
            // Simple alert for now, could be a toast later
            alert(result.error)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Project" : "New Project"}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-slate-700">
                        Project Name
                    </label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="e.g. LLM for Software Engineering"
                        defaultValue={project?.name}
                        required
                        autoFocus
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium text-slate-700">
                        Description (Optional)
                    </label>
                    <Input
                        id="description"
                        name="description"
                        placeholder="Brief goal of this review..."
                        defaultValue={project?.description || ""}
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Save Changes" : "Create Project"}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
