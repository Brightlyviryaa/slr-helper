"use client"

import Link from "next/link"
import { LayoutDashboard, Settings, Menu, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button" // Keeping it clean for now

export function Sidebar() {
    return (
        <aside className="group fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-14 overflow-hidden border-r bg-white transition-all duration-300 hover:w-64">
            <div className="flex flex-col h-full py-4">
                <nav className="flex-1 space-y-1 px-2">
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-md p-2 text-slate-900 hover:bg-slate-100 font-medium"
                    >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                            <LayoutDashboard size={20} />
                        </div>
                        <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap">
                            Dashboard
                        </span>
                    </Link>

                    {/* Placeholder for future links */}
                    <button
                        disabled
                        className="flex w-full items-center gap-3 rounded-md p-2 text-slate-600 hover:bg-slate-50 cursor-not-allowed"
                    >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                            <Settings size={20} />
                        </div>
                        <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap">
                            Settings
                        </span>
                    </button>
                </nav>
            </div>
        </aside>
    )
}
