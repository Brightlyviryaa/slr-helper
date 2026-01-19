"use server"

/**
 * Voyage AI Embedding Client
 * Uses voyage-3.5 model with 1024 dimensions via REST API
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"
const VOYAGE_MODEL = "voyage-3.5"
const EMBEDDING_DIMENSION = 1024

interface VoyageEmbeddingResponse {
    object: string
    data: {
        object: string
        embedding: number[]
        index: number
    }[]
    model: string
    usage: {
        total_tokens: number
    }
}

/**
 * Generate embedding for a single text
 * @param text - Text to embed
 * @param inputType - "document" for indexing, "query" for searching
 */
export async function embedText(
    text: string,
    inputType: "document" | "query" = "document"
): Promise<number[]> {
    const apiKey = process.env.VOYAGE_API_KEY
    if (!apiKey) {
        throw new Error("VOYAGE_API_KEY environment variable is not set")
    }

    const response = await fetch(VOYAGE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: VOYAGE_MODEL,
            input: [text],
            input_type: inputType,
            output_dimension: EMBEDDING_DIMENSION,
        }),
    })

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Voyage API error: ${response.status} - ${errorBody}`)
    }

    const data: VoyageEmbeddingResponse = await response.json()

    if (!data.data || data.data.length === 0) {
        throw new Error("No embedding returned from Voyage API")
    }

    return data.data[0].embedding
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param texts - Array of texts to embed (max 128)
 * @param inputType - "document" for indexing, "query" for searching
 */
export async function embedTexts(
    texts: string[],
    inputType: "document" | "query" = "document"
): Promise<number[][]> {
    if (texts.length === 0) {
        return []
    }

    if (texts.length > 128) {
        throw new Error("Maximum batch size is 128 texts")
    }

    const apiKey = process.env.VOYAGE_API_KEY
    if (!apiKey) {
        throw new Error("VOYAGE_API_KEY environment variable is not set")
    }

    const response = await fetch(VOYAGE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: VOYAGE_MODEL,
            input: texts,
            input_type: inputType,
            output_dimension: EMBEDDING_DIMENSION,
        }),
    })

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Voyage API error: ${response.status} - ${errorBody}`)
    }

    const data: VoyageEmbeddingResponse = await response.json()

    // Sort by index to maintain order
    const sortedData = data.data.sort((a, b) => a.index - b.index)
    return sortedData.map(item => item.embedding)
}
