"use server"

import { prisma } from "@/lib/prisma"

/**
 * Database Viewer Server Actions
 * Provides raw SQL access to SQLite database
 */

interface TableInfo {
    name: string
    rowCount: number
}

interface ColumnInfo {
    name: string
    type: string
    notnull: boolean
    pk: boolean
}

interface TableRow {
    [key: string]: unknown
}

/**
 * Get all tables in the database with row counts
 */
export async function getTables(): Promise<TableInfo[]> {
    try {
        // Get list of tables
        const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%' ORDER BY name`
        )

        // Get row count for each table
        const tablesWithCounts: TableInfo[] = []
        for (const table of tables) {
            const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
                `SELECT COUNT(*) as count FROM "${table.name}"`
            )
            tablesWithCounts.push({
                name: table.name,
                rowCount: Number(countResult[0]?.count || 0)
            })
        }

        return tablesWithCounts
    } catch (error) {
        console.error("Failed to get tables:", error)
        return []
    }
}

/**
 * Get column schema for a table
 */
export async function getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    try {
        const columns = await prisma.$queryRawUnsafe<{
            cid: number
            name: string
            type: string
            notnull: number
            dflt_value: string | null
            pk: number
        }[]>(`PRAGMA table_info("${tableName}")`)

        return columns.map(col => ({
            name: col.name,
            type: col.type,
            notnull: col.notnull === 1,
            pk: col.pk === 1
        }))
    } catch (error) {
        console.error("Failed to get table schema:", error)
        return []
    }
}

/**
 * Get rows from a table with pagination
 */
export async function getTableRows(
    tableName: string,
    page: number = 1,
    limit: number = 50
): Promise<{ rows: TableRow[]; total: number }> {
    try {
        const offset = (page - 1) * limit

        // Get total count
        const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*) as count FROM "${tableName}"`
        )
        const total = Number(countResult[0]?.count || 0)

        // Get rows
        const rows = await prisma.$queryRawUnsafe<TableRow[]>(
            `SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${offset}`
        )

        // Convert BigInt to Number for JSON serialization
        const serializedRows = rows.map(row => {
            const newRow: TableRow = {}
            for (const [key, value] of Object.entries(row)) {
                if (typeof value === "bigint") {
                    newRow[key] = Number(value)
                } else if (value instanceof Date) {
                    newRow[key] = value.toISOString()
                } else {
                    newRow[key] = value
                }
            }
            return newRow
        })

        return { rows: serializedRows, total }
    } catch (error) {
        console.error("Failed to get table rows:", error)
        return { rows: [], total: 0 }
    }
}

/**
 * Get a single row by ID
 */
export async function getRowById(
    tableName: string,
    id: string
): Promise<TableRow | null> {
    try {
        const rows = await prisma.$queryRawUnsafe<TableRow[]>(
            `SELECT * FROM "${tableName}" WHERE id = ?`,
            id
        )

        if (rows.length === 0) return null

        // Convert values for JSON serialization
        const row = rows[0]
        const newRow: TableRow = {}
        for (const [key, value] of Object.entries(row)) {
            if (typeof value === "bigint") {
                newRow[key] = Number(value)
            } else if (value instanceof Date) {
                newRow[key] = value.toISOString()
            } else {
                newRow[key] = value
            }
        }
        return newRow
    } catch (error) {
        console.error("Failed to get row:", error)
        return null
    }
}

/**
 * Resolve project ID for a vector ID (to determine vector table name)
 */
export async function getProjectForVectorId(id: string, type: "study" | "chunk"): Promise<string | null> {
    try {
        if (type === "study") {
            const result = await prisma.$queryRawUnsafe<{ projectId: string }[]>(
                `SELECT projectId FROM SlrStudy WHERE embeddingId = '${id}' LIMIT 1`
            )
            return result[0]?.projectId || null
        } else {
            // For chunks, we need to join back to project
            // DocumentChunk -> StudyDocument -> SlrStudy -> projectId
            const result = await prisma.$queryRawUnsafe<{ projectId: string }[]>(
                `SELECT s.projectId 
                 FROM SlrStudy s 
                 JOIN StudyDocument d ON d.studyId = s.id 
                 JOIN DocumentChunk c ON c.documentId = d.id 
                 WHERE c.embeddingId = '${id}' 
                 LIMIT 1`
            )
            return result[0]?.projectId || null
        }
    } catch (error) {
        console.error("Failed to resolve project for vector:", error)
        return null
    }
}
