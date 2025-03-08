export const runtime = 'nodejs';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    GOOGLE_API_KEY,
} = process.env;

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY!);
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE! });

async function generateEmbedding(text: string): Promise<number[]> {
    const { pipeline } = await import("@xenova/transformers");
    const embeddingPipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    const output = await embeddingPipeline(text, { pooling: "mean", normalize: true });

    return Array.from(output.data);
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const latestMessage = messages?.[messages.length - 1]?.content || "";

        if (!latestMessage) {
            return new Response("Invalid request - no message found", { status: 400 });
        }

        let docContext = "";

        try {
            const embedding = await generateEmbedding(latestMessage);
            const collection = await db.collection(ASTRA_DB_COLLECTION!);

            const cursor = collection.find(
                {},
                {
                    sort: { $vector: embedding },
                    limit: 5
                }
            );

            const documents = await cursor.toArray();
            const docsMap = documents.map(doc => doc.text);

            docContext = docsMap.map(text => text.substring(0, 300)).join("\n\n");
        } catch (err) {
            console.error("Error querying DB or generating embeddings:", err);
            docContext = "";
        }

        const systemPrompt = `
You are an AI assistant specialized in Formula One racing. Use the following context (if available) to enhance your response.
If the context is irrelevant or empty, rely on your existing knowledge. Don't mention the context or its limitations in your response.
Format your responses using Markdown when useful.

---
CONTEXT:
${docContext || "No relevant context found."}
---

Question: ${latestMessage}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
        });

        const responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

        return new Response(responseText, {
            headers: { "Content-Type": "text/plain" }
        });
    } catch (err) {
        console.error("Error processing request:", err);
        return new Response("Internal Server Error", { status: 500 });
    }
}
