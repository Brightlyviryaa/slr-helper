"use client"

import * as React from "react"
import { X, Save, Loader2, BookOpen, Search, Target, Database, ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateProtocol } from "@/actions/protocol"
import { cn } from "@/lib/utils"

interface ProtocolEditorProps {
    isOpen: boolean
    onClose: () => void
    protocol: any
    projectId: string
}

export function ProtocolEditor({ isOpen, onClose, protocol, projectId }: ProtocolEditorProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const formRef = React.useRef<HTMLFormElement>(null)

    if (!protocol) return null

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const result = await updateProtocol(protocol.id, projectId, formData)

        setIsLoading(false)
        if (result.success) {
            onClose()
        } else {
            setError(result.error || "Failed to update protocol")
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <aside
                className={cn(
                    "fixed top-0 right-0 z-50 h-full w-full sm:w-[600px] lg:w-[800px] bg-white border-l shadow-2xl transition-transform duration-300 ease-in-out transform",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                        <h2 className="font-semibold text-slate-900">Edit Protocol</h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X size={18} />
                        </Button>
                    </div>

                    {/* Form */}
                    <form
                        ref={formRef}
                        onSubmit={handleSubmit}
                        className="flex-1 overflow-y-auto p-6 space-y-6"
                    >
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Section 1: Basics */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm border-b pb-2">
                                <BookOpen size={16} />
                                <h3>1. Protocol Basics</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">Protocol Title *</label>
                                <Input name="protocolTitle" defaultValue={protocol.protocolTitle} required />
                            </div>
                        </section>

                        {/* Section 2: Background & Objective */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm border-b pb-2">
                                <Target size={16} />
                                <h3>2. Background & Objective</h3>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Background</label>
                                    <Textarea name="background" defaultValue={protocol.background || ""} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Objective *</label>
                                    <Textarea name="objective" defaultValue={protocol.objective || ""} required />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Review Question */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm border-b pb-2">
                                <Search size={16} />
                                <h3>3. Review Question (PICO)</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">Primary Question *</label>
                                <Input name="reviewQuestionFull" defaultValue={protocol.reviewQuestionFull || ""} required />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Population</label>
                                    <Input name="picoPopulation" defaultValue={protocol.picoPopulation || ""} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Intervention</label>
                                    <Input name="picoIntervention" defaultValue={protocol.picoIntervention || ""} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Comparison</label>
                                    <Input name="picoComparison" defaultValue={protocol.picoComparison || ""} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Outcome</label>
                                    <Input name="picoOutcome" defaultValue={protocol.picoOutcome || ""} />
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Search Strategy */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm border-b pb-2">
                                <ListFilter size={16} />
                                <h3>4. Search Strategy</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">Core Strategy *</label>
                                <Textarea name="searchStrategy" defaultValue={protocol.searchStrategy || ""} required />
                            </div>
                        </section>

                        {/* Section 5: Assessment & Extraction */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm border-b pb-2">
                                <Database size={16} />
                                <h3>5. Assessment & Extraction</h3>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Quality Assessment Plan</label>
                                    <Textarea name="studyQualityAssessmentPlan" defaultValue={protocol.studyQualityAssessmentPlan || ""} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Extraction Plan</label>
                                    <Textarea name="dataExtractionAndSynthesis" defaultValue={protocol.dataExtractionAndSynthesis || ""} />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Snowballing/Other Sources</label>
                                    <Input name="identifyingOtherSources" defaultValue={protocol.identifyingOtherSources || ""} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-700">Additional Limits</label>
                                    <Input name="additionalLimits" defaultValue={protocol.additionalLimits || ""} />
                                </div>
                            </div>
                        </section>
                    </form>

                    {/* Footer */}
                    <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={() => formRef.current?.requestSubmit()} disabled={isLoading} className="gap-2 px-8">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                            Save Protocol
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    )
}
