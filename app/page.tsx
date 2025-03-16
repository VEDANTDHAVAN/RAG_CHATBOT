"use client"
import Image from "next/image"
import RAG_Logo from "./assets/RAG_CHATBOT.jpg"
import { useAssistant } from '@ai-sdk/react'
import { Message } from "ai"

const Home = () => {

    const { append, isLoading, messages, input, handleInputChange, handleSubmit} = useAssistant({api: ""})

    const noMessages = true
    return (
        <main>
            <Image src={RAG_Logo} width="250" alt="RAG_ChatBot_LOGO" className="img"/>
            <section className={noMessages ? "":"populated"}>
             {noMessages ? (
                <>
                 <p className="starter-text">
                 <b>Welcome to ContextAI – Your Intelligent Knowledge Assistant!</b>
                 <br />
                 <br />
                 <b>ContextAI</b> brings you the power of <b>Retrieval-Augmented Generation (RAG)</b>—delivering precise, context-aware, and AI-enhanced answers in real time. Whether you're searching for insights, conducting research, or need intelligent assistance,<b> ContextAI</b> retrieves the most relevant information and refines it into meaningful responses.
                 </p>
                 <br />
                 {/* <PromptSuggestionRow/> */}
                </>
             ): (
                <>
                 {/* map messages onto text bubbles */}
                 {/*<LoadingBubble />*/}
                </>
             )}
            </section>
            <form onSubmit={handleSubmit}>
                <input type="question-box" onChange={handleInputChange} value={input} placeholder="Ask me Something!!"/>
                <input type="submit" />
             </form>
        </main>
    )
}

export default Home