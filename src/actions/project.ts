"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getProjects() {
    try {
        return await prisma.slrProject.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { studies: true }
                }
            }
        })
    } catch (error) {
        console.error("Failed to fetch projects:", error)
        return []
    }
}

export async function createProject(formData: FormData) {
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (!name) {
        return { error: "Name is required" }
    }

    try {
        await prisma.slrProject.create({
            data: {
                name,
                description,
                protocol: {
                    create: {
                        protocolTitle: `Protocol for ${name}`
                    }
                }
            }
        })
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Failed to create project:", error)
        return { error: "Failed to create project" }
    }
}

export async function updateProject(id: string, formData: FormData) {
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (!name) {
        return { error: "Name is required" }
    }

    try {
        await prisma.slrProject.update({
            where: { id },
            data: { name, description }
        })
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Failed to update project:", error)
        return { error: "Failed to update project" }
    }
}

export async function deleteProject(id: string) {
    try {
        await prisma.slrProject.delete({
            where: { id }
        })
        revalidatePath("/")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete project:", error)
        return { success: false, error: error.message || "Failed to delete project" }
    }
}

export async function getProjectWithDetails(id: string) {
    try {
        return await prisma.slrProject.findUnique({
            where: { id },
            include: {
                protocol: {
                    include: {
                        databases: true,
                        searchTerms: true,
                    }
                },
                _count: {
                    select: { studies: true }
                }
            }
        })
    } catch (error) {
        console.error("Failed to fetch project details:", error)
        return null
    }
}
