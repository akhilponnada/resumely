import { createAzure } from "@ai-sdk/azure";
import { AzureOpenAI } from "openai";

/**
 * Single place where the Azure OpenAI deployment is configured.
 *
 * Clients are created on first use rather than at module scope: module scope
 * is evaluated while `next build` collects page data, where no API key exists.
 */

export const AI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-5.6-terra-2";
const AI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? "2024-12-01-preview";

let client: AzureOpenAI | null = null;

function requireAzureEnv() {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("AZURE_OPENAI_API_KEY is not set");
    }
    if (!AI_ENDPOINT) {
        throw new Error("AZURE_OPENAI_ENDPOINT is not set");
    }
    return { apiKey, endpoint: AI_ENDPOINT };
}

function azureOpenAIBaseURL(endpoint: string) {
    const trimmed = endpoint.replace(/\/$/, "");
    return trimmed.endsWith("/openai") ? trimmed : `${trimmed}/openai`;
}

export function getAIClient(): AzureOpenAI {
    if (!client) {
        const { apiKey, endpoint } = requireAzureEnv();
        client = new AzureOpenAI({
            apiKey,
            endpoint,
            apiVersion: AI_API_VERSION,
        });
    }
    return client;
}

export function getAzureModel() {
    const { apiKey, endpoint } = requireAzureEnv();
    const azure = createAzure({
        apiKey,
        baseURL: azureOpenAIBaseURL(endpoint),
        apiVersion: AI_API_VERSION,
        useDeploymentBasedUrls: true,
    });
    return azure(AI_DEPLOYMENT);
}
