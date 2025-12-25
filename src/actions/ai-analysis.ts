"use server"

import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

// Schema untuk structured output
const StudyAnalysisSchema = z.object({
    // Section 1: Basic Metadata
    title: z.string().describe("Full paper title"),
    authors: z.string().describe("Comma-separated list of authors"),
    year: z.number().describe("Publication year"),
    venue: z.string().describe("Journal or conference name"),
    keywords: z.string().describe("Key topics, comma-separated"),
    abstract: z.string().describe("Paper abstract"),

    // Section 4: Classification
    researchType: z.enum([
        "Experiment",
        "Survey",
        "Case Study",
        "Framework",
        "Literature Review",
        "Tool Development",
        "Other"
    ]).describe("Type of research conducted"),
    domain: z.string().describe("Research domain/context"),

    // Section 5: Research Content
    problemStatement: z.string().describe("Main problem addressed by the paper"),
    proposedSolution: z.string().describe("Proposed approach or solution"),
    keyTechniques: z.string().describe("Methods, algorithms, or techniques used"),

    // Section 6: Methodology & Results
    dataInputUsed: z.string().describe("Data or datasets used"),
    outputArtifact: z.string().describe("What the study produced"),
    evaluationMethod: z.string().describe("How results were evaluated"),
    metricsResults: z.string().describe("Key metrics and their values"),

    // Section 7: Qualitative Analysis
    strengths: z.string().describe("Paper strengths"),
    limitations: z.string().describe("Paper limitations"),
    gapNotes: z.string().describe("Research gaps identified"),
    adoptionForThesis: z.string().describe("Relevance to the SLR objective"),

    // Section 8: Quality Assessment (0-2 each)
    qaQ1: z.number().min(0).max(2).describe("Q1: Are research objectives clearly stated?"),
    qaQ2: z.number().min(0).max(2).describe("Q2: Is the methodology adequate?"),
    qaQ3: z.number().min(0).max(2).describe("Q3: Is the sample size/selection appropriate?"),
    qaQ4: z.number().min(0).max(2).describe("Q4: Is data collection clearly described?"),
    qaQ5: z.number().min(0).max(2).describe("Q5: Is the data analysis rigorous?"),
    qaQ6: z.number().min(0).max(2).describe("Q6: Are the findings clearly stated?"),
    qaQ7: z.number().min(0).max(2).describe("Q7: Are threats to validity addressed?"),
    qaQ8: z.number().min(0).max(2).describe("Q8: Is the contribution to knowledge clear?"),
    qaNotes: z.string().describe("Additional notes about paper quality"),

    // Section 9: Research Context
    comparisonBaseline: z.enum([
        "Manual writing",
        "Template/Checklist",
        "NLP Classic",
        "Other ML model",
        "No baseline"
    ]).describe("Baseline used for comparison"),
    studyContext: z.enum([
        "Industry",
        "Academic",
        "Tool",
        "Dataset",
        "Mixed"
    ]).describe("Context of the study"),
    ambiguityType: z.string().optional().describe("Type of ambiguity addressed if applicable"),
    qualityFramework: z.string().optional().describe("Quality framework used if applicable"),

    // Workflow Recommendation
    suggestedStatus: z.enum([
        "TO_READ",
        "READING",
        "EXTRACTED",
        "INCLUDED",
        "EXCLUDED"
    ]).describe("Recommended workflow status"),
    relevanceScore: z.number().min(1).max(5).describe("Relevance to SLR (1-5)"),
    exclusionReason: z.string().optional().describe("Reason for exclusion if status is EXCLUDED"),

    // AI Reasoning
    reasoning: z.string().describe("Detailed reasoning for all decisions based on SLR protocol")
})

export type StudyAnalysisData = z.infer<typeof StudyAnalysisSchema>

interface AnalysisResult {
    success: boolean
    data?: StudyAnalysisData
    error?: string
}

export async function analyzePdfWithAi(
    pdfBase64: string,
    projectId: string
): Promise<AnalysisResult> {
    try {
        // Fetch protocol for context
        const project = await prisma.slrProject.findUnique({
            where: { id: projectId },
            include: { protocol: true }
        })

        if (!project?.protocol) {
            return { success: false, error: "Please set up your SLR protocol first" }
        }

        const protocol = project.protocol

        // Parse PDF to text using unpdf (works without canvas)
        const { extractText } = await import("unpdf")
        const pdfBuffer = Buffer.from(pdfBase64, "base64")
        const pdfUint8Array = new Uint8Array(pdfBuffer)
        const { text: rawText } = await extractText(pdfUint8Array, { mergePages: true })
        const pdfText = (rawText || "").slice(0, 50000) // Limit to 50k chars

        if (!pdfText || pdfText.length < 100) {
            return { success: false, error: "Could not extract text from PDF. The file may be scanned or corrupted." }
        }

        // Build protocol context
        const protocolContext = `
## SLR Protocol Context

**Protocol Title:** ${protocol.protocolTitle || "Not specified"}
**Review Question:** ${protocol.reviewQuestionFull || "Not specified"}
**Objective:** ${protocol.objective || "Not specified"}
**Background:** ${protocol.background || "Not specified"}

### PICO Framework
- **Population:** ${protocol.picoPopulation || "Not specified"}
- **Intervention:** ${protocol.picoIntervention || "Not specified"}
- **Comparison:** ${protocol.picoComparison || "Not specified"}
- **Outcome:** ${protocol.picoOutcome || "Not specified"}

### Quality Assessment Criteria (Q1-Q8, rate 0-2)
- Q1: Are research objectives clearly stated? (0=No, 1=Partial, 2=Yes)
- Q2: Is the methodology adequate for the objectives? (0=No, 1=Partial, 2=Yes)
- Q3: Is the sample size/selection appropriate? (0=No, 1=Partial, 2=Yes)
- Q4: Is data collection clearly described? (0=No, 1=Partial, 2=Yes)
- Q5: Is the data analysis rigorous? (0=No, 1=Partial, 2=Yes)
- Q6: Are the findings clearly stated? (0=No, 1=Partial, 2=Yes)
- Q7: Are threats to validity addressed? (0=No, 1=Partial, 2=Yes)
- Q8: Is the contribution to knowledge clear? (0=No, 1=Partial, 2=Yes)

### Search Strategy
${protocol.searchStrategy || "Not specified"}

### Quality Assessment Plan
${protocol.studyQualityAssessmentPlan || "Not specified"}
`

        const { object } = await generateObject({
            model: google("gemini-3-flash-preview"),
            schema: StudyAnalysisSchema,
            prompt: `You are a research paper analyst for a Systematic Literature Review (SLR).
Your task is to thoroughly analyze the provided paper and extract structured information.

${protocolContext}

---

## Paper Content

${pdfText}

---

## Instructions

1. **Extract all metadata** (title, authors, year, venue, keywords, abstract) accurately from the paper.

2. **Classify the research** based on its methodology and domain.

3. **Analyze the content** - identify the problem, solution, and key techniques used.

4. **Evaluate methodology** - describe data used, outputs produced, evaluation methods, and results.

5. **Perform qualitative analysis** - identify strengths, limitations, and research gaps.
   For "adoptionForThesis", explain how this paper relates to the SLR objective: "${protocol.objective || "the research objective"}"

6. **Quality Assessment (Q1-Q8)** - rate each criterion 0 (No), 1 (Partial), or 2 (Yes) based on careful evaluation.
   Be objective and justify scores in qaNotes.

7. **Research Context** - identify baseline comparisons and study context.

8. **Workflow Recommendation**:
   - If the paper is highly relevant to the SLR objective → INCLUDED (relevanceScore: 4-5)
   - If the paper is somewhat relevant → EXTRACTED (relevanceScore: 3)
   - If the paper needs more review → READING (relevanceScore: 2-3)
   - If the paper is not relevant → EXCLUDED with reason (relevanceScore: 1-2)

9. **Reasoning** - provide a comprehensive explanation of your analysis, connecting your decisions to the SLR protocol.
   This should be a detailed paragraph explaining why you made each major decision.

Be thorough, accurate, and objective. Base all extractions ONLY on what is stated in the paper.
`
        })

        return { success: true, data: object }
    } catch (error: any) {
        console.error("AI analysis failed:", error)

        if (error.message?.includes("rate limit")) {
            return { success: false, error: "AI rate limit exceeded. Please try again in a few minutes." }
        }

        return { success: false, error: error.message || "Failed to analyze PDF. Please try again." }
    }
}
