import Link from "next/link"
import { notFound } from "next/navigation"
import { Box, ChevronLeft, Hash, Layers } from "lucide-react"
import { getVectorById } from "@/actions/vectors"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/MainLayout"
import type { ReactNode } from "react"

interface VectorDetailPageProps {
    params: Promise<{ table: string; id: string }>
}

export default async function VectorDetailPage({ params }: VectorDetailPageProps) {
    const { table, id } = await params
    const tableName = decodeURIComponent(table)

    const vector = await getVectorById(tableName, id)

    if (!vector) {
        notFound()
    }

    // Separate vector from other fields and convert to regular array
    const rawVector = vector.vector
    const vectorData: number[] | undefined = rawVector
        ? Array.from(rawVector as ArrayLike<number>)
        : undefined
    const metadata: [string, unknown][] = Object.entries(vector).filter(([key]) => key !== "vector")

    // Cast unknown values for type safety in JSX
    const embeddedText = typeof vector.embeddedText === "string" ? vector.embeddedText : undefined
    const contentPreview = typeof vector.contentPreview === "string" ? vector.contentPreview : undefined
    const rawTextContent = embeddedText || contentPreview

    return (
        <MainLayout>
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                    <Link href={`/vectors/${encodeURIComponent(tableName)}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ChevronLeft size={16} />
                            Back to Table
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <Box size={28} className="text-purple-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Vector Detail</h1>
                </div>
            </div>

            <div className="space-y-6">
                {/* ID */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase mb-2">ID</h2>
                    <p className="font-mono text-lg text-slate-900">{id}</p>
                </div>

                {/* Metadata */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Layers size={18} />
                            Metadata
                        </h2>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {metadata.filter(([key]) => key !== "embeddedText" && key !== "contentPreview").map(([key, value]) => (
                                <div key={key} className="space-y-1">
                                    <dt className="text-xs font-semibold text-slate-500 uppercase">{key}</dt>
                                    <dd className="text-slate-800 break-words whitespace-pre-wrap">
                                        {formatValue(value) as ReactNode}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                {/* Raw Text - embeddedText or contentPreview */}
                {rawTextContent && (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
                            <h2 className="font-semibold text-amber-900 flex items-center gap-2">
                                📝 Raw Text (Before Embedding)
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono">
                                    {rawTextContent}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vector */}
                {vectorData && (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                                <Hash size={18} />
                                Vector ({vectorData.length} dimensions)
                            </h2>
                        </div>
                        <div className="p-6">
                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="bg-slate-50 rounded p-3">
                                    <p className="text-xs text-slate-500">Min</p>
                                    <p className="font-mono text-sm">{Math.min(...vectorData).toFixed(6)}</p>
                                </div>
                                <div className="bg-slate-50 rounded p-3">
                                    <p className="text-xs text-slate-500">Max</p>
                                    <p className="font-mono text-sm">{Math.max(...vectorData).toFixed(6)}</p>
                                </div>
                                <div className="bg-slate-50 rounded p-3">
                                    <p className="text-xs text-slate-500">Mean</p>
                                    <p className="font-mono text-sm">
                                        {(vectorData.reduce((a, b) => a + b, 0) / vectorData.length).toFixed(6)}
                                    </p>
                                </div>
                                <div className="bg-slate-50 rounded p-3">
                                    <p className="text-xs text-slate-500">L2 Norm</p>
                                    <p className="font-mono text-sm">
                                        {Math.sqrt(vectorData.reduce((a, b) => a + b * b, 0)).toFixed(6)}
                                    </p>
                                </div>
                            </div>

                            {/* Full Vector */}
                            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto max-h-64">
                                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
                                    [{vectorData.map(v => v.toFixed(6)).join(", ")}]
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}

function formatValue(value: unknown): ReactNode {
    if (value === null || value === undefined) {
        return "—"
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false"
    }
    if (typeof value === "object") {
        return JSON.stringify(value, null, 2)
    }
    return String(value)
}
