"use client"

import * as React from "react"
import { X, Save, Loader2, ChevronDown, ChevronRight, Upload, Brain, FileText, AlertCircle, ExternalLink, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { updateStudy } from "@/actions/study"
import { analyzePdfWithAi, StudyAnalysisData } from "@/actions/ai-analysis"
import { uploadAndProcessDocument, getStudyDocumentStatus, deleteStudyDocument, reprocessDocumentEmbeddings } from "@/actions/document"
import { cn } from "@/lib/utils"

interface StudyEditorPanelProps {
    isOpen: boolean
    onClose: () => void
    study: any
    projectId: string
    protocol?: any
}

function Section({ title, children, defaultOpen = true, forceOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean; forceOpen?: boolean }) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)

    // Force open when forceOpen prop changes to true
    React.useEffect(() => {
        if (forceOpen) setIsOpen(true)
    }, [forceOpen])

    return (
        <section className="border-b border-slate-100 last:border-0">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3 text-left font-bold text-indigo-600 uppercase tracking-wider text-xs hover:bg-slate-50 px-1 rounded"
            >
                <span>{title}</span>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isOpen && <div className="pb-5 space-y-4">{children}</div>}
        </section>
    )
}

export function StudyEditorPanel({ isOpen, onClose, study, projectId, protocol }: StudyEditorPanelProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const formRef = React.useRef<HTMLFormElement>(null)

    // AI Analysis state
    const [pdfFile, setPdfFile] = React.useState<File | null>(null)
    const [isAnalyzing, setIsAnalyzing] = React.useState(false)
    const [aiReasoning, setAiReasoning] = React.useState<string | null>(null)
    const [aiError, setAiError] = React.useState<string | null>(null)
    const [expandAllSections, setExpandAllSections] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Document-only upload state
    const [isUploadingDoc, setIsUploadingDoc] = React.useState(false)
    const docFileInputRef = React.useRef<HTMLInputElement>(null)

    // Re-indexing state
    const [isResetting, setIsResetting] = React.useState(false)
    const [isReprocessing, setIsReprocessing] = React.useState(false)

    // Document status state
    const [docStatus, setDocStatus] = React.useState<{
        hasDocument: boolean
        document: { id: string; fileName: string; filePath: string; fileSize: number; pageCount: number | null; processedAt: Date | null } | null
        totalChunks: number
        embeddedChunks: number
    } | null>(null)

    // Fetch document status when study changes
    React.useEffect(() => {
        if (study?.id) {
            getStudyDocumentStatus(study.id).then(result => {
                if (result.success) {
                    setDocStatus({
                        hasDocument: result.hasDocument,
                        document: result.document,
                        totalChunks: result.totalChunks,
                        embeddedChunks: result.embeddedChunks,
                    })
                }
            })
        }
    }, [study?.id])

    // Reset state when panel closes or study changes
    React.useEffect(() => {
        if (!isOpen) {
            setPdfFile(null)
            setAiReasoning(null)
            setAiError(null)
            setDocStatus(null)
            setIsUploadingDoc(false)
        }
    }, [isOpen, study?.id])

    // Handler for document-only upload (chunking without AI analysis)
    async function handleDocumentOnlyUpload(file: File) {
        setIsUploadingDoc(true)
        try {
            const buffer = await file.arrayBuffer()
            const base64 = Buffer.from(buffer).toString("base64")

            const result = await uploadAndProcessDocument(
                study.id,
                projectId,
                base64,
                file.name
            )

            if (result.success) {
                // Refresh document status
                const statusResult = await getStudyDocumentStatus(study.id)
                if (statusResult.success) {
                    setDocStatus({
                        hasDocument: statusResult.hasDocument,
                        document: statusResult.document,
                        totalChunks: statusResult.totalChunks,
                        embeddedChunks: statusResult.embeddedChunks,
                    })
                }
            }
        } catch (err) {
            console.error("Document upload failed:", err)
        } finally {
            setIsUploadingDoc(false)
        }
    }

    if (!study) return null

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)
        const formData = new FormData(event.currentTarget)
        const result = await updateStudy(study.id, projectId, formData)
        setIsLoading(false)
        if (result.success) {
            onClose()
        } else {
            setError(result.error || "Failed to save")
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file?.type === "application/pdf") {
            setPdfFile(file)
            setAiError(null)
        } else {
            setAiError("Please upload a PDF file")
        }
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file?.type === "application/pdf") {
            setPdfFile(file)
            setAiError(null)
        } else if (file) {
            setAiError("Please upload a PDF file")
        }
    }

    async function handleAnalyze() {
        if (!pdfFile) return

        setIsAnalyzing(true)
        setAiError(null)
        setAiReasoning(null)

        try {
            // Convert file to base64
            const buffer = await pdfFile.arrayBuffer()
            const base64 = Buffer.from(buffer).toString("base64")

            const result = await analyzePdfWithAi(base64, projectId)

            if (result.success && result.data) {
                // Auto-fill form fields
                fillFormWithAiData(result.data)
                setAiReasoning(result.data.reasoning)

                // Save PDF and trigger chunking in background
                try {
                    await uploadAndProcessDocument(
                        study.id,
                        projectId,
                        base64,  // Pass base64 string instead of buffer
                        pdfFile.name
                    )
                } catch (uploadErr) {
                    console.error("Failed to save PDF (non-blocking):", uploadErr)
                }
            } else {
                setAiError(result.error || "Failed to analyze PDF")
            }
        } catch (err: any) {
            setAiError(err.message || "Failed to analyze PDF")
        } finally {
            setIsAnalyzing(false)
        }
    }

    function fillFormWithAiData(data: StudyAnalysisData) {
        const form = formRef.current
        if (!form) {
            console.error("Form ref not found")
            return
        }

        console.log("AI Data received:", data)

        // Helper to set input value and trigger change event
        const setValue = (name: string, value: string | number | undefined) => {
            const input = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            if (input && value !== undefined && value !== null) {
                const newValue = String(value)
                input.value = newValue
                // Trigger input event for React to detect change
                input.dispatchEvent(new Event("input", { bubbles: true }))
                input.dispatchEvent(new Event("change", { bubbles: true }))
                console.log(`Set ${name} = ${newValue}`)
            } else if (!input) {
                console.warn(`Input not found: ${name}`)
            }
        }

        // Expand all sections first so all inputs are in DOM
        setExpandAllSections(true)

        // Use setTimeout to ensure DOM is updated after sections expand
        setTimeout(() => {
            // Section 1: Basic Metadata
            setValue("title", data.title)
            setValue("authors", data.authors)
            setValue("year", data.year)
            setValue("venue", data.venue)
            setValue("keywords", data.keywords)
            setValue("abstract", data.abstract)

            // Section 4: Classification
            setValue("researchType", data.researchType)
            setValue("domain", data.domain)

            // Section 5: Research Content
            setValue("problemStatement", data.problemStatement)
            setValue("proposedSolution", data.proposedSolution)
            setValue("keyTechniques", data.keyTechniques)

            // Section 6: Methodology
            setValue("dataInputUsed", data.dataInputUsed)
            setValue("outputArtifact", data.outputArtifact)
            setValue("evaluationMethod", data.evaluationMethod)
            setValue("metricsResults", data.metricsResults)

            // Section 7: Qualitative
            setValue("strengths", data.strengths)
            setValue("limitations", data.limitations)
            setValue("gapNotes", data.gapNotes)
            setValue("adoptionForThesis", data.adoptionForThesis)

            // Section 8: Quality Assessment
            setValue("qaQ1", data.qaQ1)
            setValue("qaQ2", data.qaQ2)
            setValue("qaQ3", data.qaQ3)
            setValue("qaQ4", data.qaQ4)
            setValue("qaQ5", data.qaQ5)
            setValue("qaQ6", data.qaQ6)
            setValue("qaQ7", data.qaQ7)
            setValue("qaQ8", data.qaQ8)
            setValue("qaNotes", data.qaNotes)

            // Section 9: Research Context
            setValue("comparisonBaseline", data.comparisonBaseline)
            setValue("studyContext", data.studyContext)
            setValue("ambiguityType", data.ambiguityType || "")
            setValue("qualityFramework", data.qualityFramework || "")

            // Workflow
            setValue("status", data.suggestedStatus)
            setValue("relevanceScore", data.relevanceScore)
            if (data.exclusionReason) {
                setValue("exclusionReason", data.exclusionReason)
            }
        }, 100)
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
                    "fixed top-0 right-0 z-50 h-full w-full sm:w-[520px] lg:w-[700px] bg-white border-l shadow-2xl transition-transform duration-300 ease-in-out transform",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">
                                {study.paperKey}
                            </div>
                            <h2 className="font-semibold text-slate-900 truncate max-w-[250px] sm:max-w-md">
                                {study.title}
                            </h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X size={18} />
                        </Button>
                    </div>

                    {/* Form - key forces re-render when study changes */}
                    <form
                        key={study.id}
                        ref={formRef}
                        onSubmit={handleSubmit}
                        className="flex-1 overflow-y-auto p-6 space-y-2"
                    >
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md mb-4">
                                {error}
                            </div>
                        )}

                        {/* Document Status */}
                        {docStatus && (
                            <section className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Database size={18} className="text-slate-600" />
                                        <h3 className="font-semibold text-slate-800">Document Status</h3>
                                    </div>
                                    {docStatus.hasDocument ? (
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-700">
                                            Indexed ✓
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-slate-200 text-slate-600">
                                            Not Indexed
                                        </span>
                                    )}
                                </div>

                                {docStatus.hasDocument && docStatus.document ? (
                                    <div className="space-y-3">
                                        {/* File info & Open button */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                <FileText size={14} />
                                                <span className="truncate max-w-[200px]">{docStatus.document.fileName}</span>
                                            </div>
                                            <a
                                                href={`/${docStatus.document.filePath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                            >
                                                <ExternalLink size={12} />
                                                Open Document
                                            </a>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-xs text-slate-600">
                                            <span>
                                                <strong className="text-slate-800">{docStatus.embeddedChunks}</strong>/{docStatus.totalChunks} chunks embedded
                                            </span>
                                            {docStatus.document.pageCount && (
                                                <span>
                                                    <strong className="text-slate-800">{docStatus.document.pageCount}</strong> pages
                                                </span>
                                            )}
                                            <span>
                                                <strong className="text-slate-800">{(docStatus.document.fileSize / 1024 / 1024).toFixed(2)}</strong> MB
                                            </span>
                                        </div>

                                        {/* Delete button - always visible for indexed documents */}
                                        {docStatus.embeddedChunks === docStatus.totalChunks && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={isResetting}
                                                onClick={async () => {
                                                    if (!docStatus.document) return
                                                    if (!confirm("This will delete the PDF file and all chunks. You will need to re-upload. Continue?")) return
                                                    setIsResetting(true)
                                                    try {
                                                        const result = await deleteStudyDocument(docStatus.document.id, projectId)
                                                        if (result.success) {
                                                            setDocStatus({
                                                                hasDocument: false,
                                                                document: null,
                                                                totalChunks: 0,
                                                                embeddedChunks: 0,
                                                            })
                                                        }
                                                    } catch (err) {
                                                        console.error("Delete failed:", err)
                                                    } finally {
                                                        setIsResetting(false)
                                                    }
                                                }}
                                                className="text-xs text-slate-500 hover:text-red-600 mt-2"
                                            >
                                                {isResetting ? "Deleting..." : "🗑️ Delete Document"}
                                            </Button>
                                        )}

                                        {/* Processing status or stuck state */}
                                        {docStatus.totalChunks > 0 && docStatus.embeddedChunks < docStatus.totalChunks && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    <span>Embedding in progress... ({docStatus.embeddedChunks}/{docStatus.totalChunks})</span>
                                                </div>
                                                {/* Re-index button for stuck embeddings */}
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={isReprocessing || isResetting}
                                                        onClick={async () => {
                                                            if (!docStatus.document) return
                                                            setIsReprocessing(true)
                                                            try {
                                                                const result = await reprocessDocumentEmbeddings(docStatus.document.id, projectId)
                                                                if (result.success) {
                                                                    const statusResult = await getStudyDocumentStatus(study.id)
                                                                    if (statusResult.success) {
                                                                        setDocStatus({
                                                                            hasDocument: statusResult.hasDocument,
                                                                            document: statusResult.document,
                                                                            totalChunks: statusResult.totalChunks,
                                                                            embeddedChunks: statusResult.embeddedChunks,
                                                                        })
                                                                    }
                                                                }
                                                            } catch (err) {
                                                                console.error("Re-index failed:", err)
                                                            } finally {
                                                                setIsReprocessing(false)
                                                            }
                                                        }}
                                                        className="text-xs gap-1"
                                                    >
                                                        {isReprocessing ? (
                                                            <><Loader2 size={12} className="animate-spin" /> Re-indexing...</>
                                                        ) : (
                                                            <>🔄 Re-index</>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={isReprocessing || isResetting}
                                                        onClick={async () => {
                                                            if (!docStatus.document) return
                                                            if (!confirm("This will delete the PDF file and all chunks. You will need to re-upload. Continue?")) return
                                                            setIsResetting(true)
                                                            try {
                                                                const result = await deleteStudyDocument(docStatus.document.id, projectId)
                                                                if (result.success) {
                                                                    // Clear local state - document is now gone
                                                                    setDocStatus({
                                                                        hasDocument: false,
                                                                        document: null,
                                                                        totalChunks: 0,
                                                                        embeddedChunks: 0,
                                                                    })
                                                                }
                                                            } catch (err) {
                                                                console.error("Delete failed:", err)
                                                            } finally {
                                                                setIsResetting(false)
                                                            }
                                                        }}
                                                        className="text-xs text-slate-500 hover:text-red-600"
                                                    >
                                                        {isResetting ? "Deleting..." : "🗑️ Delete Document"}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Upload zone for chunking only */}
                                        <div
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                const file = e.dataTransfer.files[0]
                                                if (file?.type === "application/pdf") {
                                                    handleDocumentOnlyUpload(file)
                                                }
                                            }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onClick={() => docFileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
                                        >
                                            <input
                                                ref={docFileInputRef}
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file?.type === "application/pdf") {
                                                        handleDocumentOnlyUpload(file)
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            {isUploadingDoc ? (
                                                <div className="flex items-center justify-center gap-2 text-slate-600">
                                                    <Loader2 size={16} className="animate-spin" />
                                                    <span className="text-sm">Uploading & indexing...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="mx-auto h-6 w-6 text-slate-400" />
                                                    <p className="mt-1 text-xs text-slate-600">
                                                        Drag & drop PDF or <span className="font-semibold text-indigo-600">browse</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        Document will be chunked & indexed for search
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* AI Analysis Mode */}
                        {protocol && (
                            <section className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <Brain size={20} className="text-indigo-600" />
                                    <h3 className="font-semibold text-indigo-900">AI Analysis Mode</h3>
                                </div>
                                <p className="text-xs text-indigo-700 mb-4">
                                    Upload a PDF to analyze with AI. All form fields will be auto-filled based on your SLR protocol.
                                </p>

                                {/* PDF Upload Zone */}
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                                        pdfFile
                                            ? "border-green-400 bg-green-50"
                                            : "border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50"
                                    )}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    {pdfFile ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText size={20} className="text-green-600" />
                                            <span className="text-sm font-medium text-green-700">
                                                {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto h-8 w-8 text-indigo-400" />
                                            <p className="mt-2 text-sm text-indigo-600">
                                                Drag & drop PDF here or <span className="font-semibold">browse</span>
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Analyze Button */}
                                <Button
                                    type="button"
                                    onClick={handleAnalyze}
                                    disabled={!pdfFile || isAnalyzing}
                                    className="mt-4 w-full gap-2"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Analyzing with AI...
                                        </>
                                    ) : (
                                        <>
                                            <Brain size={16} />
                                            Analyze with AI
                                        </>
                                    )}
                                </Button>

                                {/* AI Error */}
                                {aiError && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-red-700">{aiError}</span>
                                    </div>
                                )}

                                {/* AI Reasoning */}
                                {aiReasoning && (
                                    <div className="mt-4 p-4 bg-white border border-indigo-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Brain size={16} className="text-indigo-600" />
                                            <span className="text-xs font-semibold text-indigo-700 uppercase">AI Reasoning</span>
                                        </div>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiReasoning}</p>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* No Protocol Warning */}
                        {!protocol && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-amber-800">
                                    <p className="font-medium">AI Analysis not available</p>
                                    <p className="text-amber-700">Set up your SLR protocol to enable AI-powered analysis.</p>
                                </div>
                            </div>
                        )}

                        {/* Section 1: Basic Metadata */}
                        <Section forceOpen={expandAllSections} title="1. Basic Metadata" defaultOpen={true}>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Title *</label>
                                <Input name="title" defaultValue={study.title} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Authors</label>
                                <Input name="authors" defaultValue={study.authors || ""} placeholder="John Doe, Jane Smith..." />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Year *</label>
                                    <Input name="year" type="number" defaultValue={study.year} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Venue</label>
                                    <Input name="venue" defaultValue={study.venue || ""} placeholder="ICSE, JSS..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Keywords</label>
                                    <Input name="keywords" defaultValue={study.keywords || ""} placeholder="LLM, PM..." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Abstract</label>
                                <Textarea name="abstract" defaultValue={study.abstract || ""} placeholder="Paper abstract..." className="min-h-[100px]" />
                            </div>
                        </Section>

                        {/* Section 2: Source Links */}
                        <Section forceOpen={expandAllSections} title="2. Source Links" defaultOpen={false}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">DOI</label>
                                    <Input name="doi" defaultValue={study.doi || ""} placeholder="10.1145/..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">URL</label>
                                    <Input name="url" defaultValue={study.url || ""} placeholder="https://..." />
                                </div>
                            </div>
                            <div className="space-y-2 mt-3">
                                <label className="text-xs font-semibold text-slate-700">PDF Link</label>
                                <Input name="pdfUrl" defaultValue={study.pdfUrl || ""} placeholder="https://arxiv.org/pdf/... (optional)" />
                            </div>
                        </Section>

                        {/* Section 3: Workflow Status */}
                        <Section forceOpen={expandAllSections} title="3. Workflow Status" defaultOpen={true}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Status</label>
                                    <Select name="status" defaultValue={study.status}>
                                        <option value="TO_READ">TO READ</option>
                                        <option value="READING">READING</option>
                                        <option value="EXTRACTED">EXTRACTED</option>
                                        <option value="INCLUDED">INCLUDED</option>
                                        <option value="EXCLUDED">EXCLUDED</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Relevance (1-5)</label>
                                    <Input name="relevanceScore" type="number" min="1" max="5" defaultValue={study.relevanceScore || ""} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Exclusion Reason <span className="text-slate-400">(required if Excluded)</span></label>
                                <Input name="exclusionReason" defaultValue={study.exclusionReason || ""} placeholder="e.g. Not an empirical study" />
                            </div>
                        </Section>

                        {/* Section 4: Classification */}
                        <Section forceOpen={expandAllSections} title="4. Classification" defaultOpen={false}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Research Type</label>
                                    <Select name="researchType" defaultValue={study.researchType || ""}>
                                        <option value="">-- Select --</option>
                                        <option value="Experiment">Experiment</option>
                                        <option value="Survey">Survey</option>
                                        <option value="Case Study">Case Study</option>
                                        <option value="Framework">Framework</option>
                                        <option value="Literature Review">Literature Review</option>
                                        <option value="Tool Development">Tool Development</option>
                                        <option value="Other">Other</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Domain / Context</label>
                                    <Input name="domain" defaultValue={study.domain || ""} placeholder="e.g. Healthcare, Finance" />
                                </div>
                            </div>
                        </Section>

                        {/* Section 5: Research Content */}
                        <Section forceOpen={expandAllSections} title="5. Research Content" defaultOpen={false}>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Problem Statement</label>
                                <Textarea name="problemStatement" defaultValue={study.problemStatement || ""} placeholder="What problem does this paper address?" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Proposed Solution</label>
                                <Textarea name="proposedSolution" defaultValue={study.proposedSolution || ""} placeholder="What solution does this paper propose?" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Key Techniques</label>
                                <Textarea name="keyTechniques" defaultValue={study.keyTechniques || ""} placeholder="e.g. Random Forest, Transformer, BERT" />
                            </div>
                        </Section>

                        {/* Section 6: Methodology */}
                        <Section forceOpen={expandAllSections} title="6. Methodology & Results" defaultOpen={false}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Data Input Used</label>
                                    <Textarea name="dataInputUsed" defaultValue={study.dataInputUsed || ""} placeholder="What data was used?" className="min-h-[60px]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Output Artifact</label>
                                    <Textarea name="outputArtifact" defaultValue={study.outputArtifact || ""} placeholder="What did the study produce?" className="min-h-[60px]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Evaluation Method</label>
                                <Input name="evaluationMethod" defaultValue={study.evaluationMethod || ""} placeholder="e.g. User study, A/B test, Benchmark" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Metrics & Results</label>
                                <Textarea name="metricsResults" defaultValue={study.metricsResults || ""} placeholder="e.g. Accuracy: 98%, F1: 0.95" />
                            </div>
                        </Section>

                        {/* Section 7: Qualitative Analysis */}
                        <Section forceOpen={expandAllSections} title="7. Qualitative Analysis" defaultOpen={false}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Strengths</label>
                                    <Textarea name="strengths" defaultValue={study.strengths || ""} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Limitations</label>
                                    <Textarea name="limitations" defaultValue={study.limitations || ""} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Research Gap Notes</label>
                                <Textarea name="gapNotes" defaultValue={study.gapNotes || ""} placeholder="What gaps does this study leave?" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Adoption for My Thesis</label>
                                <Textarea name="adoptionForThesis" defaultValue={study.adoptionForThesis || ""} placeholder="How is this relevant to your research?" />
                            </div>
                        </Section>

                        {/* Section 8: Quality Assessment (Q1-Q8) */}
                        <Section forceOpen={expandAllSections} title="8. Quality Assessment (0-16)" defaultOpen={false}>
                            <p className="text-xs text-slate-500 mb-3">Rate each criterion 0 (No), 1 (Partial), 2 (Yes)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Q1: Clear objectives?</label>
                                    <Select name="qaQ1" defaultValue={study.qaQ1?.toString() || "0"}>
                                        <option value="0">0 - No</option>
                                        <option value="1">1 - Partial</option>
                                        <option value="2">2 - Yes</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Q2: Adequate methodology?</label>
                                    <Select name="qaQ2" defaultValue={study.qaQ2?.toString() || "0"}>
                                        <option value="0">0 - No</option>
                                        <option value="1">1 - Partial</option>
                                        <option value="2">2 - Yes</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Q3: Sample appropriate?</label>
                                    <Select name="qaQ3" defaultValue={study.qaQ3?.toString() || "0"}>
                                        <option value="0">0 - No</option>
                                        <option value="1">1 - Partial</option>
                                        <option value="2">2 - Yes</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Q4: Clear data collection?</label>
                                    <Select name="qaQ4" defaultValue={study.qaQ4?.toString() || "0"}>
                                        <option value="0">0 - No</option>
                                        <option value="1">1 - Partial</option>
                                        <option value="2">2 - Yes</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Q5: Rigorous analysis?</label>
                                    <Select name="qaQ5" defaultValue={study.qaQ5?.toString() || "0"}>
                                        <option value="0">0 - No</option>
                                        <option value="1">1 - Partial</option>
                                        <option value="2">2 - Yes</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Q6: Clear findings?</label>
                                    <Select name="qaQ6" defaultValue={study.qaQ6?.toString() || "0"}>
                                        <option value="0">0 - No</option>
                                        <option value="1">1 - Partial</option>
                                        <option value="2">2 - Yes</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Q7: Threats addressed?</label>
                                    <Select name="qaQ7" defaultValue={study.qaQ7?.toString() || "0"}>
                                        <option value="0">0 - No</option>
                                        <option value="1">1 - Partial</option>
                                        <option value="2">2 - Yes</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Q8: Contribution clear?</label>
                                    <Select name="qaQ8" defaultValue={study.qaQ8?.toString() || "0"}>
                                        <option value="0">0 - No</option>
                                        <option value="1">1 - Partial</option>
                                        <option value="2">2 - Yes</option>
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-3 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
                                <span className="text-sm font-medium text-indigo-700">Current Total:</span>
                                <span className="text-lg font-bold text-indigo-900">{study.qaTotal || 0} / 16</span>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">QA Notes</label>
                                <Textarea name="qaNotes" defaultValue={study.qaNotes || ""} placeholder="Brief quality notes..." />
                            </div>
                        </Section>

                        {/* Section 9: Research Context */}
                        <Section forceOpen={expandAllSections} title="9. Research Context" defaultOpen={false}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Baseline/Comparator</label>
                                    <Select name="comparisonBaseline" defaultValue={study.comparisonBaseline || ""}>
                                        <option value="">-- Select --</option>
                                        <option value="Manual writing">Manual writing</option>
                                        <option value="Template/Checklist">Template/Checklist</option>
                                        <option value="NLP Classic">NLP Classic</option>
                                        <option value="Other ML model">Other ML model</option>
                                        <option value="No baseline">No baseline</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700">Study Context</label>
                                    <Select name="studyContext" defaultValue={study.studyContext || ""}>
                                        <option value="">-- Select --</option>
                                        <option value="Industry">Industry</option>
                                        <option value="Academic">Academic</option>
                                        <option value="Tool">Tool</option>
                                        <option value="Dataset">Dataset</option>
                                        <option value="Mixed">Mixed</option>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Ambiguity Type</label>
                                <Input name="ambiguityType" defaultValue={study.ambiguityType || ""} placeholder="lexical, syntactic, semantic, pragmatic, requirement smells..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700">Quality Framework</label>
                                <Input name="qualityFramework" defaultValue={study.qualityFramework || ""} placeholder="INVEST, verifiable, completeness, ISO 29148..." />
                            </div>
                        </Section>
                    </form>

                    {/* Footer Actions */}
                    <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                            Close
                        </Button>
                        <Button onClick={() => formRef.current?.requestSubmit()} disabled={isLoading} className="gap-2 px-8">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    )
}
