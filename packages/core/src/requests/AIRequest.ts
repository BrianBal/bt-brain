export type AIChatMessage = { role: string; text: string }
export type AIModelInfo = {
    service: string
    model: string
    apiKey?: string
    maxInputTokens?: number
    [key: string]: any
}

export type AIRequest = (
    prompt: string,
    system: string,
    model: AIModelInfo,
    history: AIChatMessage[]
) => Promise<AIChatMessage | null>

export type AIStreamingRequest = (
    prompt: string,
    system: string,
    model: AIModelInfo,
    history: AIChatMessage[],
    progress: (text: string) => void
) => Promise<AIChatMessage | null>
