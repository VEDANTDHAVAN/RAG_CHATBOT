"use client";
import Image from "next/image";
import RAG_Logo from "./assets/RAG_CHATBOT.jpg";
import { useAssistant } from "@ai-sdk/react";
import { Message } from "ai";
import Bubble from "./components/Bubble";
import LoadingBubble from "./components/LoadingBubble";
import Navbar from "./components/Navbar";
import { useState, useEffect } from "react";

const Home = () => {
  const { append, status, messages, input, setInput } = useAssistant({ api: "/api/chat" });
  const [chats, setChats] = useState<{ id: string; name: string; messages: Message[] }[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    const storedChats = JSON.parse(localStorage.getItem("chats") || "[]");
    setChats(storedChats);
  }, []);

  useEffect(() => {
    if (currentChatId) {
      const updatedChats = chats.map((chat) =>
        chat.id === currentChatId ? { ...chat, messages } : chat
      );
      setChats(updatedChats);
      localStorage.setItem("chats", JSON.stringify(updatedChats));
    }
  }, [messages, currentChatId]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      role: "user",
    };

    append(userMessage);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.response) {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          content: data.response,
          role: "assistant",
        };
        append(aiMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setInput("");
  };

  const handleNewChat = () => {
    const newChat = { id: crypto.randomUUID(), name: `Chat ${chats.length + 1}`, messages: [] };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
  };

  const currentMessages = chats.find((chat) => chat.id === currentChatId)?.messages || [];

  return (
    <div className="app-container">
      <Navbar chats={chats} onNewChat={handleNewChat} onSelectChat={handleSelectChat} />
      <main className="chat-container">
        <div className="logo"><Image src={RAG_Logo} width="50" alt="RAG_ChatBot_LOGO" className="chat-logo" /> <b>ContextAI</b></div>
        <section className="chat-box">
          {currentMessages.map((message) => (
            <Bubble key={message.id} message={message} />
          ))}
          {status === "in_progress" && <LoadingBubble />}
        </section>
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input type="text" onChange={handleInputChange} value={input} placeholder="Type a message..." />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
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
import { useEffect, useState } from "react";
const [messages, setMessages] = useState([]);

useEffect(() => {
    fetch("/api/chat")
      .then(res => res.json())
      .then(data => setMessages(data.messages))
}, []);
//import PromptSuggestionRow from "./components/PromptSuggestionRow"

const Home = () => {
    const { append, status, messages, input, setInput } = useAssistant({ api: "/api/chat" });

    const noMessages = !messages || messages.length === 0;

    const handlePrompt = (promptText) => {
        const id = typeof window !== "undefined" ? crypto.randomUUID() : "temp-id";
        const msg: Message = { id, content: promptText, role: "user"};
        append(msg);
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value);
    };

    const handleSubmit =async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            content: input,
            role: "user"
        };

        append(userMessage);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages,userMessage] }) // Ensure messages array is sent
            });
            
            if(!response.ok){
                throw new Error(`API Error: ${response.statusText}`)
            }

            const data = await response.json();
            console.log("API Response:", data);

            if(data.response){
                const aiMessage: Message = {
                    id: crypto.randomUUID(),
                    content: data.response, // Extract the AI's response
                    role: "assistant"
                }
                append(aiMessage);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
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
                       {/* <PromptSuggestionRow onPromptClick={handlePrompt} /> */
                   /* </>
                ) : (
                    <>
                        {messages.map((message) => (
                            <Bubble key={message.id} message={message} />
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