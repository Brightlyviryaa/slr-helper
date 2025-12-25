"use server"

import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export interface StudyMetadata {
    title: string
    authors?: string
    year: number
    venue?: string
    doi?: string
    url?: string
    keywords?: string
    abstract?: string
}

async function fetchUrlContent(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            },
            redirect: 'follow',
        })
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        const html = await response.text()
        // Strip HTML tags and get text content
        const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 15000) // Limit to 15k chars
        return textContent
    } catch (error: any) {
        console.error("Failed to fetch URL:", error.message)
        throw error
    }
}

export async function extractPaperMetadata(doiUrl: string): Promise<{ success: boolean; data?: StudyMetadata; error?: string }> {
    try {
        if (!doiUrl || !doiUrl.trim()) {
            return { success: false, error: "URL is required" }
        }

        // Normalize DOI URL
        let normalizedUrl = doiUrl.trim()
        if (normalizedUrl.startsWith("10.") && !normalizedUrl.startsWith("http")) {
            normalizedUrl = `https://doi.org/${normalizedUrl}`
        }

        // Fetch URL content first
        let pageContent: string
        try {
            pageContent = await fetchUrlContent(normalizedUrl)
        } catch (error: any) {
            return { success: false, error: `Failed to access URL: ${error.message}` }
        }

        // Use AI to extract metadata from the content
        const { text } = await generateText({
            model: google("gemini-3-flash-preview"),
            prompt: `You are a research paper metadata extractor. Based on this web page content from ${normalizedUrl}:

---
${pageContent}
---

Extract the following metadata and return it as a valid JSON object (no markdown, just pure JSON):
{
  "title": "The full title of the paper",
  "authors": "List of authors, comma-separated",
  "year": 2024,
  "venue": "The journal, conference, or publication venue",
  "doi": "The DOI identifier if available",
  "url": "The direct URL to access the paper",
  "keywords": "Main topics or keywords, comma-separated",
  "abstract": "The full abstract of the paper"
}

Important:
- year MUST be a number, not a string
- If a field is not available, omit it from the JSON
- Return ONLY the JSON object, no explanation or markdown
- Be accurate and extract only what is clearly stated in the document`,
        })

        console.log("AI Raw Response:", text)

        // Parse the JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            console.error("JSON parse failed. Raw text:", text)
            return { success: false, error: "Could not parse AI response" }
        }

        const parsed = JSON.parse(jsonMatch[0]) as StudyMetadata

        // Validate year is a number
        if (typeof parsed.year === "string") {
            parsed.year = parseInt(parsed.year)
        }

        // Set URL if not extracted
        if (!parsed.url) {
            parsed.url = normalizedUrl
        }

        return { success: true, data: parsed }
    } catch (error: any) {
        console.error("AI extraction failed:", error)
        return {
            success: false,
            error: error.message || "Failed to extract metadata. Please check the URL and try again."
        }
    }
}
