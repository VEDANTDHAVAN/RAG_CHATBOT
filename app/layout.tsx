import "./global.css"

export const metadata = {
    title: "ContextAI",
    description: "ContextAI is an advanced Retrieval-Augmented Generation (RAG) chatbot designed to deliver precise, insightful, and context-aware responses. By intelligently retrieving relevant information from vast datasets and augmenting it with powerful AI-driven text generation, ContextAI ensures that every interaction is not just accurate but also deeply contextual."
}

const RootLayout = ({children}) => {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}

export default RootLayout