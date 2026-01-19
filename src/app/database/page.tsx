import Link from "next/link"
import { Database, Table2, ChevronRight } from "lucide-react"
import { getTables } from "@/actions/database"
import { MainLayout } from "@/components/layout/MainLayout"

export default async function DatabasePage() {
    const tables = await getTables()
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0)

    return (
        <MainLayout>
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <Database size={28} className="text-indigo-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Database Viewer</h1>
                        <p className="text-slate-600 text-sm">
                            SQLite: <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">prisma/dev.db</code>
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <p className="text-sm text-slate-500 mb-1">Tables</p>
                    <p className="text-3xl font-bold text-slate-900">{tables.length}</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <p className="text-sm text-slate-500 mb-1">Total Rows</p>
                    <p className="text-3xl font-bold text-slate-900">{totalRows.toLocaleString()}</p>
                </div>
            </div>

            {/* Table List */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Table2 size={18} />
                        Tables
                    </h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {tables.map(table => (
                        <Link
                            key={table.name}
                            href={`/database/${table.name}`}
                            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Table2 size={18} className="text-slate-400" />
                                <span className="font-medium text-slate-800">{table.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded">
                                    {table.rowCount.toLocaleString()} rows
                                </span>
                                <ChevronRight size={18} className="text-slate-400" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </MainLayout>
    )
}
