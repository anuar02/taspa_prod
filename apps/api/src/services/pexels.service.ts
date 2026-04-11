import { env } from "../config/env.js";

type PexelsPhoto = {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x?: string;
    large?: string;
    medium?: string;
    small?: string;
    portrait?: string;
    tiny?: string;
  };
  alt?: string;
};

type PexelsResponse = {
  photos: PexelsPhoto[];
};

async function pexelsFetch(path: string) {
  if (!env.pexelsApiKey) {
    throw new Error("PEXELS_API_KEY is not configured");
  }

  const response = await fetch(`https://api.pexels.com${path}`, {
    headers: {
      Authorization: env.pexelsApiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Pexels request failed: ${response.status}`);
  }

  return (await response.json()) as PexelsResponse;
}

export async function searchPexelsPhotos(query: string, perPage = 15, page = 1) {
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    page: String(page),
    orientation: "portrait"
  });

  return pexelsFetch(`/v1/search?${params.toString()}`);
}

export async function curatedPexelsPhotos(perPage = 15, page = 1) {
  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page)
  });

  return pexelsFetch(`/v1/curated?${params.toString()}`);
}

export function mapPexelsCategory(query: string) {
  const normalized = query.toLowerCase();

  if (normalized.includes("nature") || normalized.includes("mountain") || normalized.includes("lake")) {
    return "NATURE" as const;
  }
  if (normalized.includes("portrait") || normalized.includes("people") || normalized.includes("face")) {
    return "PORTRAIT" as const;
  }
  if (normalized.includes("city") || normalized.includes("street") || normalized.includes("urban")) {
    return "CITY" as const;
  }
  if (normalized.includes("art") || normalized.includes("minimal")) {
    return "ART" as const;
  }
  if (normalized.includes("food") || normalized.includes("coffee") || normalized.includes("dinner")) {
    return "FOOD" as const;
  }

  return "OTHER" as const;
}

export type { PexelsPhoto };
