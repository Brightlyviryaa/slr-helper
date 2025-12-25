import { MainLayout } from "@/components/layout/MainLayout"

export default function Loading() {
    return (
        <MainLayout>
            <div className="p-8 animate-pulse space-y-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-3">
                        <div className="h-8 w-64 bg-slate-200 rounded" />
                        <div className="h-4 w-96 bg-slate-100 rounded" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-32 bg-slate-200 rounded" />
                        <div className="h-10 w-32 bg-slate-200 rounded" />
                    </div>
                </div>

                <div className="h-[600px] w-full bg-slate-50 border rounded-xl" />
            </div>
        </MainLayout>
    )
}
