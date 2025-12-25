"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"

interface InlineListEditorProps {
    label: string
    items: any[]
    onChange: (items: any[]) => void
    fields: { name: string; label: string; placeholder?: string }[]
    addButtonLabel?: string
}

export function InlineListEditor({
    label,
    items,
    onChange,
    fields,
    addButtonLabel = "Add Item"
}: InlineListEditorProps) {
    const handleAddItem = () => {
        const newItem = fields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), {})
        onChange([...items, newItem])
    }

    const handleUpdateItem = (index: number, field: string, value: string) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        onChange(newItems)
    }

    const handleRemoveItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="h-8 gap-1"
                >
                    <Plus className="h-3.5 w-3.5" />
                    {addButtonLabel}
                </Button>
            </div>

            <div className="space-y-2">
                {items.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No items added yet.</p>
                ) : (
                    items.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-200">
                            {fields.map((field) => (
                                <div key={field.name} className="flex-1">
                                    <Input
                                        placeholder={field.placeholder || field.label}
                                        value={item[field.name]}
                                        onChange={(e) => handleUpdateItem(index, field.name, e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                                className="h-9 w-9 text-slate-400 hover:text-red-600 shrink-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
