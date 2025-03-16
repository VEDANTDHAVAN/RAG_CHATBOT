const PromptSuggestionButton = ({text , onClick}) => {
    return (
        <button className="prompt-button" onClick={onClick}>
            {text}
        </button>
    )
}

export default PromptSuggestionButton