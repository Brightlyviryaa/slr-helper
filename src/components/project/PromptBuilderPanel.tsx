"use client"

import * as React from "react"
import { Bot, Copy, Check, ChevronDown, ChevronRight, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateAnalysisPrompt } from "@/actions/prompt"
import { cn } from "@/lib/utils"

interface PromptBuilderPanelProps {
    projectId: string
    protocol: any
}

export function PromptBuilderPanel({ projectId, protocol }: PromptBuilderPanelProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [prompt, setPrompt] = React.useState<string | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [copied, setCopied] = React.useState(false)

    const handleGenerate = async () => {
        setIsLoading(true)
        setError(null)

        const result = await generateAnalysisPrompt(projectId)

        setIsLoading(false)
        if (result.success && result.prompt) {
            setPrompt(result.prompt)
        } else {
            setError(result.error || "Failed to generate prompt")
        }
    }

    const handleCopy = async () => {
        if (!prompt) return

        try {
            await navigator.clipboard.writeText(prompt)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    return (
        <div className="mt-6 border border-slate-200 rounded-lg bg-white shadow-sm">
            {/* Header */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-t-lg"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Bot size={20} className="text-indigo-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-slate-900">AI Prompt Builder</h3>
                        <p className="text-xs text-slate-500">Generate prompts for external AI analysis</p>
                    </div>
                </div>
                {isOpen ? (
                    <ChevronDown size={20} className="text-slate-400" />
                ) : (
                    <ChevronRight size={20} className="text-slate-400" />
                )}
            </button>

            {/* Content */}
            {isOpen && (
                <div className="p-4 border-t border-slate-100 space-y-4">
                    {/* Description */}
                    <p className="text-sm text-slate-600">
                        Generate a comprehensive prompt for external AI tools (ChatGPT, Claude, Gemini)
                        to analyze research papers based on your SLR protocol. The prompt includes
                        your review question, PICO framework, and instructions for extracting all 9 data sections.
                    </p>

                    {/* No Protocol Warning */}
                    {!protocol && (
                        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">Protocol not set up</p>
                                <p className="text-amber-700">
                                    Please set up your SLR protocol first to generate a contextual prompt.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading || !protocol}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Sparkles size={16} />
                        )}
                        {isLoading ? "Generating..." : "Generate Prompt"}
                    </Button>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Prompt Preview */}
                    {prompt && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Generated Prompt
                                </label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopy}
                                    className="gap-2 text-xs h-8"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={14} className="text-green-600" />
                                            <span className="text-green-600">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            Copy to Clipboard
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={prompt}
                                    className={cn(
                                        "w-full h-64 p-4 text-sm font-mono",
                                        "bg-slate-50 border border-slate-200 rounded-lg",
                                        "resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                        "text-slate-700"
                                    )}
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                💡 Copy this prompt and paste it into ChatGPT, Claude, or Gemini.
                                Then share the paper (PDF or text) for analysis.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
