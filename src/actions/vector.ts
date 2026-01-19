"use server"

import { revalidatePath } from "next/cache"
import { reindexAllStudies, searchStudies } from "@/lib/vector-search"

/**
 * Server Actions for Vector Search Operations
 */

/**
 * Re-index all INCLUDED studies in a project
 */
export async function reindexProjectStudies(projectId: string) {
    try {
        const result = await reindexAllStudies(projectId)

        revalidatePath(`/projects/${projectId}`)

        return {
            success: true,
            indexed: result.indexed,
            errors: result.errors,
            total: result.total,
        }
    } catch (error: any) {
        console.error("Failed to reindex studies:", error)
        return {
            success: false,
            error: error.message || "Failed to reindex studies",
        }
    }
}

/**
 * Search studies by semantic similarity
 */
export async function searchProjectStudies(
    projectId: string,
    query: string,
    limit: number = 10
) {
    try {
        const results = await searchStudies(projectId, query, limit)

        return {
            success: true,
            results,
        }
    } catch (error: any) {
        console.error("Failed to search studies:", error)
        return {
            success: false,
            error: error.message || "Failed to search studies",
            results: [],
        }
    }
}
