import fs from "fs/promises"
import path from "path"

/**
 * Document Storage Utilities
 * Handles saving and managing uploaded PDF files
 */

const UPLOAD_DIR = "uploads/pdfs"

/**
 * Get the full file system path for uploads
 */
function getUploadBasePath(): string {
    return path.join(process.cwd(), "public", UPLOAD_DIR)
}

/**
 * Ensure the upload directory exists for a project
 */
async function ensureUploadDir(projectId: string): Promise<string> {
    const dirPath = path.join(getUploadBasePath(), projectId)
    await fs.mkdir(dirPath, { recursive: true })
    return dirPath
}

/**
 * Generate a unique filename for the uploaded file
 */
function generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)
    const timestamp = Date.now()
    const sanitized = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50)
    return `${sanitized}_${timestamp}${ext}`
}

/**
 * Save an uploaded PDF file
 * @param projectId - Project ID for organizing files
 * @param fileBase64 - File content as base64 string
 * @param originalName - Original filename
 * @returns Object with filePath (relative to public/), fileName, and fileSize
 */
export async function saveUploadedPdf(
    projectId: string,
    fileBase64: string,
    originalName: string
): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const dirPath = await ensureUploadDir(projectId)
    const fileName = generateUniqueFilename(originalName)
    const fullPath = path.join(dirPath, fileName)

    // Convert base64 to Buffer for writing
    const fileBuffer = Buffer.from(fileBase64, "base64")
    await fs.writeFile(fullPath, fileBuffer)

    // Return path relative to public/ for URL access
    const relativePath = `${UPLOAD_DIR}/${projectId}/${fileName}`

    return {
        filePath: relativePath,
        fileName: originalName, // Keep original name for display
        fileSize: fileBuffer.length
    }
}

/**
 * Get the public URL for a document
 */
export function getDocumentUrl(filePath: string): string {
    return `/${filePath}`
}

/**
 * Delete a document file
 */
export async function deleteDocumentFile(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), "public", filePath)
    try {
        await fs.unlink(fullPath)
    } catch (error) {
        // File might not exist, that's OK
        console.log(`Could not delete file ${filePath}:`, error)
    }
}

/**
 * Check if a document file exists
 */
export async function documentFileExists(filePath: string): Promise<boolean> {
    const fullPath = path.join(process.cwd(), "public", filePath)
    try {
        await fs.access(fullPath)
        return true
    } catch {
        return false
    }
}
