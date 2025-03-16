"use client"
import Image from "next/image"
import RAG_Logo from "./assets/RAG_CHATBOT.jpg"
import { useAssistant } from '@ai-sdk/react'
import { Message } from "ai"
import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionRow from "./components/PromptSuggestionRow"

const Home = () => {
    const { append, status, messages, input, setInput } = useAssistant({ api: "/api/chat" });

    const noMessages = !messages || messages.length === 0;

    const handlePrompt = (promptText: string) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        };
        append(msg); // Ensure messages array is sent
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!input.trim()) return;

        const newMessage: Message = {
            id: crypto.randomUUID(),
            content: input,
            role: "user"
        };

        append(newMessage);
        setInput("");
    };

    return (
        <main>
            <Image src={RAG_Logo} width="250" alt="RAG_ChatBot_LOGO" className="img"/>
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            <b>Welcome to ContextAI – Your Intelligent Knowledge Assistant!</b>
                            <br />
                            <br />
                            <b>ContextAI</b> brings you the power of <b>Retrieval-Augmented Generation (RAG)</b>—
                            delivering precise, context-aware, and AI-enhanced answers in real time. Whether you&apos;re searching for insights,
                            conducting research, or need intelligent assistance, <b>ContextAI</b> retrieves the most relevant information and refines it into meaningful responses.
                        </p>
                        <br />
                        <PromptSuggestionRow onPromptClick={handlePrompt} />
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <Bubble key={`Message-${index}`} message={message} />
                        ))}
                        {status === "in_progress" && <LoadingBubble />}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                <input type="text" onChange={handleInputChange} value={input} placeholder="Ask me Something!!" />
                <input type="submit" />
            </form>
        </main>
    );
};

export default Home;


/*"use client"
import Image from "next/image"
import RAG_Logo from "./assets/RAG_CHATBOT.jpg"
import { useAssistant } from '@ai-sdk/react'
import { Message } from "ai"
import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionRow from "./components/PromptSuggestionRow"

const Home = () => {
    const { append, status, messages, input, setInput } = useAssistant({ api: "/api/chat" });

    const noMessages = !messages || messages.length === 0;

    const handlePrompt = (promptText: string) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        };
        append(msg);
    };

    // Handle input change
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value);
    };

    // Handle form submission manually
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!input.trim()) return; // Prevent sending empty messages

        const msg: Message = {
            id: crypto.randomUUID(),
            content: input,
            role: "user"
        };
        append(msg);
        setInput(""); // Clear input field after sending
    };

    return (
        <main>
            <Image src={RAG_Logo} width="250" alt="RAG_ChatBot_LOGO" className="img"/>
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            <b>Welcome to ContextAI – Your Intelligent Knowledge Assistant!</b>
                            <br />
                            <br />
                            <b>ContextAI</b> brings you the power of <b>Retrieval-Augmented Generation (RAG)</b>—
                            delivering precise, context-aware, and AI-enhanced answers in real time. Whether you&apos;re searching for insights,
                            conducting research, or need intelligent assistance, <b>ContextAI</b> retrieves the most relevant information and refines it into meaningful responses.
                        </p>
                        <br />
                        <PromptSuggestionRow onPromptClick={handlePrompt} />
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <Bubble key={`Message-${index}`} message={message} />
                        ))}
                        {status === "in_progress" && <LoadingBubble />}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                <input type="text" onChange={handleInputChange} value={input} placeholder="Ask me Something!!" />
                <input type="submit" />
            </form>
        </main>
    );
};

export default Home;*/

/*"use client"
import Image from "next/image"
import RAG_Logo from "./assets/RAG_CHATBOT.jpg"
import { useAssistant } from '@ai-sdk/react'
import { Message } from "ai"
import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionRow from "./components/PromptSuggestionRow"

const Home = () => {

    const { append, isLoading, messages, input, handleInputChange, handleSubmit} = useAssistant({api: "/api/chat"})

    const noMessages = !messages || messages.length === 0

    const handlePrompt = (promptText) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        append(msg)
    }
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
                 <b>ContextAI</b> brings you the power of <b>Retrieval-Augmented Generation (RAG)</b>—delivering precise, context-aware, and AI-enhanced answers in real time. Whether you&apos;re searching for insights, conducting research, or need intelligent assistance,<b> ContextAI</b> retrieves the most relevant information and refines it into meaningful responses.
                 </p>
                 <br />
                 <PromptSuggestionRow onPromptClick={handlePrompt}/>
                </>
             ): (
                <>
                 {messages.map((message) => <Bubble key={`Message-${index}`} message = {message}/>)}
                 <LoadingBubble />
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

export default Home*/