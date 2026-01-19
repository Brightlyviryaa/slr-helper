import Link from "next/link"
import { notFound } from "next/navigation"
import { Database, ChevronLeft, ChevronRight, Table2, Key, Hash } from "lucide-react"
import { getTableSchema, getTableRows } from "@/actions/database"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/MainLayout"

interface TablePageProps {
    params: Promise<{ table: string }>
    searchParams: Promise<{ page?: string }>
}

export default async function TablePage({ params, searchParams }: TablePageProps) {
    const { table } = await params
    const { page: pageParam } = await searchParams
    const page = parseInt(pageParam || "1", 10)
    const limit = 50

    const [schema, { rows, total }] = await Promise.all([
        getTableSchema(table),
        getTableRows(table, page, limit)
    ])

    if (schema.length === 0) {
        notFound()
    }

    const totalPages = Math.ceil(total / limit)
    const startRow = (page - 1) * limit + 1
    const endRow = Math.min(page * limit, total)

    return (
        <MainLayout>
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                    <Link href="/database">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ChevronLeft size={16} />
                            Back to Tables
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <Table2 size={28} className="text-indigo-600" />
                    <h1 className="text-2xl font-bold text-slate-900">{table}</h1>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">
                        {total.toLocaleString()} rows
                    </span>
                </div>
            </div>

            {/* Schema */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                <h2 className="font-semibold text-slate-800 mb-3">Schema</h2>
                <div className="flex flex-wrap gap-2">
                    {schema.map(col => (
                        <div
                            key={col.name}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${col.pk ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                                }`}
                        >
                            {col.pk && <Key size={10} />}
                            <span className="font-medium">{col.name}</span>
                            <span className="text-slate-400">({col.type || "TEXT"})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    #
                                </th>
                                {schema.map(col => (
                                    <th
                                        key={col.name}
                                        className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                                    >
                                        {col.pk && <Key size={10} className="inline mr-1 text-amber-500" />}
                                        {col.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 text-slate-400 text-xs">
                                        {startRow + idx}
                                    </td>
                                    {schema.map(col => {
                                        const value = row[col.name]
                                        const isEmbeddingId = col.name === "embeddingId" && typeof value === "string"
                                        const tableNameLower = table.toLowerCase()
                                        // Check if table is likely SlrStudy or DocumentChunk (handling potential case variations)
                                        const isStudyTable = tableNameLower.includes("study") && !tableNameLower.includes("studydocument")
                                        const isChunkTable = tableNameLower.includes("chunk")

                                        return (
                                            <td
                                                key={col.name}
                                                className="px-3 py-2 text-slate-700 max-w-xs truncate"
                                                title={String(value ?? "")}
                                            >
                                                {isEmbeddingId && value ? (
                                                    <Link
                                                        href={`/vectors/resolve?id=${value}&type=${isChunkTable ? "chunk" : "study"}`}
                                                        className="text-indigo-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <Hash size={12} />
                                                        {formatCellValue(value)}
                                                    </Link>
                                                ) : (
                                                    formatCellValue(value)
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        Showing <strong>{startRow}</strong> to <strong>{endRow}</strong> of{" "}
                        <strong>{total.toLocaleString()}</strong> rows
                    </p>
                    <div className="flex items-center gap-2">
                        {page > 1 && (
                            <Link href={`/database/${table}?page=${page - 1}`}>
                                <Button variant="outline" size="sm" className="gap-1">
                                    <ChevronLeft size={14} />
                                    Prev
                                </Button>
                            </Link>
                        )}
                        <span className="px-3 py-1 bg-white border border-slate-200 rounded text-sm">
                            Page {page} / {totalPages}
                        </span>
                        {page < totalPages && (
                            <Link href={`/database/${table}?page=${page + 1}`}>
                                <Button variant="outline" size="sm" className="gap-1">
                                    Next
                                    <ChevronRight size={14} />
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

function formatCellValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "—"
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false"
    }
    if (typeof value === "object") {
        return JSON.stringify(value)
    }
    const str = String(value)
    if (str.length > 100) {
        return str.substring(0, 100) + "..."
    }
    return str
}
