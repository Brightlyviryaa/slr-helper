"use server"

import { prisma } from "@/lib/prisma"

interface PromptResult {
    success: boolean
    prompt?: string
    error?: string
}

export async function generateAnalysisPrompt(projectId: string): Promise<PromptResult> {
    try {
        const project = await prisma.slrProject.findUnique({
            where: { id: projectId },
            include: {
                protocol: true
            }
        })

        if (!project) {
            return { success: false, error: "Project not found" }
        }

        const protocol = project.protocol

        if (!protocol) {
            return {
                success: false,
                error: "Please set up your SLR protocol first before generating a prompt."
            }
        }

        const prompt = buildPrompt(protocol, project.name)

        return { success: true, prompt }
    } catch (error: any) {
        console.error("Failed to generate prompt:", error)
        return { success: false, error: error.message || "Failed to generate prompt" }
    }
}

function buildPrompt(protocol: any, projectName: string): string {
    return `# SLR Paper Analysis Assistant

You are a research assistant helping me conduct a Systematic Literature Review (SLR). Your task is to analyze research papers and extract structured information.

---

## 📚 SLR Context

**Project:** ${projectName}
**Protocol Title:** ${protocol.protocolTitle || "Not specified"}

### Background
${protocol.background || "Not specified"}

### Objective
${protocol.objective || "Not specified"}

### Primary Review Question
${protocol.reviewQuestionFull || "Not specified"}

### PICO Framework
- **Population (P):** ${protocol.picoPopulation || "Not specified"}
- **Intervention (I):** ${protocol.picoIntervention || "Not specified"}
- **Comparison (C):** ${protocol.picoComparison || "Not specified"}
- **Outcome (O):** ${protocol.picoOutcome || "Not specified"}

### Search Strategy
${protocol.searchStrategy || "Not specified"}

### Quality Assessment Plan
${protocol.studyQualityAssessmentPlan || "Not specified"}

---

## 📝 Your Task

Read the paper I provide and create a **comprehensive analysis report** in Markdown format. Structure your response exactly as shown below:

---

# Paper Analysis Report

## 1. Basic Metadata
| Field | Value |
|-------|-------|
| **Title** | [Full paper title] |
| **Authors** | [Comma-separated list of authors] |
| **Year** | [Publication year] |
| **Venue** | [Journal/Conference name] |
| **Keywords** | [Main topics/keywords] |

### Abstract
> [Full abstract of the paper]

---

## 2. Source Links
| Field | Value |
|-------|-------|
| **DOI** | [DOI if available, or "N/A"] |
| **URL** | [Direct URL if available, or "N/A"] |

---

## 3. Classification
| Field | Value |
|-------|-------|
| **Research Type** | [Experiment / Survey / Case Study / Framework / Literature Review / Tool Development / Other] |
| **Domain/Context** | [Research domain, e.g., Healthcare, Finance, Software Engineering] |

---

## 4. Research Content

### Problem Statement
[What problem does this paper address? 2-3 sentences]

### Proposed Solution
[What solution/approach does this paper propose? 2-3 sentences]

### Key Techniques
[List the main methods, algorithms, or techniques used]

---

## 5. Methodology & Results

### Data Input Used
[What data/datasets were used in the study?]

### Output Artifact
[What did the study produce? (tool, model, framework, guidelines, etc.)]

### Evaluation Method
[How were the results evaluated?]

### Metrics & Results
[Key performance metrics and their values]

---

## 6. Qualitative Analysis

### Strengths
- [Strength 1]
- [Strength 2]
- [...]

### Limitations
- [Limitation 1]
- [Limitation 2]
- [...]

### Research Gap Notes
[What gaps does this study leave? What future work is suggested?]

### Relevance to My Research
[How is this paper relevant to the SLR objective: "${protocol.objective || "your research"}"]

---

## 7. Quality Assessment (0-16)

Rate each criterion: **0** = No, **1** = Partial, **2** = Yes

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Q1:** Are research objectives clearly stated? | [0/1/2] | [Brief note] |
| **Q2:** Is the methodology adequate? | [0/1/2] | [Brief note] |
| **Q3:** Is the sample size/selection appropriate? | [0/1/2] | [Brief note] |
| **Q4:** Is data collection clearly described? | [0/1/2] | [Brief note] |
| **Q5:** Is the data analysis rigorous? | [0/1/2] | [Brief note] |
| **Q6:** Are the findings clearly stated? | [0/1/2] | [Brief note] |
| **Q7:** Are threats to validity addressed? | [0/1/2] | [Brief note] |
| **Q8:** Is the contribution to knowledge clear? | [0/1/2] | [Brief note] |
| **Total** | [Sum/16] | |

### QA Notes
[Any additional notes about the quality of this paper]

---

## 8. Research Context
| Field | Value |
|-------|-------|
| **Comparison Baseline** | [Manual writing / Template/Checklist / NLP Classic / Other ML model / No baseline] |
| **Study Context** | [Industry / Academic / Tool / Dataset / Mixed] |
| **Ambiguity Type** | [If applicable: lexical, syntactic, semantic, pragmatic, requirement smells] |
| **Quality Framework** | [If applicable: INVEST, verifiable, completeness, ISO 29148, etc.] |

---

## 9. Workflow Recommendation

| Field | Value |
|-------|-------|
| **Suggested Status** | [TO_READ / READING / EXTRACTED / INCLUDED / EXCLUDED] |
| **Relevance Score** | [1-5, where 5 = highly relevant] |
| **Exclusion Reason** | [Only if status is EXCLUDED, otherwise "N/A"] |

### Reasoning
[Brief explanation of why you recommend this status and relevance score based on the SLR objective]

---

## ⚠️ Important Instructions

1. **Be thorough**: Extract as much information as possible from the paper
2. **Be accurate**: Only include information explicitly stated in the paper
3. **Use quotes**: When summarizing key points, quote the paper directly when helpful
4. **Stay objective**: Provide balanced analysis of strengths and limitations
5. **Consider context**: Evaluate relevance based on the SLR objective and PICO framework provided above

---

**I will now share the paper for analysis. Please follow the format above exactly.**`
}
