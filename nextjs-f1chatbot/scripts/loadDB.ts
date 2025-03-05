import { DataAPIClient, Db } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

// Load environment variables
const { ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN } = process.env;

if (!ASTRA_DB_NAMESPACE || !ASTRA_DB_COLLECTION || !ASTRA_DB_API_ENDPOINT || !ASTRA_DB_APPLICATION_TOKEN) {
    throw new Error("Please check your .env file - some required variables are missing.");
}

// Initialize Astra DB client and collection
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

// Text splitter setup
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

// Define F1 pages to scrape
const f1data = [
    'https://en.wikipedia.org/wiki/Formula_One',
    'https://www.formula1.com/en/results.html',
    'https://www.formula1.com/en/drivers.html',
    'https://www.formula1.com/en/teams.html',
    'https://www.formula1.com/en/latest.html',
    'https://www.statsf1.com/en/results.aspx',
    'https://www.statsf1.com/en/drivers.aspx',
    'https://www.motorsport.com/f1/news/',
    'https://www.autosport.com/f1/news/',
    'https://www.fia.com/regulation/category/123'
];

// Function to dynamically load the embedding model (dynamic import fix)
let embeddingModel: any;

const loadEmbeddingModel = async () => {
    const { pipeline } = await import("@xenova/transformers");
    embeddingModel = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
};

// Function to create collection if it doesn't exist
const createCollectionIfNotExists = async (db: Db, collectionName: string) => {
    const collections = await db.listCollections();
    if (collections.find((col) => col.name === collectionName)) {
        console.log(`Collection '${collectionName}' already exists. Skipping creation.`);
        return;
    }

    const res = await db.createCollection(collectionName, {
        vector: {
            dimension: 384,  // all-MiniLM-L6-v2 produces 384-dimension vectors
            metric: "cosine"
        }
    });
    console.log("Collection created:", res);
};

// Function to load data into Astra DB
const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION);

    for await (const url of f1data) {
        const content = await scrapePage(url);
        const chunks = await splitter.splitText(content);

        for await (const chunk of chunks) {
            const tensor = await embeddingModel(chunk, { pooling: "mean", normalize: true });
            const embedding = Array.from(tensor.data);  // Properly convert to number[]

            const res = await collection.insertOne({
                $vector: embedding,
                text: chunk,
            });

            console.log(res);
        }
    }
};

// Function to scrape page content
const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: { headless: true },
        gotoOptions: { waitUntil: "domcontentloaded" },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerText);
            await browser.close();
            return result;
        }
    });

    const rawContent = await loader.scrape();
    return rawContent?.replace(/<[^>]*>?/gm, "") || "";  // Strip HTML tags (fallback for safety)
};

// Main function
const main = async () => {
    await loadEmbeddingModel();    // Load embedding model dynamically (fix for ESM issue)
    await createCollectionIfNotExists(db, ASTRA_DB_COLLECTION);  // Check/create collection
    await loadSampleData();        // Scrape, embed, store
    console.log("Data loading complete.");
};

main().catch(console.error);
