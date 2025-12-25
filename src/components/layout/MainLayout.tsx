import type { ReactNode } from "react"
import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"

export function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 pl-14 transition-all duration-300">
                    <div className="container mx-auto max-w-7xl p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
