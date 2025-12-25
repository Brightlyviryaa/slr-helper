"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className={cn(
                    "relative w-full max-w-lg bg-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
                    className
                )}
            >
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-xl shrink-0">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {children}
                </div>
            </div>
        </div>
    )
}
