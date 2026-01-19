"use server"

import { getDb } from "@/lib/lancedb"
import path from "path"
import fs from "fs/promises"

/**
 * Vector Database Viewer Server Actions
 * Provides raw access to LanceDB vector database
 */

interface VectorTableInfo {
    name: string
    rowCount: number
    type: "studies" | "chunks" | "unknown"
}

interface VectorRecord {
    [key: string]: unknown
}

/**
 * Get all LanceDB tables with row counts
 */
export async function getVectorTables(): Promise<VectorTableInfo[]> {
    try {
        const db = await getDb()
        const tableNames = await db.tableNames()

        const tables: VectorTableInfo[] = []
        for (const name of tableNames) {
            try {
                const table = await db.openTable(name)
                const count = await table.countRows()

                let type: "studies" | "chunks" | "unknown" = "unknown"
                if (name.startsWith("studies_")) type = "studies"
                else if (name.startsWith("chunks_")) type = "chunks"

                tables.push({
                    name,
                    rowCount: count,
                    type
                })
            } catch {
                tables.push({ name, rowCount: 0, type: "unknown" })
            }
        }

        return tables.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
        console.error("Failed to get vector tables:", error)
        return []
    }
}

/**
 * Get rows from a vector table with pagination
 */
export async function getVectorTableRows(
    tableName: string,
    page: number = 1,
    limit: number = 20
): Promise<{ rows: VectorRecord[]; total: number; columns: string[] }> {
    try {
        const db = await getDb()
        const table = await db.openTable(tableName)

        const total = await table.countRows()
        const offset = (page - 1) * limit

        // Query rows
        const results = await table.query()
            .limit(limit)
            .offset(offset)
            .toArray()

        // Get column names from first row
        const columns = results.length > 0 ? Object.keys(results[0]) : []

        // Process rows - truncate vectors for display
        const rows = results.map(row => {
            const processed: VectorRecord = {}
            for (const [key, value] of Object.entries(row)) {
                if (key === "vector" && Array.isArray(value)) {
                    // Show vector preview
                    processed[key] = `[${value.slice(0, 4).map(v => v.toFixed(4)).join(", ")}, ... +${value.length - 4} more]`
                    processed["_vectorLength"] = value.length
                } else if (typeof value === "bigint") {
                    processed[key] = Number(value)
                } else {
                    processed[key] = value
                }
            }
            return processed
        })

        return { rows, total, columns }
    } catch (error) {
        console.error("Failed to get vector table rows:", error)
        return { rows: [], total: 0, columns: [] }
    }
}

/**
 * Get a single vector record by ID
 */
export async function getVectorById(
    tableName: string,
    id: string
): Promise<VectorRecord | null> {
    try {
        const db = await getDb()
        const table = await db.openTable(tableName)

        const results = await table.query()
            .where(`id = '${id}'`)
            .limit(1)
            .toArray()

        if (results.length === 0) return null

        const row = results[0]
        const processed: VectorRecord = {}

        for (const [key, value] of Object.entries(row)) {
            if (typeof value === "bigint") {
                processed[key] = Number(value)
            } else {
                processed[key] = value
            }
        }

        return processed
    } catch (error) {
        console.error("Failed to get vector by ID:", error)
        return null
    }
}

/**
 * Get database stats
 */
export async function getVectorDbStats(): Promise<{
    totalTables: number
    totalVectors: number
    dbPath: string
}> {
    try {
        const db = await getDb()
        const tableNames = await db.tableNames()

        let totalVectors = 0
        for (const name of tableNames) {
            try {
                const table = await db.openTable(name)
                totalVectors += await table.countRows()
            } catch {
                // Ignore errors
            }
        }

        const dbPath = path.join(process.cwd(), "data", "lancedb")

        return {
            totalTables: tableNames.length,
            totalVectors,
            dbPath
        }
    } catch (error) {
        console.error("Failed to get vector db stats:", error)
        return { totalTables: 0, totalVectors: 0, dbPath: "" }
    }
}
