import * as lancedb from "@lancedb/lancedb"
import * as arrow from "apache-arrow"
import path from "path"

/**
 * LanceDB Vector Database Client
 * Stores embeddings locally for vector similarity search
 */

const DB_PATH = path.join(process.cwd(), "data", "lancedb")
const TABLE_PREFIX = "studies_"

// Cache for database connection
let dbConnection: lancedb.Connection | null = null

/**
 * Get or create the LanceDB connection
 */
export async function getDb(): Promise<lancedb.Connection> {
    if (!dbConnection) {
        dbConnection = await lancedb.connect(DB_PATH)
    }
    return dbConnection
}

/**
 * Get the table name for a project
 */
function getTableName(projectId: string): string {
    return `${TABLE_PREFIX}${projectId.replace(/-/g, "_")}`
}

/**
 * Study vector record structure
 */
export interface StudyVectorRecord {
    [key: string]: unknown  // Index signature for LanceDB compatibility
    id: string              // Study ID
    projectId: string
    vector: number[]        // Embedding vector
    title: string
    paperKey: string
    status: string
    year: number
    authors: string | null
    abstract: string | null
    embeddedText: string    // Raw text that was embedded
}

/**
 * Get or create the studies table for a project
 */
export async function getStudiesTable(
    projectId: string
): Promise<lancedb.Table> {
    const db = await getDb()
    const tableName = getTableName(projectId)

    try {
        // Try to open existing table
        return await db.openTable(tableName)
    } catch {
        // Table doesn't exist, create it with schema
        const schema = new arrow.Schema([
            new arrow.Field("id", new arrow.Utf8()),
            new arrow.Field("projectId", new arrow.Utf8()),
            new arrow.Field("vector", new arrow.FixedSizeList(1024, new arrow.Field("item", new arrow.Float32()))),
            new arrow.Field("title", new arrow.Utf8()),
            new arrow.Field("paperKey", new arrow.Utf8()),
            new arrow.Field("status", new arrow.Utf8()),
            new arrow.Field("year", new arrow.Int32()),
            new arrow.Field("authors", new arrow.Utf8(), true),
            new arrow.Field("abstract", new arrow.Utf8(), true),
            new arrow.Field("embeddedText", new arrow.Utf8()),
        ])

        return await db.createEmptyTable(tableName, schema)
    }
}

/**
 * Upsert a study vector into the database
 */
export async function upsertStudyVector(
    projectId: string,
    record: StudyVectorRecord
): Promise<void> {
    const table = await getStudiesTable(projectId)

    // Delete existing record if exists
    try {
        await table.delete(`id = '${record.id}'`)
    } catch {
        // Record doesn't exist, that's fine
    }

    // Insert new record
    await table.add([record])
}

/**
 * Delete a study vector from the database
 */
export async function deleteStudyVector(
    projectId: string,
    studyId: string
): Promise<void> {
    try {
        const table = await getStudiesTable(projectId)
        await table.delete(`id = '${studyId}'`)
    } catch {
        // Table or record doesn't exist, that's fine
    }
}

/**
 * Search for similar studies using vector similarity
 */
export async function searchSimilar(
    projectId: string,
    queryVector: number[],
    limit: number = 10
): Promise<StudyVectorRecord[]> {
    try {
        const table = await getStudiesTable(projectId)

        const results = await table
            .vectorSearch(queryVector)
            .limit(limit)
            .toArray()

        return results as unknown as StudyVectorRecord[]
    } catch {
        // Table doesn't exist or is empty
        return []
    }
}

/**
 * Count records in a project's table
 */
export async function countVectors(projectId: string): Promise<number> {
    try {
        const table = await getStudiesTable(projectId)
        return await table.countRows()
    } catch {
        return 0
    }
}

// ============================================
// Document Chunk Vector Operations
// ============================================

const CHUNKS_TABLE_PREFIX = "chunks_"

/**
 * Chunk vector record structure
 */
export interface ChunkVectorRecord {
    [key: string]: unknown  // Index signature for LanceDB compatibility
    id: string              // Chunk ID
    documentId: string      // Parent document ID
    studyId: string         // Parent study ID
    projectId: string
    chunkIndex: number
    vector: number[]        // Embedding vector
    contentPreview: string  // First 200 chars of content
}

/**
 * Get the chunks table name for a project
 */
function getChunksTableName(projectId: string): string {
    return `${CHUNKS_TABLE_PREFIX}${projectId.replace(/-/g, "_")}`
}

/**
 * Get or create the chunks table for a project
 */
export async function getChunksTable(
    projectId: string
): Promise<lancedb.Table> {
    const db = await getDb()
    const tableName = getChunksTableName(projectId)

    try {
        return await db.openTable(tableName)
    } catch {
        const schema = new arrow.Schema([
            new arrow.Field("id", new arrow.Utf8()),
            new arrow.Field("documentId", new arrow.Utf8()),
            new arrow.Field("studyId", new arrow.Utf8()),
            new arrow.Field("projectId", new arrow.Utf8()),
            new arrow.Field("chunkIndex", new arrow.Int32()),
            new arrow.Field("vector", new arrow.FixedSizeList(1024, new arrow.Field("item", new arrow.Float32()))),
            new arrow.Field("contentPreview", new arrow.Utf8()),
        ])

        return await db.createEmptyTable(tableName, schema)
    }
}

/**
 * Upsert a chunk vector into the database
 */
export async function upsertChunkVector(
    projectId: string,
    record: ChunkVectorRecord
): Promise<void> {
    const table = await getChunksTable(projectId)

    try {
        await table.delete(`id = '${record.id}'`)
    } catch {
        // Record doesn't exist
    }

    await table.add([record])
}

/**
 * Delete all chunk vectors for a document
 */
export async function deleteDocumentChunkVectors(
    projectId: string,
    documentId: string
): Promise<void> {
    try {
        const table = await getChunksTable(projectId)
        await table.delete(`documentId = '${documentId}'`)
    } catch {
        // Table or records don't exist
    }
}

/**
 * Search for similar chunks using vector similarity
 */
export async function searchChunks(
    projectId: string,
    queryVector: number[],
    limit: number = 10
): Promise<ChunkVectorRecord[]> {
    try {
        const table = await getChunksTable(projectId)

        const results = await table
            .vectorSearch(queryVector)
            .limit(limit)
            .toArray()

        return results as unknown as ChunkVectorRecord[]
    } catch {
        return []
    }
}
