import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionRow = ({onPromptClick}) => {
    const prompts = [
     "Personalized review: Is [Product Name] worth it for [specific use case]?",
     "What are customers saying about [Product Name] in 2024?",
     "Give me a review of [Product Name] from a tech enthusiast’s perspective.",
     "What are the most common complaints about [Product Name]?", 
     "Does [Product Name] have any known durability issues?"
    ]
    
    return (
      <div className="prompt-row">
        {prompts.map((prompt, index) => 
        <PromptSuggestionButton 
            key={`suggestion-${index}`}
            text={prompt}
            onClick={() => onPromptClick(prompt)}
        />)}
      </div>
    )
  }
  
  export default PromptSuggestionRow