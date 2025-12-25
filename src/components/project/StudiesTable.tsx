"use client"

import * as React from "react"
import { Search, Filter, BoxSelect } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { StudyRow } from "./StudyRow"

interface StudiesTableProps {
    projectId: string
    studies: any[]
    onEdit: (study: any) => void
    onDelete: (id: string) => void
}

export function StudiesTable({ projectId, studies, onEdit, onDelete }: StudiesTableProps) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("ALL")

    const filteredStudies = studies.filter(s => {
        const matchesSearch = searchTerm === "" ||
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.paperKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.authors && s.authors.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === "ALL" || s.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-20 w-full animate-in fade-in duration-500">
            <BoxSelect size={40} className="text-slate-200 mb-2" />
            <p className="text-slate-700 font-medium text-sm">No studies found matching your criteria.</p>
            <p className="text-[10px] text-slate-500 mt-1">Try adjusting your filters or search term.</p>
        </div>
    )

    return (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            {/* Table Toolbar */}
            <div className="p-4 border-b flex flex-col sm:flex-row gap-4 bg-slate-50/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search studies by title, key, or authors..."
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-700 px-2 font-medium">
                        <Filter size={14} />
                        <span>Filter</span>
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-40 bg-white"
                    >
                        <option value="ALL">All Status</option>
                        <option value="TO_READ">TO READ</option>
                        <option value="READING">READING</option>
                        <option value="EXTRACTED">EXTRACTED</option>
                        <option value="INCLUDED">INCLUDED</option>
                        <option value="EXCLUDED">EXCLUDED</option>
                    </Select>
                </div>
            </div>

            {/* Table Content (Desktop) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                            <th className="px-4 py-3 font-bold w-20">Key</th>
                            <th className="px-4 py-3 font-bold">Title & Authors</th>
                            <th className="px-4 py-3 font-bold w-24">Year</th>
                            <th className="px-4 py-3 font-bold w-40">Status</th>
                            <th className="px-4 py-3 font-bold">Venue</th>
                            <th className="px-4 py-3 font-bold w-32">Updated</th>
                            <th className="px-4 py-3 font-bold text-right w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudies.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <EmptyState />
                                </td>
                            </tr>
                        ) : (
                            filteredStudies.map((study) => (
                                <StudyRow
                                    key={study.id}
                                    study={study}
                                    projectId={projectId}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Card Content (Mobile) */}
            <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {filteredStudies.length === 0 ? (
                    <EmptyState />
                ) : (
                    filteredStudies.map((study) => (
                        <div
                            key={study.id}
                            className="bg-white border rounded-lg p-4 shadow-sm active:bg-slate-50 transition-colors"
                            onClick={() => onEdit(study)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {study.paperKey}
                                </span>
                                <StatusBadge status={study.status} />
                            </div>
                            <h4 className="font-semibold text-slate-900 line-clamp-2 text-sm mb-1 leading-tight">{study.title}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mb-3">{(study.authors || "Unknown Authors")}</p>

                            <div className="flex justify-between items-center pt-3 border-t text-[10px]">
                                <div className="text-slate-500 font-medium">
                                    {study.year} • {study.venue || "No Venue"}
                                </div>
                                <div className="flex gap-4" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => onEdit(study)} className="text-indigo-600 font-bold">Edit</button>
                                    <button onClick={() => onDelete(study.id)} className="text-red-600 font-bold">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Table Footer */}
            <div className="p-3 border-t bg-slate-50/50 flex justify-between items-center text-xs text-slate-600">
                <div>Showing <span className="font-semibold text-slate-700">{filteredStudies.length}</span> of {studies.length} studies</div>
                {filteredStudies.length < studies.length && (
                    <button
                        onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                        Clear all filters
                    </button>
                )}
            </div>
        </div>
    )
}
