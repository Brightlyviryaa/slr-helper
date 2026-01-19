"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { saveUploadedPdf, deleteDocumentFile } from "@/lib/document-storage"
import { chunkText } from "@/lib/chunking"
import { embedTexts } from "@/lib/voyage"
import { upsertChunkVector, deleteDocumentChunkVectors, type ChunkVectorRecord } from "@/lib/lancedb"

/**
 * Document Management Server Actions
 */

/**
 * Sanitize text by removing invalid Unicode surrogates
 * These can appear in PDFs from OCR or copy-paste issues
 */
function sanitizeText(text: string): string {
    // Remove lone surrogates (unpaired high/low surrogates)
    // eslint-disable-next-line no-control-regex
    return text.replace(/[\uD800-\uDFFF]/g, "")
}

/**
 * Upload and save a PDF document for a study
 * Also triggers chunking and embedding
 * @param fileBase64 - Base64 encoded file content (since Server Actions can't receive Buffer)
 */
export async function uploadStudyDocument(
    studyId: string,
    projectId: string,
    fileBase64: string,
    fileName: string,
    mimeType: string = "application/pdf"
) {
    try {
        // Save the file (base64 conversion happens in saveUploadedPdf)
        const { filePath, fileName: savedName, fileSize } = await saveUploadedPdf(
            projectId,
            fileBase64,
            fileName
        )

        // Create document record
        const document = await prisma.studyDocument.create({
            data: {
                studyId,
                fileName: savedName,
                filePath,
                fileSize,
                mimeType,
            }
        })

        revalidatePath(`/projects/${projectId}`)

        return {
            success: true,
            document: {
                id: document.id,
                fileName: document.fileName,
                filePath: document.filePath,
            }
        }
    } catch (error: any) {
        console.error("Failed to upload document:", error)
        return { success: false, error: error.message || "Failed to upload document" }
    }
}

/**
 * Process a document: extract text, chunk, and embed
 */
export async function processDocumentChunks(documentId: string, projectId: string) {
    console.log(`[processDocumentChunks] Starting for document ${documentId}`)

    try {
        // Get document with study info
        const document = await prisma.studyDocument.findUnique({
            where: { id: documentId },
            include: { study: true }
        })

        if (!document) {
            console.log(`[processDocumentChunks] Document ${documentId} not found`)
            return { success: false, error: "Document not found" }
        }
        console.log(`[processDocumentChunks] Found document: ${document.fileName}`)

        // Get file content - construct absolute path
        const fs = await import("fs/promises")
        const path = await import("path")
        const filePath = path.join(process.cwd(), "public", document.filePath)
        console.log(`[processDocumentChunks] Reading file: ${filePath}`)

        const fileBuffer = await fs.readFile(filePath)
        console.log(`[processDocumentChunks] File read, size: ${fileBuffer.length} bytes`)

        // Extract text from PDF using unpdf
        const { extractText } = await import("unpdf")
        const pdfUint8Array = new Uint8Array(fileBuffer)
        const { text, totalPages } = await extractText(pdfUint8Array, { mergePages: true })
        console.log(`[processDocumentChunks] Extracted text: ${text?.length || 0} chars, ${totalPages} pages`)

        if (!text || text.trim().length === 0) {
            console.log(`[processDocumentChunks] No text extracted from PDF`)
            return { success: false, error: "Could not extract text from PDF" }
        }

        // Update page count
        await prisma.studyDocument.update({
            where: { id: documentId },
            data: { pageCount: totalPages }
        })

        // Chunk the text
        const chunks = chunkText(text)
        console.log(`[processDocumentChunks] Generated ${chunks.length} chunks`)

        if (chunks.length === 0) {
            return { success: false, error: "No chunks generated from document" }
        }

        // Create chunk records in database
        console.log(`[processDocumentChunks] Creating chunk records in DB...`)
        const chunkRecords = await Promise.all(
            chunks.map(chunk =>
                prisma.documentChunk.create({
                    data: {
                        documentId,
                        chunkIndex: chunk.index,
                        content: sanitizeText(chunk.content),
                        tokenCount: chunk.tokenCount,
                    }
                })
            )
        )
        console.log(`[processDocumentChunks] Created ${chunkRecords.length} chunk records`)

        // Embed chunks in batches (max 128 per batch for Voyage)
        const batchSize = 50
        let embeddedCount = 0

        for (let i = 0; i < chunkRecords.length; i += batchSize) {
            const batch = chunkRecords.slice(i, i + batchSize)
            const texts = batch.map(c => c.content)
            console.log(`[processDocumentChunks] Embedding batch ${Math.floor(i / batchSize) + 1}, ${batch.length} chunks`)

            try {
                const vectors = await embedTexts(texts, "document")
                console.log(`[processDocumentChunks] Got ${vectors.length} embeddings`)

                // Store vectors and update chunk records
                for (let j = 0; j < batch.length; j++) {
                    const chunk = batch[j]
                    const vector = vectors[j]

                    // Store in LanceDB
                    const record: ChunkVectorRecord = {
                        id: chunk.id,
                        documentId: document.id,
                        studyId: document.studyId,
                        projectId,
                        chunkIndex: chunk.chunkIndex,
                        vector,
                        contentPreview: chunk.content.substring(0, 200),
                    }

                    await upsertChunkVector(projectId, record)

                    // Update SQLite record
                    await prisma.documentChunk.update({
                        where: { id: chunk.id },
                        data: {
                            embeddingId: chunk.id,
                            embeddedAt: new Date(),
                        }
                    })

                    embeddedCount++
                }
                console.log(`[processDocumentChunks] Embedded ${embeddedCount} chunks so far`)
            } catch (embedError: any) {
                console.error(`[processDocumentChunks] Error embedding batch:`, embedError.message || embedError)
            }
        }

        // Mark document as processed
        await prisma.studyDocument.update({
            where: { id: documentId },
            data: { processedAt: new Date() }
        })

        console.log(`[processDocumentChunks] Complete! ${embeddedCount}/${chunkRecords.length} chunks embedded`)

        return {
            success: true,
            chunksCreated: chunkRecords.length,
            chunksEmbedded: embeddedCount,
        }
    } catch (error: any) {
        console.error("[processDocumentChunks] Failed:", error.message || error)
        return { success: false, error: error.message || "Failed to process document" }
    }
}

/**
 * Get all documents for a study
 */
export async function getStudyDocuments(studyId: string) {
    try {
        const documents = await prisma.studyDocument.findMany({
            where: { studyId },
            include: {
                _count: { select: { chunks: true } }
            },
            orderBy: { uploadedAt: "desc" }
        })

        return { success: true, documents }
    } catch (error: any) {
        console.error("Failed to get documents:", error)
        return { success: false, error: error.message, documents: [] }
    }
}

/**
 * Get document status with chunk info for a study
 * Used for displaying indexing badge and stats in UI
 */
export async function getStudyDocumentStatus(studyId: string) {
    try {
        const document = await prisma.studyDocument.findFirst({
            where: { studyId },
            include: {
                chunks: {
                    select: {
                        id: true,
                        embeddingId: true,
                    }
                }
            },
            orderBy: { uploadedAt: "desc" }
        })

        if (!document) {
            return {
                success: true,
                hasDocument: false,
                document: null,
                totalChunks: 0,
                embeddedChunks: 0,
            }
        }

        const totalChunks = document.chunks.length
        const embeddedChunks = document.chunks.filter(c => c.embeddingId != null).length

        return {
            success: true,
            hasDocument: true,
            document: {
                id: document.id,
                fileName: document.fileName,
                filePath: document.filePath,
                fileSize: document.fileSize,
                pageCount: document.pageCount,
                processedAt: document.processedAt,
            },
            totalChunks,
            embeddedChunks,
        }
    } catch (error: any) {
        console.error("Failed to get document status:", error)
        return {
            success: false,
            hasDocument: false,
            document: null,
            totalChunks: 0,
            embeddedChunks: 0,
            error: error.message
        }
    }
}

/**
 * Delete a document and its chunks
 */
export async function deleteStudyDocument(documentId: string, projectId: string) {
    try {
        // Get document first
        const document = await prisma.studyDocument.findUnique({
            where: { id: documentId }
        })

        if (!document) {
            return { success: false, error: "Document not found" }
        }

        // Delete vectors from LanceDB
        await deleteDocumentChunkVectors(projectId, documentId)

        // Delete file from filesystem
        await deleteDocumentFile(document.filePath)

        // Delete database records (chunks cascade)
        await prisma.studyDocument.delete({
            where: { id: documentId }
        })

        revalidatePath(`/projects/${projectId}`)

        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete document:", error)
        return { success: false, error: error.message || "Failed to delete document" }
    }
}

/**
 * Combined upload and process - for integration with AI analysis
 * @param fileBase64 - Base64 encoded file content
 */
export async function uploadAndProcessDocument(
    studyId: string,
    projectId: string,
    fileBase64: string,
    fileName: string
) {
    // Upload
    const uploadResult = await uploadStudyDocument(
        studyId,
        projectId,
        fileBase64,
        fileName
    )

    if (!uploadResult.success || !uploadResult.document) {
        return uploadResult
    }

    // Process (non-blocking - fire and forget for better UX)
    // The processing will happen in the background
    processDocumentChunks(uploadResult.document.id, projectId)
        .catch(err => console.error("Background document processing failed:", err))

    return uploadResult
}

/**
 * Reset document embeddings - clears chunks and vectors without deleting the file
 * Useful when embedding failed mid-process and needs retry
 */
export async function resetDocumentEmbeddings(documentId: string, projectId: string) {
    try {
        // Verify document exists
        const document = await prisma.studyDocument.findUnique({
            where: { id: documentId }
        })

        if (!document) {
            return { success: false, error: "Document not found" }
        }

        // Delete all chunks from SQLite (cascades automatically due to schema)
        await prisma.documentChunk.deleteMany({
            where: { documentId }
        })

        // Delete vectors from LanceDB
        await deleteDocumentChunkVectors(projectId, documentId)

        // Reset processedAt to mark as unprocessed
        await prisma.studyDocument.update({
            where: { id: documentId },
            data: { processedAt: null }
        })

        revalidatePath(`/projects/${projectId}`)

        return { success: true }
    } catch (error: any) {
        console.error("Failed to reset document embeddings:", error)
        return { success: false, error: error.message || "Failed to reset embeddings" }
    }
}

/**
 * Reprocess document - resets embeddings then reprocesses the PDF
 * Useful for retrying after a failed embedding process
 */
export async function reprocessDocumentEmbeddings(documentId: string, projectId: string) {
    try {
        // Reset first
        const resetResult = await resetDocumentEmbeddings(documentId, projectId)
        if (!resetResult.success) {
            return resetResult
        }

        // Reprocess (blocking this time to give user feedback)
        const processResult = await processDocumentChunks(documentId, projectId)

        return processResult
    } catch (error: any) {
        console.error("Failed to reprocess document:", error)
        return { success: false, error: error.message || "Failed to reprocess document" }
    }
}
