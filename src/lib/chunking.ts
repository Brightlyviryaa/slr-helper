/**
 * Text Chunking Utilities
 * Splits text into overlapping chunks for embedding
 */

export const CHUNK_SIZE = 900      // Target tokens per chunk
export const CHUNK_OVERLAP = 150   // Overlapping tokens between chunks

/**
 * Chunk result with metadata
 */
export interface Chunk {
    index: number
    content: string
    tokenCount: number
    startOffset: number  // Character offset in original text
    endOffset: number
}

/**
 * Simple token counting (word-based approximation)
 * For more accuracy, use tiktoken or similar library
 */
export function countTokens(text: string): number {
    // Simple approximation: ~0.75 words per token for English
    // This is a rough estimate; actual token count varies by tokenizer
    const words = text.split(/\s+/).filter(w => w.length > 0)
    return Math.ceil(words.length / 0.75)
}

/**
 * Estimate character count for a given token count
 */
function tokensToChars(tokens: number): number {
    // Average ~4 characters per token for English
    return tokens * 4
}

/**
 * Split text into overlapping chunks
 * @param text - Full text to chunk
 * @param chunkSize - Target tokens per chunk (default 900)
 * @param overlap - Overlapping tokens between chunks (default 150)
 */
export function chunkText(
    text: string,
    chunkSize: number = CHUNK_SIZE,
    overlap: number = CHUNK_OVERLAP
): Chunk[] {
    if (!text || text.trim().length === 0) {
        return []
    }

    const chunks: Chunk[] = []
    const chunkChars = tokensToChars(chunkSize)
    const overlapChars = tokensToChars(overlap)
    const strideChars = chunkChars - overlapChars

    let startOffset = 0
    let index = 0

    while (startOffset < text.length) {
        // Calculate end position
        let endOffset = Math.min(startOffset + chunkChars, text.length)

        // Try to break at sentence or paragraph boundary
        if (endOffset < text.length) {
            const searchStart = Math.max(startOffset + strideChars - 100, startOffset)
            const searchEnd = Math.min(endOffset + 100, text.length)
            const searchText = text.slice(searchStart, searchEnd)

            // Look for paragraph break first
            const paragraphBreak = searchText.lastIndexOf("\n\n")
            if (paragraphBreak !== -1 && paragraphBreak > strideChars * 0.8) {
                endOffset = searchStart + paragraphBreak + 2
            } else {
                // Look for sentence break
                const sentenceBreaks = [". ", "! ", "? ", ".\n", "!\n", "?\n"]
                let bestBreak = -1
                for (const breakStr of sentenceBreaks) {
                    const pos = searchText.lastIndexOf(breakStr)
                    if (pos > bestBreak && pos > strideChars * 0.5) {
                        bestBreak = pos + breakStr.length
                    }
                }
                if (bestBreak !== -1) {
                    endOffset = searchStart + bestBreak
                }
            }
        }

        const content = text.slice(startOffset, endOffset).trim()

        if (content.length > 0) {
            chunks.push({
                index,
                content,
                tokenCount: countTokens(content),
                startOffset,
                endOffset
            })
            index++
        }

        // Move to next chunk with overlap
        startOffset = endOffset - overlapChars

        // Prevent infinite loop
        if (startOffset >= text.length - overlapChars && chunks.length > 0) {
            break
        }
    }

    return chunks
}

/**
 * Extract text pages from chunks (if page info is available)
 * This is a placeholder - actual page detection depends on PDF parser output
 */
export function estimatePageFromOffset(
    offset: number,
    pageBreaks: number[]
): number {
    for (let i = pageBreaks.length - 1; i >= 0; i--) {
        if (offset >= pageBreaks[i]) {
            return i + 1
        }
    }
    return 1
}
