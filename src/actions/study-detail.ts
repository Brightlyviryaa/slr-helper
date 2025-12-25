"use server"

import { prisma } from "@/lib/prisma"

export async function getStudyById(studyId: string) {
    try {
        const study = await prisma.slrStudy.findUnique({
            where: { id: studyId },
            include: {
                project: {
                    include: {
                        protocol: true
                    }
                },
                tags: true,
                qualityScores: true
            }
        })

        if (!study) {
            return { success: false, error: "Study not found" }
        }

        return { success: true, data: study }
    } catch (error: any) {
        console.error("Failed to get study:", error)
        return { success: false, error: error.message || "Failed to get study" }
    }
}
