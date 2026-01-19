
import { redirect, notFound } from "next/navigation"
import { getProjectForVectorId } from "@/actions/database"

interface ResolvePageProps {
    searchParams: Promise<{ id: string; type: string }>
}

export default async function ResolveVectorPage({ searchParams }: ResolvePageProps) {
    const { id, type } = await searchParams

    if (!id || !type) {
        notFound()
    }

    const projectId = await getProjectForVectorId(id, type as "study" | "chunk")

    if (!projectId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center">
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Vector Not Found</h1>
                    <p className="text-slate-600 mb-4">
                        Could not find project for vector ID: <code className="bg-slate-100 px-1 rounded">{id}</code>
                    </p>
                    <p className="text-sm text-slate-500">
                        The vector might have been deleted or not yet indexed.
                    </p>
                </div>
            </div>
        )
    }

    // Determine table name
    const tableName = type === "study" ? `studies_${projectId.replace(/-/g, "_")}` : `chunks_${projectId.replace(/-/g, "_")}`

    redirect(`/vectors/${encodeURIComponent(tableName)}/${id}`)
}
