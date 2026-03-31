/** OpenAI-compatible `POST .../chat/completions` URLs for BYOK (Settings). */
export function openAiCompatibleChatUrl(provider: string): string {
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "deepseek":
      return "https://api.deepseek.com/v1/chat/completions";
    case "perplexity":
      return "https://api.perplexity.ai/chat/completions";
    case "gemini":
      return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export function defaultChatModel(provider: string): string {
  switch (provider) {
    case "openai":
      return "gpt-4o-mini";
    case "deepseek":
      return "deepseek-chat";
    case "perplexity":
      return "sonar";
    case "gemini":
      return "gemini-2.0-flash";
    default:
      return "gpt-4o-mini";
  }
}
