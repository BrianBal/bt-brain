import Session from "../Session"
import googleRequest from "./google"
// import ollamaRequest from "./ollama"
import anthropicRequest from "./anthropic"
import openaiRequest from "./openai"
import groqRequest from "./groq"
import type { AIChatMessage } from "./AIRequest"
import streamOllamaRequest from "./streamOllama"

const makeRequest = async (
    userPrompt: string,
    systemMessage: string,
    modelKey: string,
    examples: AIChatMessage[] = [],
    progress: (text: string) => void = (_text: string) => {}
): Promise<AIChatMessage | null> => {
    let session = Session.get()
    let modelInfo = session.getModel(modelKey)
    if (!modelInfo) {
        throw "Model not found"
    }

    let resp = null
    if (modelInfo.service === "groq") {
        resp = await groqRequest(userPrompt, systemMessage, modelInfo, examples, progress)
    }
    if (modelInfo.service === "openai") {
        resp = await openaiRequest(userPrompt, systemMessage, modelInfo, examples, progress)
    }
    if (modelInfo.service === "anthropic") {
        resp = await anthropicRequest(userPrompt, systemMessage, modelInfo, examples)
    }
    if (modelInfo.service === "ollama") {
        resp = await streamOllamaRequest(userPrompt, systemMessage, modelInfo, examples, progress)
    }
    if (modelInfo.service === "google") {
        resp = await googleRequest(userPrompt, systemMessage, modelInfo, examples)
    }

    return resp
}

export default makeRequest
