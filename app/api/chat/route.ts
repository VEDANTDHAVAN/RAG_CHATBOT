/* eslint-disable @typescript-eslint/no-require-imports */
import { DataAPIClient } from "@datastax/astra-db-ts";
require("dotenv").config();

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    COHERE_API_KEY
} = process.env;

// Initialize AstraDB client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response(
                JSON.stringify({ error: "Invalid request: 'messages' array is missing or empty." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const latestMessage = body.messages[body.messages.length - 1]?.content;
        if (!latestMessage || typeof latestMessage !== "string" || latestMessage.trim() === "") {
            return new Response(
                JSON.stringify({ error: "Latest message content is empty or undefined." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("Received message: ", latestMessage);

        // Generate embeddings using Cohere
        const embeddingResponse = await fetch("https://api.cohere.ai/v1/embed", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${COHERE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "embed-multilingual-v3.0",
                texts: [latestMessage],
                input_type: "search_document"
            })
        });

        const embeddingData = await embeddingResponse.json();
        if (!embeddingData.embeddings || embeddingData.embeddings.length === 0) {
            throw new Error("Cohere API did not return embeddings.");
        }

        const vectorEmbedding = embeddingData.embeddings[0];

        let docContext = "";
        try {
            // Check if the collection exists, else create it with 1024 dimensions
            const collections = await db.listCollections();
            const collectionExists = collections.some(col => col.name === ASTRA_DB_COLLECTION);

            if (!collectionExists) {
                console.log(`Creating collection: ${ASTRA_DB_COLLECTION} with 1024 dimensions`);
                await db.createCollection(ASTRA_DB_COLLECTION, {
                    vector: { dimension: 1024, metric: "cosine" }
                });
            }

            const collection = await db.collection(ASTRA_DB_COLLECTION);

            // Perform vector search in AstraDB
            const cursor = collection.find({}, {
                sort: { $vector: vectorEmbedding },
                limit: 10
            });

            const documents = await cursor.toArray();
            const docsMap = documents?.map(doc => doc.text);
            docContext = JSON.stringify(docsMap);

        } catch (error) {
            console.log("Error Querying AstraDB:", error);
            docContext = "";
        }

        // System prompt for Cohere
        const systemPrompt = `
           You are **ContextAI**, an intelligent assistant that provides insightful product reviews using retrieved data.
           ## **Context:**  ${docContext}

           ## **Instructions:**  
           - Extract key insights from the product details.  
           - If the user requests a summary, generate a **structured review**.  
           - If the user asks for comparisons, highlight **pros, cons, and unique features**.  
           - If sentiment analysis is required, identify **positive, negative, and neutral aspects**.  
           - If no reviews are found, suggest **similar products** or provide general insights.  
           - Ensure responses are **factual, clear, and user-friendly**.

           ## **Example Responses:**  
           **1️⃣ Detailed Review:**  
           *"The [Product Name] is praised for its durable build and fast performance. However, users report minor heating issues."*

           **2️⃣ Comparison:**  
           *"Compared to [Competitor Name], this product offers better battery life but lacks waterproofing."*

           **3️⃣ Sentiment Analysis:**  
           *"From 500+ reviews, 70% are positive, with users loving the display. 15% mention software issues."*

           ## **User Query:**  
           ${latestMessage}

           Generate a high-quality response based on the retrieved context.
        `;

        // Call Cohere API for response generation
        const cohereResponse = await fetch("https://api.cohere.ai/v1/generate", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${COHERE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "command-light",
                prompt: systemPrompt,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const cohereData = await cohereResponse.json();
        if (!cohereData.generations || cohereData.generations.length === 0) {
            throw new Error("Cohere API did not return a valid response.");
        }

        // Return AI-generated response
        return new Response(
            JSON.stringify({ response: cohereData.generations[0].text }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}


/*import { DataAPIClient } from "@datastax/astra-db-ts";

require("dotenv").config();

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    COHERE_API_KEY
} = process.env;

// Initialize AstraDB client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
    try {
        /*const { messages } = await req.json();
        const latestMessage = messages[messages?.length - 1]?.content;*/
        /*const body = await req.json();

        if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response(
                JSON.stringify({error: "Invalid request: 'messages' array is missing or empty."}),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const latestMessage = body.messages[body.messages.length - 1]?.content;
        if (!latestMessage || typeof latestMessage !== "string" || latestMessage.trim() === "") {
            console.error("Invalid request: Latest message content is missing or empty.");
            return new Response(
                JSON.stringify({ error: "Latest message content is empty or undefined." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        console.log("Received message: ", latestMessage);

        let docContext = "";

        // Generate 1024-dimensional embeddings using Cohere
        const embeddingResponse = await fetch("https://api.cohere.ai/v1/embed", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${COHERE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "embed-multilingual-v3.0",
                texts: [latestMessage],
                input_type: "search_document"
            })
        });

        const embeddingData = await embeddingResponse.json();
        if (!embeddingData.embeddings || embeddingData.embeddings.length === 0) {
            throw new Error("Cohere API did not return embeddings.");
        }

        const vectorEmbedding = embeddingData.embeddings[0];

        try {
            // Check if the collection exists, else create it with 1024 dimensions
            const collections = await db.listCollections();
            const collectionExists = collections.some(col => col.name === ASTRA_DB_COLLECTION);

            if (!collectionExists) {
                console.log(`Creating collection: ${ASTRA_DB_COLLECTION} with 1024 dimensions`);
                await db.createCollection(ASTRA_DB_COLLECTION, {
                    vector: { dimension: 1024, metric: "cosine" } // Updated to 1024
                });
            }

            const collection = await db.collection(ASTRA_DB_COLLECTION);

            // Perform vector search in AstraDB
            const cursor = collection.find({}, {
                sort: {
                    $vector: vectorEmbedding
                },
                limit: 10
            });

            const documents = await cursor.toArray();
            const docsMap = documents?.map(doc => doc.text);
            docContext = JSON.stringify(docsMap);
            const systemPrompt = `
           You are **ContextAI**, an intelligent assistant that provides insightful product reviews using retrieved data.           ## **Context:**  ${docContext}

## **Instructions:**  
- Extract key insights from the product details.  
- If the user requests a summary, generate a **structured review**.  
- If the user asks for comparisons, highlight **pros, cons, and unique features**.  
- If sentiment analysis is required, identify **positive, negative, and neutral aspects**.  
- If no reviews are found, suggest **similar products** or provide general insights.  
- Ensure responses are **factual, clear, and user-friendly**.

## **Example Responses:**  
**1️⃣ Detailed Review:**  
*"The [Product Name] is praised for its durable build and fast performance. However, users report minor heating issues."*

**2️⃣ Comparison:**  
*"Compared to [Competitor Name], this product offers better battery life but lacks waterproofing."*

**3️⃣ Sentiment Analysis:**  
*"From 500+ reviews, 70% are positive, with users loving the display. 15% mention software issues."*

## **User Query:**  
${latestMessage}

Generate a high-quality response based on the retrieved context.
        `;

        // Call Cohere API for response generation
        const cohereResponse = await fetch("https://api.cohere.ai/v1/generate", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${COHERE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "command-r",
                prompt: systemPrompt,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const cohereData = await cohereResponse.json();
        if (!cohereData.generations || cohereData.generations.length === 0) {
            throw new Error("Cohere API did not return a valid response.");
        }

         return new Response(
            JSON.stringify({ response: cohereData.generations[0].text }),
            { status: 200, headers: { "Content-Type": "application/json" } }
         );
        } catch (error) {
            console.log("Error Querying AstraDB:", error);
            docContext = "";
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}*/
