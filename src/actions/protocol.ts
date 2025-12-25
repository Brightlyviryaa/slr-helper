"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createProtocol(projectId: string, formData: FormData) {
    try {
        const protocolTitle = formData.get("protocolTitle") as string
        const background = formData.get("background") as string
        const objective = formData.get("objective") as string
        const reviewQuestionFull = formData.get("reviewQuestionFull") as string
        const picoPopulation = formData.get("picoPopulation") as string
        const picoIntervention = formData.get("picoIntervention") as string
        const picoComparison = formData.get("picoComparison") as string
        const picoOutcome = formData.get("picoOutcome") as string
        const searchStrategy = formData.get("searchStrategy") as string
        const identifyingOtherSources = formData.get("identifyingOtherSources") as string
        const additionalLimits = formData.get("additionalLimits") as string
        const studyQualityAssessmentPlan = formData.get("studyQualityAssessmentPlan") as string
        const dataExtractionAndSynthesis = formData.get("dataExtractionAndSynthesis") as string

        // Parse JSON lists for databases and search terms
        const databasesJson = formData.get("databases") as string
        const searchTermsJson = formData.get("searchTerms") as string

        const databases = databasesJson ? JSON.parse(databasesJson) : []
        const searchTerms = searchTermsJson ? JSON.parse(searchTermsJson) : []

        if (!protocolTitle || !objective || !reviewQuestionFull || !searchStrategy) {
            return { success: false, error: "Missing required fields" }
        }

        await prisma.$transaction(async (tx) => {
            const protocol = await tx.slrProtocol.create({
                data: {
                    projectId,
                    protocolTitle,
                    background,
                    objective,
                    reviewQuestionFull,
                    picoPopulation,
                    picoIntervention,
                    picoComparison,
                    picoOutcome,
                    searchStrategy,
                    identifyingOtherSources,
                    additionalLimits,
                    studyQualityAssessmentPlan,
                    dataExtractionAndSynthesis,
                },
            })

            if (databases.length > 0) {
                await tx.protocolDatabase.createMany({
                    data: databases.map((db: any) => ({
                        protocolId: protocol.id,
                        name: db.name,
                        notes: db.notes,
                    })),
                })
            }

            if (searchTerms.length > 0) {
                await tx.protocolSearchTerm.createMany({
                    data: searchTerms.map((term: any) => ({
                        protocolId: protocol.id,
                        groupName: term.groupName,
                        queryString: term.queryString,
                    })),
                })
            }
        })

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to create protocol:", error)
        return { success: false, error: error.message || "Failed to create protocol" }
    }
}

export async function updateProtocol(id: string, projectId: string, formData: FormData) {
    try {
        const data: any = {}
        const fields = [
            "protocolTitle", "background", "objective", "reviewQuestionFull",
            "picoPopulation", "picoIntervention", "picoComparison", "picoOutcome",
            "searchStrategy", "identifyingOtherSources", "additionalLimits",
            "studyQualityAssessmentPlan", "dataExtractionAndSynthesis"
        ]

        fields.forEach(field => {
            const val = formData.get(field)
            if (val !== null) data[field] = val as string
        })

        await prisma.slrProtocol.update({
            where: { id },
            data
        })

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to update protocol:", error)
        return { success: false, error: error.message || "Failed to update protocol" }
    }
}
