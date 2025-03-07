"use client";

import Image from "next/image";
import f1GPTLogo from "./assets/F1gpt.png";
import { useState } from "react";
import Bubble from "./components/Bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionRow from "./components/PromptSuggestionRow";

type Message = {
    id: string;
    content: string;
    role: "user" | "assistant";
};

const Home = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { id: crypto.randomUUID(), content: input, role: "user" };
        setMessages((prev) => [...prev, userMessage]);

        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            const responseText = await res.text();

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                content: responseText,
                role: "assistant",
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Failed to fetch response:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrompt = (promptText: string) => {
        const userMessage: Message = { id: crypto.randomUUID(), content: promptText, role: "user" };
        setMessages((prev) => [...prev, userMessage]);
        fetchResponse(promptText);
    };

    const fetchResponse = async (prompt: string) => {
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, { id: crypto.randomUUID(), content: prompt, role: "user" }] }),
            });

            const responseText = await res.text();

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                content: responseText,
                role: "assistant",
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Failed to fetch response:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const noMessages = messages.length === 0;

    return (
        <main>
            <Image src={f1GPTLogo} width={250} alt="F1GPT" />
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The Ultimate place for Formula One super fans!
                            Ask F1GPT anything about the fantastic topic of F1 racing
                            and it will come back with the most up-to-date answers.
                            We hope you enjoy!
                        </p>
                        <br />
                        <PromptSuggestionRow onPromptClick={() => handlePrompt("Who won the 2023 F1 Championship?")} />
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <Bubble key={`message-${index}`} message={message} />
                        ))}
                        {isLoading && <LoadingBubble />}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                <input
                    className="question-box"
                    onChange={handleInputChange}
                    value={input}
                    placeholder="Ask me something..."
                />
                <button type="submit">Send</button>
            </form>
        </main>
    );
};

export default Home;
