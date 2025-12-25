"use client"

import * as React from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { createStudy } from "@/actions/study"
import { extractPaperMetadata, type StudyMetadata } from "@/actions/ai"
import { Loader2, BookOpen, Sparkles, PenLine, Link2, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StudyFormDialogProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
}

export function StudyFormDialog({ isOpen, onClose, projectId }: StudyFormDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [isExtracting, setIsExtracting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [mode, setMode] = React.useState<"manual" | "ai">("manual")
    const [doiUrl, setDoiUrl] = React.useState("")
    const [extractedData, setExtractedData] = React.useState<StudyMetadata | null>(null)
    const [selectedStatus, setSelectedStatus] = React.useState("TO_READ")

    // Reset state when dialog closes
    React.useEffect(() => {
        if (!isOpen) {
            setMode("manual")
            setDoiUrl("")
            setExtractedData(null)
            setError(null)
            setSelectedStatus("TO_READ")
        }
    }, [isOpen])

    async function handleExtract() {
        if (!doiUrl.trim()) {
            setError("Please enter a DOI or URL")
            return
        }

        setIsExtracting(true)
        setError(null)

        const result = await extractPaperMetadata(doiUrl)

        setIsExtracting(false)
        if (result.success && result.data) {
            setExtractedData(result.data)
        } else {
            setError(result.error || "Failed to extract metadata")
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const result = await createStudy(projectId, formData)

        setIsLoading(false)
        if (result.success) {
            onClose()
        } else {
            setError(result.error || "Failed to add study")
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Study">
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                        {error}
                    </div>
                )}

                {/* Mode Toggle */}
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => { setMode("manual"); setExtractedData(null); }}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all",
                            mode === "manual"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <PenLine size={14} />
                        Manual
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("ai")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all",
                            mode === "ai"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <Sparkles size={14} />
                        AI Extract
                    </button>
                </div>

                {/* AI Mode: Extract Section */}
                {mode === "ai" && !extractedData && (
                    <div className="space-y-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                        <div className="flex items-center gap-2 text-sm text-indigo-700 font-medium">
                            <Sparkles size={14} />
                            <span>Extract metadata from DOI/URL automatically</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="https://doi.org/10.1145/..."
                                    value={doiUrl}
                                    onChange={(e) => setDoiUrl(e.target.value)}
                                    className="pl-9 text-sm"
                                    disabled={isExtracting}
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleExtract}
                                disabled={isExtracting || !doiUrl.trim()}
                                size="sm"
                            >
                                {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extract"}
                            </Button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                            AI will extract: Title, Authors, Year, Venue, Abstract, DOI, URL, Keywords
                        </p>

                        {/* Initial Status - Always visible in AI mode */}
                        <div className="pt-3 border-t border-indigo-100">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-indigo-700">Initial Status</label>
                                <Select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="text-sm bg-white"
                                >
                                    <option value="TO_READ">TO READ</option>
                                    <option value="READING">READING</option>
                                    <option value="EXTRACTED">EXTRACTED</option>
                                    <option value="INCLUDED">INCLUDED</option>
                                    <option value="EXCLUDED">EXCLUDED</option>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success: Data Extracted */}
                {mode === "ai" && extractedData && (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-md">
                        <CheckCircle size={14} />
                        <span>Metadata extracted! Review and submit below.</span>
                    </div>
                )}

                {/* Form */}
                {(mode === "manual" || extractedData) && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded">
                            <BookOpen size={12} />
                            <span>Paper Key dibuat otomatis (P001, P002, dst.)</span>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Basic Information</h3>

                            <div className="space-y-1.5">
                                <label htmlFor="title" className="text-xs font-medium text-slate-700">Title *</label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Research paper title..."
                                    defaultValue={extractedData?.title || ""}
                                    required
                                    autoFocus={mode === "manual"}
                                    className="text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label htmlFor="year" className="text-xs font-medium text-slate-700">Year *</label>
                                    <Input
                                        id="year"
                                        name="year"
                                        type="number"
                                        placeholder="2024"
                                        defaultValue={extractedData?.year || new Date().getFullYear()}
                                        required
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="venue" className="text-xs font-medium text-slate-700">Venue</label>
                                    <Input
                                        id="venue"
                                        name="venue"
                                        placeholder="ICSE, JSS..."
                                        defaultValue={extractedData?.venue || ""}
                                        className="text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="authors" className="text-xs font-medium text-slate-700">Authors</label>
                                <Input
                                    id="authors"
                                    name="authors"
                                    placeholder="John Doe, Jane Smith..."
                                    defaultValue={extractedData?.authors || ""}
                                    className="text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="keywords" className="text-xs font-medium text-slate-700">Keywords</label>
                                <Input
                                    id="keywords"
                                    name="keywords"
                                    placeholder="LLM, Software Engineering..."
                                    defaultValue={extractedData?.keywords || ""}
                                    className="text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="abstract" className="text-xs font-medium text-slate-700">Abstract</label>
                                <Textarea
                                    id="abstract"
                                    name="abstract"
                                    placeholder="Paper abstract..."
                                    defaultValue={extractedData?.abstract || ""}
                                    className="text-sm min-h-[80px]"
                                />
                            </div>
                        </div>

                        {/* Source Links */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Source Links</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label htmlFor="doi" className="text-xs font-medium text-slate-700">DOI</label>
                                    <Input
                                        id="doi"
                                        name="doi"
                                        placeholder="10.1145/..."
                                        defaultValue={extractedData?.doi || ""}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="url" className="text-xs font-medium text-slate-700">URL</label>
                                    <Input
                                        id="url"
                                        name="url"
                                        placeholder="https://..."
                                        defaultValue={extractedData?.url || doiUrl || ""}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Initial Status</h3>
                            <div className="space-y-1.5">
                                <label htmlFor="status" className="text-xs font-medium text-slate-700">Status</label>
                                <Select
                                    id="status"
                                    name="status"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="text-sm"
                                >
                                    <option value="TO_READ">TO READ</option>
                                    <option value="READING">READING</option>
                                    <option value="EXTRACTED">EXTRACTED</option>
                                    <option value="INCLUDED">INCLUDED</option>
                                    <option value="EXCLUDED">EXCLUDED</option>
                                </Select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Study
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    )
}
