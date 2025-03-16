/* eslint-disable @typescript-eslint/no-require-imports */
const { DataAPIClient } = require("@datastax/astra-db-ts");
const { PuppeteerWebBaseLoader } = require("langchain/document_loaders/web/puppeteer");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
require("dotenv").config();

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    COHERE_API_KEY
} = process.env;

const PRData = [
    'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Consumer_Reports/Product_reviews',
    'https://en.wikipedia.org/wiki/Consumer_Reports',
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

/** ✅ Get Embedding Dimension Dynamically */
const getEmbeddingDimension = async (sampleText) => {
    try {
        const response = await fetch("https://api.cohere.ai/v1/embed", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${COHERE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                texts: [sampleText],
                model: "embed-multilingual-v3.0",
                input_type: "search_document"
            }),
        });

        const data = await response.json();
        if (!data.embeddings || data.embeddings.length === 0) {
            throw new Error("Cohere API did not return embeddings");
        }

        const dimension = data.embeddings[0].length;
        console.log(`✅ Detected embedding dimension: ${dimension}`);
        return dimension;
    } catch (error) {
        console.error("Error fetching embedding dimension:", error.message);
        return null;
    }
};

/** ✅ Check if Collection Exists */
const collectionExists = async () => {
    try {
        const collections = await db.listCollections();
        const existingCollection = collections.find(col => col.name === ASTRA_DB_COLLECTION);
        if (existingCollection) {
            console.log(`✅ Collection "${ASTRA_DB_COLLECTION}" found with dimension: ${existingCollection.vector.dimension}`);
            return existingCollection.vector.dimension;
        }
        return null;
    } catch (error) {
        console.error("Error checking collections:", error.message);
        return null;
    }
};

/** ✅ Create or Recreate Collection */
const ensureCollection = async (requiredDimension) => {
    const existingDimension = await collectionExists();

    if (existingDimension === requiredDimension) {
        console.log(`✅ Collection "${ASTRA_DB_COLLECTION}" already exists with the correct dimension. Skipping creation.`);
        return;
    }

    if (existingDimension !== null) {
        console.warn(`⚠️ Collection "${ASTRA_DB_COLLECTION}" exists with different dimension (${existingDimension}). Dropping and recreating...`);
        await db.collection(ASTRA_DB_COLLECTION).drop();
    }

    console.log(`🚀 Creating collection "${ASTRA_DB_COLLECTION}" with dimension ${requiredDimension}...`);
    await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: { dimension: requiredDimension, metric: "dot_product" }
    });

    console.log(`✅ Collection "${ASTRA_DB_COLLECTION}" created successfully.`);
};

/** ✅ Fetch Cohere Embeddings */
const getCohereEmbedding = async (text, requiredDimension) => {
    try {
        const response = await fetch("https://api.cohere.ai/v1/embed", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${COHERE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                texts: [text],
                model: "embed-multilingual-v3.0",
                input_type: "search_document"
            }),
        });

        const data = await response.json();
        if (!data.embeddings || data.embeddings.length === 0) {
            throw new Error("Cohere API did not return embeddings");
        }

        const vector = data.embeddings[0];

        // ✅ Dimension Check Before Inserting
        if (vector.length !== requiredDimension) {
            throw new Error(`Embedding dimension mismatch! Expected ${requiredDimension}, got ${vector.length}`);
        }

        return vector;
    } catch (error) {
        console.error("Error fetching embedding:", error.message);
        return null;
    }
};

/** ✅ Scrape Web Page */
const scrapePage = async (url) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: { headless: true },
        gotoOptions: { waitUntil: "domcontentloaded" },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerText);
            await browser.close();
            return result;
        }
    });
    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '');
};

/** ✅ Load Data into AstraDB */
const loadSampleData = async (requiredDimension) => {
    try {
        const collection = await db.collection(ASTRA_DB_COLLECTION);

        for (const url of PRData) {
            console.log(`Scraping: ${url}`);
            const content = await scrapePage(url);
            const chunks = await splitter.splitText(content);

            for (const chunk of chunks) {
                const vector = await getCohereEmbedding(chunk, requiredDimension);
                if (!vector) {
                    console.warn("⚠️ Skipping chunk due to embedding error.");
                    continue;
                }

                const res = await collection.insertOne({
                    $vector: vector,
                    text: chunk
                });

                console.log("Inserted:", res);
            }
        }
        console.log("✅ Data successfully loaded into AstraDB.");
    } catch (error) {
        console.error("Error loading sample data:", error.message);
    }
};

/** ✅ Run Script */
(async () => {
    const sampleText = "Hello, this is a test sentence for embedding.";
    const requiredDimension = await getEmbeddingDimension(sampleText);

    if (!requiredDimension) {
        console.error("❌ Failed to determine embedding dimension. Exiting...");
        process.exit(1);
    }

    await ensureCollection(requiredDimension);
    await loadSampleData(requiredDimension);
})();

/*import {DataAPIClient} from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import OpenAI from "openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const { 
    ASTRA_DB_NAMESPACE, 
    ASTRA_DB_COLLECTION, 
    ASTRA_DB_API_ENDPOINT, 
    ASTRA_DB_APPLICATION_TOKEN, 
    OPENAI_API_KEY 
} = process.env

const openai = new OpenAI({apiKey: OPENAI_API_KEY})
const PRData = [
    'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Consumer_Reports/Product_reviews',
    'https://en.wikipedia.org/wiki/Consumer_Reports',
    'https://www.kaggle.com/datasets/arhamrumi/amazon-product-reviews',
    'https://www.kaggle.com/datasets/thoughtvector/customer-support-on-twitter',
    'https://www.kaggle.com/datasets/validmodel/amazon-top-cell-phones-and-accessories-qa',
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {namespace: ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const fetchWithRetry = async (apiCall: () => Promise<any>, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            if (error.status === 429) {
                console.warn(`Rate limit hit. Retrying in ${delay / 1000} seconds...`);
                await new Promise((res) => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error;
            }
        }
    }
    throw new Error("API request failed after multiple retries.");
};

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    try {
        const collections = await db.listCollections(); // Get collection info

        // Check if the collection name exists in the list
        if (collections.some((col: { name: string }) => col.name === ASTRA_DB_COLLECTION)) {
            console.log(`Collection "${ASTRA_DB_COLLECTION}" already exists. Skipping creation.`);
            return;
        }

        // Create the collection if it doesn't exist
        const response = await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: {
                dimension: 1536,
                metric: similarityMetric
            }
        });

        console.log("Collection created:", response);
    } catch (error) {
        console.error("Error checking/creating collection:", error);
    }
};


const scrapePage = async (url: string) => {
   const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
        headless: true
    },
    gotoOptions: {
        waitUntil: "domcontentloaded"
    },
    evaluate: async (page, browser) => {
        const result = await page.evaluate(() => document.body.innerHTML)
        await browser.close()
        return result
    }
   })
   return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
}

const processedUrls = new Set(); // Store already scraped URLs

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    for await (const url of PRData) {
        if (processedUrls.has(url)) {
            console.log(`Skipping ${url}, already processed.`);
            continue;
        }

        const content = await scrapePage(url);
        const chunks = await splitter.splitText(content);
        for await (const chunk of chunks) {
            const embedding = await fetchWithRetry(async () => {
                return await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: chunk,
                    encoding_format: "float",
                });
            });

            const vector = embedding.data[0].embedding;

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk,
            });

            console.log(res);
        }

        processedUrls.add(url); // Mark URL as processed
    }
};

createCollection().then(() => loadSampleData())
/*import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const { 
    ASTRA_DB_NAMESPACE, 
    ASTRA_DB_COLLECTION, 
    ASTRA_DB_API_ENDPOINT, 
    ASTRA_DB_APPLICATION_TOKEN, 
    OPENAI_API_KEY 
} = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const PRData = [
    "https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Consumer_Reports/Product_reviews",
    "https://en.wikipedia.org/wiki/Consumer_Reports",
    "https://www.kaggle.com/datasets/arhamrumi/amazon-product-reviews",
    "https://www.kaggle.com/datasets/thoughtvector/customer-support-on-twitter",
    "https://www.kaggle.com/datasets/validmodel/amazon-top-cell-phones-and-accessories-qa",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100,
});

/**
 * Retry logic for handling OpenAI API rate limits (429 errors).
 
const fetchWithRetry = async (apiCall: () => Promise<any>, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            if (error.status === 429) {
                console.warn(`Rate limit hit. Retrying in ${delay / 1000} seconds...`);
                await new Promise((res) => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error;
            }
        }
    }
    throw new Error("API request failed after multiple retries.");
};

/**
 * Creates a collection in Astra DB with vector search capability.
 
const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const response = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 1536,
            metric: similarityMetric,
        },
    });
    console.log(response);
};
/**
 * Scrapes webpage content using Puppeteer.
const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true,
        },
        gotoOptions: {
            waitUntil: "domcontentloaded",
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML);
            await browser.close();
            return result;
        },
    });
    return (await loader.scrape())?.replace(/<[^>]*>?/gm, ""); // Remove HTML tags
};

/**
 * Loads sample data, processes embeddings, and stores in Astra DB.
const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION);

    for await (const url of PRData) {
        console.log(`Scraping content from: ${url}`);
        const content = await scrapePage(url);
        const chunks = await splitter.splitText(content);

        console.log(`Generating embeddings for ${chunks.length} chunks...`);

        await Promise.all(
            chunks.map(async (chunk) => {
                const embedding = await fetchWithRetry(async () => {
                    return await openai.embeddings.create({
                        model: "text-embedding-ada-002", // More cost-efficient
                        input: chunk,
                        encoding_format: "float",
                    });
                });

                const vector = embedding.data[0].embedding;

                await collection.insertOne({
                    $vector: vector,
                    text: chunk,
                });

                console.log(`Stored chunk in database.`);
            })
        );
    }

    console.log("Data loading complete!");
};

// **Run the pipeline**
createCollection().then(() => loadSampleData()).catch(console.error);
*/