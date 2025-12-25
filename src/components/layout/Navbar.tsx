import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Navbar() {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white">
            <div className="flex h-14 items-center px-4">
                <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-slate-900">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                    <span>SLR Helper</span>
                </Link>
            </div>
        </header>
    )
}
