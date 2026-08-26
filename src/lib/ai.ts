import { AzureOpenAI } from "openai";

/**
 * Single place where the Azure OpenAI deployment is configured.
 *
 * The client is created on first use rather than at module scope: module scope
 * is evaluated while `next build` collects page data, where no API key exists.
 */

export const AI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-5.6-terra-2";
const AI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? "2024-12-01-preview";

let client: AzureOpenAI | null = null;

export function getAIClient(): AzureOpenAI {
    if (!client) {
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("AZURE_OPENAI_API_KEY is not set");
        }
        if (!AI_ENDPOINT) {
            throw new Error("AZURE_OPENAI_ENDPOINT is not set");
        }
        client = new AzureOpenAI({
            apiKey,
            endpoint: AI_ENDPOINT,
            apiVersion: AI_API_VERSION,
        });
    }
    return client;
}
