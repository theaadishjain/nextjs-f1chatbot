"use client"

import Image from "next/image"
import f1GPTLogo from "./assets/F1gpt.png"  // Check this case carefully!
import { useChat } from "ai/react"
import { Message } from "ai"
import Bubble from "./components/bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionRow from "./components/PromptSuggestionRow"

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat()

    const noMessages = messages.length === 0

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
                        {<PromptSuggestionRow/>}
                    </>
                ) : (
                    <>
                        {/* Map messages onto text bubbles */}
                        {<LoadingBubble/> }
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
                    <input type="submit" />
                </form>
        </main>
    )
}

export default Home
