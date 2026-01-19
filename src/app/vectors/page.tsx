import Link from "next/link"
import { Box, ChevronRight, Layers } from "lucide-react"
import { getVectorTables, getVectorDbStats } from "@/actions/vectors"
import { MainLayout } from "@/components/layout/MainLayout"

export default async function VectorsPage() {
    const [tables, stats] = await Promise.all([
        getVectorTables(),
        getVectorDbStats()
    ])

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <Box size={28} className="text-purple-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Vector Viewer</h1>
                        <p className="text-slate-600 text-sm">
                            LanceDB: <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">{stats.dbPath}</code>
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <p className="text-sm text-slate-500 mb-1">Tables</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalTables}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <p className="text-sm text-slate-500 mb-1">Total Vectors</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalVectors.toLocaleString()}</p>
                </div>
            </div>

            {/* Table List */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Layers size={18} />
                        Vector Tables
                    </h2>
                </div>
                {tables.length === 0 ? (
                    <div className="px-6 py-8 text-center text-slate-500">
                        No vector tables found. Upload and process documents to create vectors.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {tables.map(table => (
                            <Link
                                key={table.name}
                                href={`/vectors/${encodeURIComponent(table.name)}`}
                                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Box size={18} className={
                                        table.type === "studies" ? "text-indigo-500" :
                                            table.type === "chunks" ? "text-purple-500" :
                                                "text-slate-400"
                                    } />
                                    <div>
                                        <span className="font-medium text-slate-800">{table.name}</span>
                                        <span className={`ml-2 px-2 py-0.5 text-[10px] uppercase font-bold rounded ${table.type === "studies" ? "bg-indigo-100 text-indigo-700" :
                                                table.type === "chunks" ? "bg-purple-100 text-purple-700" :
                                                    "bg-slate-100 text-slate-600"
                                            }`}>
                                            {table.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded">
                                        {table.rowCount.toLocaleString()} vectors
                                    </span>
                                    <ChevronRight size={18} className="text-slate-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    )
}
