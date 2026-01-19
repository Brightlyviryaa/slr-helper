"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { indexStudy, removeStudyFromIndex } from "@/lib/vector-search"

export async function getStudies(projectId: string, filters?: {
    search?: string,
    status?: string,
    year?: number
}) {
    try {
        const where: any = { projectId }

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { authors: { contains: filters.search } },
                { doi: { contains: filters.search } },
                { venue: { contains: filters.search } },
            ]
        }

        if (filters?.status && filters.status !== "ALL") {
            where.status = filters.status
        }

        if (filters?.year) {
            where.year = filters.year
        }

        return await prisma.slrStudy.findMany({
            where,
            orderBy: { updatedAt: "desc" },
        })
    } catch (error) {
        console.error("Failed to fetch studies:", error)
        return []
    }
}

async function generatePaperKey(projectId: string): Promise<string> {
    const count = await prisma.slrStudy.count({ where: { projectId } })
    return `P${String(count + 1).padStart(3, '0')}`
}

export async function createStudy(projectId: string, formData: FormData) {
    try {
        const title = formData.get("title") as string
        const year = parseInt(formData.get("year") as string)

        if (!title || isNaN(year)) {
            return { success: false, error: "Title and Year are required" }
        }

        const paperKey = await generatePaperKey(projectId)

        const data: any = {
            projectId,
            title,
            paperKey,
            year,
            authors: formData.get("authors") as string || null,
            venue: formData.get("venue") as string || null,
            doi: formData.get("doi") as string || null,
            url: formData.get("url") as string || null,
            keywords: formData.get("keywords") as string || null,
            abstract: formData.get("abstract") as string || null,
            status: (formData.get("status") as string) || "TO_READ",
        }

        await prisma.slrStudy.create({ data })

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to create study:", error)
        return { success: false, error: error.message || "Failed to create study" }
    }
}

export async function updateStudy(id: string, projectId: string, formData: FormData) {
    try {
        const data: any = {}
        const stringFields = [
            "title", "paperKey", "authors", "venue", "doi", "url", "pdfUrl", "keywords", "abstract",
            "researchType", "domain", "problemStatement", "proposedSolution",
            "keyTechniques", "dataInputUsed", "outputArtifact", "evaluationMethod",
            "metricsResults", "strengths", "limitations", "gapNotes",
            "adoptionForThesis", "status", "exclusionReason",
            // New fields
            "qaNotes", "comparisonBaseline", "ambiguityType", "qualityFramework", "studyContext"
        ]

        stringFields.forEach(field => {
            const val = formData.get(field)
            if (val !== null) data[field] = val as string
        })

        const yearVal = formData.get("year")
        if (yearVal) data.year = parseInt(yearVal as string)

        const relevanceVal = formData.get("relevanceScore")
        if (relevanceVal) data.relevanceScore = parseInt(relevanceVal as string)

        // QA Scores (Q1-Q8)
        const qaFields = ["qaQ1", "qaQ2", "qaQ3", "qaQ4", "qaQ5", "qaQ6", "qaQ7", "qaQ8"]
        let qaTotal = 0
        qaFields.forEach(field => {
            const val = formData.get(field)
            if (val !== null && val !== "") {
                const score = parseInt(val as string)
                data[field] = score
                qaTotal += score
            }
        })
        data.qaTotal = qaTotal

        // Validation: Excluded requires reason
        if (data.status === "EXCLUDED" && !data.exclusionReason) {
            return { success: false, error: "Exclusion reason is required when status is EXCLUDED" }
        }

        const updatedStudy = await prisma.slrStudy.update({
            where: { id },
            data
        })

        // Auto-index if status is INCLUDED
        if (updatedStudy.status === "INCLUDED") {
            try {
                await indexStudy(updatedStudy)
            } catch (indexError) {
                console.error("Failed to index study (non-blocking):", indexError)
            }
        } else if (updatedStudy.status === "EXCLUDED" && updatedStudy.embeddingId) {
            // Remove from index if excluded
            try {
                await removeStudyFromIndex(projectId, id)
            } catch (indexError) {
                console.error("Failed to remove study from index (non-blocking):", indexError)
            }
        }

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to update study:", error)
        return { success: false, error: error.message || "Failed to update study" }
    }
}

export async function deleteStudy(id: string, projectId: string) {
    try {
        await prisma.slrStudy.delete({ where: { id } })
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete study:", error)
        return { success: false, error: error.message || "Failed to delete study" }
    }
}

export async function updateStudyStatus(id: string, projectId: string, status: string, exclusionReason?: string) {
    try {
        if (status === "EXCLUDED" && !exclusionReason) {
            return { success: false, error: "Exclusion reason is required" }
        }

        const updatedStudy = await prisma.slrStudy.update({
            where: { id },
            data: { status, exclusionReason }
        })

        // Auto-index if status changed to INCLUDED
        if (status === "INCLUDED") {
            try {
                await indexStudy(updatedStudy)
            } catch (indexError) {
                console.error("Failed to index study (non-blocking):", indexError)
            }
        } else if (status === "EXCLUDED" && updatedStudy.embeddingId) {
            // Remove from index if excluded
            try {
                await removeStudyFromIndex(projectId, id)
            } catch (indexError) {
                console.error("Failed to remove study from index (non-blocking):", indexError)
            }
        }

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to update study status:", error)
        return { success: false, error: error.message || "Failed to update status" }
    }
}

export async function exportStudiesCSV(projectId: string) {
    try {
        const studies = await prisma.slrStudy.findMany({
            where: { projectId },
            orderBy: { paperKey: "asc" }
        })

        if (studies.length === 0) return { success: false, error: "No studies to export" }

        const headers = [
            "Paper Key", "Title", "Authors", "Year", "Venue", "DOI", "URL", "Abstract",
            "Status", "Relevance", "Problem Statement", "Proposed Solution", "Strengths", "Limitations"
        ]

        const rows = studies.map(s => [
            s.paperKey,
            `"${s.title.replace(/"/g, '""')}"`,
            `"${(s.authors || "").replace(/"/g, '""')}"`,
            s.year,
            `"${(s.venue || "").replace(/"/g, '""')}"`,
            s.doi || "",
            s.url || "",
            `"${(s.abstract || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            s.status,
            s.relevanceScore || "",
            `"${(s.problemStatement || "").replace(/"/g, '""')}"`,
            `"${(s.proposedSolution || "").replace(/"/g, '""')}"`,
            `"${(s.strengths || "").replace(/"/g, '""')}"`,
            `"${(s.limitations || "").replace(/"/g, '""')}"`
        ])

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")

        return { success: true, csvContent }
    } catch (error: any) {
        console.error("Failed to export CSV:", error)
        return { success: false, error: "Failed to generate CSV" }
    }
}
