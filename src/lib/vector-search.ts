"use server"

import { prisma } from "@/lib/prisma"
import { embedText, embedTexts } from "@/lib/voyage"
import {
    upsertStudyVector,
    deleteStudyVector,
    searchSimilar,
    type StudyVectorRecord
} from "@/lib/lancedb"
import type { SlrStudy } from "@prisma/client"

/**
 * High-level vector search functions for SLR studies
 */

/**
 * Prepare text content for embedding from a study
 * Includes ALL fields for comprehensive semantic search
 */
function prepareStudyText(study: SlrStudy): string {
    const parts: string[] = []

    // Basic Metadata
    if (study.title) parts.push(`Title: ${study.title}`)
    if (study.abstract) parts.push(`Abstract: ${study.abstract}`)
    if (study.keywords) parts.push(`Keywords: ${study.keywords}`)
    if (study.authors) parts.push(`Authors: ${study.authors}`)
    if (study.venue) parts.push(`Venue: ${study.venue}`)

    // Classification
    if (study.researchType) parts.push(`Research Type: ${study.researchType}`)
    if (study.domain) parts.push(`Domain: ${study.domain}`)

    // Research Content
    if (study.problemStatement) parts.push(`Problem Statement: ${study.problemStatement}`)
    if (study.proposedSolution) parts.push(`Proposed Solution: ${study.proposedSolution}`)
    if (study.keyTechniques) parts.push(`Key Techniques: ${study.keyTechniques}`)

    // Methodology & Results
    if (study.dataInputUsed) parts.push(`Data Input: ${study.dataInputUsed}`)
    if (study.outputArtifact) parts.push(`Output Artifact: ${study.outputArtifact}`)
    if (study.evaluationMethod) parts.push(`Evaluation Method: ${study.evaluationMethod}`)
    if (study.metricsResults) parts.push(`Metrics & Results: ${study.metricsResults}`)

    // Qualitative Analysis
    if (study.strengths) parts.push(`Strengths: ${study.strengths}`)
    if (study.limitations) parts.push(`Limitations: ${study.limitations}`)
    if (study.gapNotes) parts.push(`Research Gaps: ${study.gapNotes}`)
    if (study.adoptionForThesis) parts.push(`Adoption for Thesis: ${study.adoptionForThesis}`)

    // Quality Assessment
    if (study.qaNotes) parts.push(`Quality Notes: ${study.qaNotes}`)

    // Research Context
    if (study.comparisonBaseline) parts.push(`Baseline Comparison: ${study.comparisonBaseline}`)
    if (study.studyContext) parts.push(`Study Context: ${study.studyContext}`)
    if (study.ambiguityType) parts.push(`Ambiguity Type: ${study.ambiguityType}`)
    if (study.qualityFramework) parts.push(`Quality Framework: ${study.qualityFramework}`)

    return parts.join("\n\n")
}

/**
 * Index a single study in the vector database
 */
export async function indexStudy(study: SlrStudy): Promise<void> {
    const text = prepareStudyText(study)

    if (!text.trim()) {
        console.log(`Skipping study ${study.id}: no text content to embed`)
        return
    }

    // Generate embedding
    const vector = await embedText(text, "document")

    // Create vector record
    const record: StudyVectorRecord = {
        id: study.id,
        projectId: study.projectId,
        vector,
        title: study.title,
        paperKey: study.paperKey,
        status: study.status,
        year: study.year,
        authors: study.authors,
        abstract: study.abstract,
        embeddedText: text,  // Store the raw text that was embedded
    }

    // Store in LanceDB
    await upsertStudyVector(study.projectId, record)

    // Update SQLite with embedding reference
    await prisma.slrStudy.update({
        where: { id: study.id },
        data: {
            embeddingId: study.id, // Using study ID as embedding reference
            embeddedAt: new Date(),
        },
    })
}

/**
 * Remove a study from the vector index
 */
export async function removeStudyFromIndex(
    projectId: string,
    studyId: string
): Promise<void> {
    await deleteStudyVector(projectId, studyId)

    await prisma.slrStudy.update({
        where: { id: studyId },
        data: {
            embeddingId: null,
            embeddedAt: null,
        },
    })
}

/**
 * Re-index all INCLUDED studies in a project
 * Returns count of indexed studies and any errors
 */
export async function reindexAllStudies(
    projectId: string
): Promise<{ indexed: number; errors: number; total: number }> {
    // Fetch all INCLUDED studies
    const studies = await prisma.slrStudy.findMany({
        where: {
            projectId,
            status: "INCLUDED",
        },
    })

    let indexed = 0
    let errors = 0
    const total = studies.length

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < studies.length; i += batchSize) {
        const batch = studies.slice(i, i + batchSize)

        // Prepare texts for batch embedding
        const textsWithStudies = batch
            .map(study => ({ study, text: prepareStudyText(study) }))
            .filter(item => item.text.trim())

        if (textsWithStudies.length === 0) continue

        try {
            // Batch embed
            const texts = textsWithStudies.map(item => item.text)
            const vectors = await embedTexts(texts, "document")

            // Store each result
            for (let j = 0; j < textsWithStudies.length; j++) {
                const { study } = textsWithStudies[j]
                const vector = vectors[j]

                try {
                    const record: StudyVectorRecord = {
                        id: study.id,
                        projectId: study.projectId,
                        vector,
                        title: study.title,
                        paperKey: study.paperKey,
                        status: study.status,
                        year: study.year,
                        authors: study.authors,
                        abstract: study.abstract,
                        embeddedText: textsWithStudies[j].text,
                    }

                    await upsertStudyVector(study.projectId, record)

                    await prisma.slrStudy.update({
                        where: { id: study.id },
                        data: {
                            embeddingId: study.id,
                            embeddedAt: new Date(),
                        },
                    })

                    indexed++
                } catch (err) {
                    console.error(`Error indexing study ${study.id}:`, err)
                    errors++
                }
            }
        } catch (err) {
            console.error(`Error batch embedding:`, err)
            errors += textsWithStudies.length
        }
    }

    return { indexed, errors, total }
}

/**
 * Search studies by semantic similarity
 */
export async function searchStudies(
    projectId: string,
    query: string,
    limit: number = 10
): Promise<{
    id: string
    title: string
    paperKey: string
    authors: string | null
    abstract: string | null
    year: number
    status: string
    score?: number
}[]> {
    if (!query.trim()) {
        return []
    }

    // Embed query
    const queryVector = await embedText(query, "query")

    // Search in LanceDB
    const results = await searchSimilar(projectId, queryVector, limit)

    return results.map(r => ({
        id: r.id,
        title: r.title,
        paperKey: r.paperKey,
        authors: r.authors,
        abstract: r.abstract,
        year: r.year,
        status: r.status,
    }))
}
