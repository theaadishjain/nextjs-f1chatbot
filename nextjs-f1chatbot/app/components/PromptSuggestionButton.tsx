const PromptSuggestionButton = ({ text, onClick }) => {
    return (
        <button
            className="prompt-suggestion-button"
            onClick={onClick}
            suppressHydrationWarning
        >
            {text}
        </button>
    );
};

export default PromptSuggestionButton;