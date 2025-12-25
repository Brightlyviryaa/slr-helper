"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { InlineListEditor } from "@/components/ui/InlineListEditor"
import { createProtocol } from "@/actions/protocol"
import { Loader2, BookOpen, Search, Target, Database, ListFilter, ClipboardList } from "lucide-react"

interface ProtocolOnboardingProps {
    projectId: string
    projectName: string
}

export function ProtocolOnboarding({ projectId, projectName }: ProtocolOnboardingProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [databases, setDatabases] = React.useState<any[]>([])
    const [searchTerms, setSearchTerms] = React.useState<any[]>([])
    const [error, setError] = React.useState<string | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        formData.append("databases", JSON.stringify(databases))
        formData.append("searchTerms", JSON.stringify(searchTerms))

        const result = await createProtocol(projectId, formData)

        if (!result.success) {
            setError(result.error || "Failed to create protocol")
            setIsLoading(false)
        }
        // Success will trigger revalidatePath and the server component will switch view
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8 text-center">
                <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                    <ClipboardList size={24} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Define Your Protocol</h1>
                <p className="text-slate-600 mt-2">
                    Project: <span className="font-semibold text-slate-800">{projectName}</span>
                </p>
                <p className="text-sm text-slate-500 mt-1">
                    Complete your review protocol before adding studies. You can always edit this later.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white border rounded-xl shadow-sm p-8">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                        {error}
                    </div>
                )}

                {/* Section 1: Basics */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold border-b pb-2">
                        <BookOpen size={18} />
                        <h2>1. Protocol Basics</h2>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="protocolTitle" className="text-sm font-medium text-slate-700">Protocol Title*</label>
                        <Input id="protocolTitle" name="protocolTitle" placeholder="e.g. Systematic Literature Review on LLMs for PM" required autoFocus />
                    </div>
                </section>

                {/* Section 2: Background & Objective */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold border-b pb-2">
                        <Target size={18} />
                        <h2>2. Background & Objective</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="background" className="text-sm font-medium text-slate-700">Background</label>
                            <Textarea id="background" name="background" placeholder="Describe the current state of research..." />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="objective" className="text-sm font-medium text-slate-700">Objective*</label>
                            <Textarea id="objective" name="objective" placeholder="What is the main goal of this review?" required />
                        </div>
                    </div>
                </section>

                {/* Section 3: Review Question */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold border-b pb-2">
                        <Search size={18} />
                        <h2>3. Review Question</h2>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="reviewQuestionFull" className="text-sm font-medium text-slate-700">Primary Question*</label>
                        <Input id="reviewQuestionFull" name="reviewQuestionFull" placeholder="e.g. What are the state-of-the-art techniques for...?" required />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="picoPopulation" className="text-sm font-medium text-slate-700">Population</label>
                            <Input id="picoPopulation" name="picoPopulation" placeholder="e.g. Software Engineers" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="picoIntervention" className="text-sm font-medium text-slate-700">Intervention</label>
                            <Input id="picoIntervention" name="picoIntervention" placeholder="e.g. LLM-based assistant" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="picoComparison" className="text-sm font-medium text-slate-700">Comparison</label>
                            <Input id="picoComparison" name="picoComparison" placeholder="e.g. Manual coding" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="picoOutcome" className="text-sm font-medium text-slate-700">Outcome</label>
                            <Input id="picoOutcome" name="picoOutcome" placeholder="e.g. Productivity improvement" />
                        </div>
                    </div>
                </section>

                {/* Section 4: Search Strategy */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold border-b pb-2">
                        <ListFilter size={18} />
                        <h2>4. Search Strategy</h2>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="searchStrategy" className="text-sm font-medium text-slate-700">Core Strategy*</label>
                        <Textarea id="searchStrategy" name="searchStrategy" placeholder="How will you find relevant papers?" required />
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2">
                        <InlineListEditor
                            label="Digital Databases"
                            addButtonLabel="Add Database"
                            items={databases}
                            onChange={setDatabases}
                            fields={[
                                { name: "name", label: "Name", placeholder: "e.g. ACM DL" },
                                { name: "notes", label: "Notes", placeholder: "URL or credentials..." }
                            ]}
                        />
                        <InlineListEditor
                            label="Search Terms Groups"
                            addButtonLabel="Add Group"
                            items={searchTerms}
                            onChange={setSearchTerms}
                            fields={[
                                { name: "groupName", label: "Group", placeholder: "e.g. AI terms" },
                                { name: "queryString", label: "Query", placeholder: '"machine learning" OR "deep learning"' }
                            ]}
                        />
                    </div>
                </section>

                {/* Section 5: Other Sources & Quality Assessment */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold border-b pb-2">
                        <Database size={18} />
                        <h2>5. Assessment & Extraction</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="studyQualityAssessmentPlan" className="text-sm font-medium text-slate-700">Quality Assessment Plan</label>
                            <Textarea id="studyQualityAssessmentPlan" name="studyQualityAssessmentPlan" placeholder="How will you score paper quality?" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="dataExtractionAndSynthesis" className="text-sm font-medium text-slate-700">Extraction Plan</label>
                            <Textarea id="dataExtractionAndSynthesis" name="dataExtractionAndSynthesis" placeholder="What data will be extracted?" />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="identifyingOtherSources" className="text-sm font-medium text-slate-700">Snowballing/Other Sources</label>
                            <Input id="identifyingOtherSources" name="identifyingOtherSources" placeholder="e.g. backward/forward snowballing" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="additionalLimits" className="text-sm font-medium text-slate-700">Additional Limits</label>
                            <Input id="additionalLimits" name="additionalLimits" placeholder="e.g. English only, 2015-2024" />
                        </div>
                    </div>
                </section>

                <div className="pt-6 border-t">
                    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving Protocol...
                            </>
                        ) : (
                            "Save & Continue to Studies"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
