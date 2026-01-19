import Link from "next/link"
import { notFound } from "next/navigation"
import { Box, ChevronLeft, ChevronRight } from "lucide-react"
import { getVectorTableRows } from "@/actions/vectors"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/MainLayout"
import type { ReactNode } from "react"

interface VectorTablePageProps {
    params: Promise<{ table: string }>
    searchParams: Promise<{ page?: string }>
}

export default async function VectorTablePage({ params, searchParams }: VectorTablePageProps) {
    const { table } = await params
    const tableName = decodeURIComponent(table)
    const { page: pageParam } = await searchParams
    const page = parseInt(pageParam || "1", 10)
    const limit = 20

    const { rows, total, columns } = await getVectorTableRows(tableName, page, limit)

    if (columns.length === 0 && total === 0) {
        notFound()
    }

    const totalPages = Math.ceil(total / limit)
    const startRow = (page - 1) * limit + 1
    const endRow = Math.min(page * limit, total)

    // Filter out internal columns and reorder
    const displayColumns = columns.filter(col => !col.startsWith("_"))

    return (
        <MainLayout>
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                    <Link href="/vectors">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ChevronLeft size={16} />
                            Back to Tables
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <Box size={28} className="text-purple-600" />
                    <h1 className="text-2xl font-bold text-slate-900">{tableName}</h1>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">
                        {total.toLocaleString()} vectors
                    </span>
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
                                {displayColumns.map(col => (
                                    <th
                                        key={col}
                                        className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                                    >
                                        {col}
                                    </th>
                                ))}
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 text-slate-400 text-xs">
                                        {startRow + idx}
                                    </td>
                                    {displayColumns.map(col => (
                                        <td
                                            key={col}
                                            className={`px-3 py-2 max-w-xs truncate ${col === "vector"
                                                ? "font-mono text-xs text-purple-600"
                                                : "text-slate-700"
                                                }`}
                                            title={String(row[col] ?? "")}
                                        >
                                            {formatCellValue(row[col])}
                                        </td>
                                    ))}
                                    <td className="px-3 py-2">
                                        {typeof row.id === "string" && row.id && (
                                            <Link
                                                href={`/vectors/${encodeURIComponent(tableName)}/${row.id}`}
                                                className="text-xs text-indigo-600 hover:underline"
                                            >
                                                View
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        Showing <strong>{startRow}</strong> to <strong>{endRow}</strong> of{" "}
                        <strong>{total.toLocaleString()}</strong> vectors
                    </p>
                    <div className="flex items-center gap-2">
                        {page > 1 && (
                            <Link href={`/vectors/${encodeURIComponent(tableName)}?page=${page - 1}`}>
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
                            <Link href={`/vectors/${encodeURIComponent(tableName)}?page=${page + 1}`}>
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

function formatCellValue(value: unknown): ReactNode {
    if (value === null || value === undefined) {
        return "—"
    }
    if (typeof value === "boolean") {
        return value ? "true" : "false"
    }
    const str = String(value)
    if (str.length > 80) {
        return str.substring(0, 80) + "..."
    }
    return str
}
