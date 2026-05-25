import { env } from "../config/env.js";

const photoCategories = ["NATURE", "PORTRAIT", "CITY", "ART", "FOOD", "OTHER"] as const;

export interface PhotoSuggestions {
  caption: string;
  tags: string[];
  category: (typeof photoCategories)[number];
}

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

export class OpenAIConfigurationError extends Error {}

function extractOutputText(result: OpenAIResponse) {
  if (result.output_text) {
    return result.output_text;
  }

  return (result.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text ?? "")
    .join("");
}

function normalizeSuggestions(value: unknown): PhotoSuggestions {
  const result = value as Partial<PhotoSuggestions>;
  const caption = typeof result.caption === "string" ? result.caption.trim().slice(0, 280) : "";
  const category = photoCategories.includes(result.category as PhotoSuggestions["category"])
    ? result.category as PhotoSuggestions["category"]
    : "OTHER";
  const tags = Array.isArray(result.tags)
    ? result.tags
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .slice(0, 6)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    : [];

  if (!caption) {
    throw new Error("AI response did not contain a caption");
  }

  return { caption, tags, category };
}

export async function generatePhotoSuggestions(image: Buffer, mimeType: string) {
  if (!env.openaiApiKey) {
    throw new OpenAIConfigurationError("OPENAI_API_KEY is not configured");
  }

  const result = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.openaiModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Generate metadata for a photo-sharing app whose primary language is Kazakh.",
                "Write one natural Kazakh caption of at most 120 characters.",
                "Suggest 3 to 6 concise discoverable hashtags, preferably in Kazakh.",
                "Choose exactly one supported category.",
                "Do not identify people or infer sensitive attributes."
              ].join(" ")
            },
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${image.toString("base64")}`,
              detail: "low"
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "photo_suggestions",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              caption: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" },
                minItems: 3,
                maxItems: 6
              },
              category: { type: "string", enum: photoCategories }
            },
            required: ["caption", "tags", "category"]
          }
        }
      },
      max_output_tokens: 250
    }),
    signal: AbortSignal.timeout(30_000)
  });

  if (!result.ok) {
    const message = await result.text();
    throw new Error(`OpenAI photo analysis failed (${result.status}): ${message.slice(0, 200)}`);
  }

  const body = await result.json() as OpenAIResponse;
  const outputText = extractOutputText(body);

  if (!outputText) {
    throw new Error("AI response contained no output text");
  }

  return normalizeSuggestions(JSON.parse(outputText));
}
