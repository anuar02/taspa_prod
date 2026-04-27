import { PhotoCategory } from "../models/Photo.model.js";

export type ImportedPhoto = {
  externalId: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  tags: string[];
  category: PhotoCategory;
  location: string;
};

export function inferPhotoCategory(...parts: Array<string | null | undefined>): PhotoCategory {
  const normalized = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    normalized.includes("nature") ||
    normalized.includes("mountain") ||
    normalized.includes("lake") ||
    normalized.includes("forest") ||
    normalized.includes("earth") ||
    normalized.includes("aurora") ||
    normalized.includes("flower") ||
    normalized.includes("landscape")
  ) {
    return "NATURE";
  }

  if (
    normalized.includes("portrait") ||
    normalized.includes("people") ||
    normalized.includes("person") ||
    normalized.includes("face") ||
    normalized.includes("figure") ||
    normalized.includes("self-portrait")
  ) {
    return "PORTRAIT";
  }

  if (
    normalized.includes("city") ||
    normalized.includes("street") ||
    normalized.includes("urban") ||
    normalized.includes("architecture") ||
    normalized.includes("building")
  ) {
    return "CITY";
  }

  if (
    normalized.includes("art") ||
    normalized.includes("painting") ||
    normalized.includes("sculpture") ||
    normalized.includes("museum") ||
    normalized.includes("textile") ||
    normalized.includes("still life") ||
    normalized.includes("abstract")
  ) {
    return "ART";
  }

  if (
    normalized.includes("food") ||
    normalized.includes("coffee") ||
    normalized.includes("dinner") ||
    normalized.includes("meal") ||
    normalized.includes("still life with fruit")
  ) {
    return "FOOD";
  }

  return "OTHER";
}

export function buildHashtags(values: Array<string | null | undefined>, limit = 5) {
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeTag(value);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    tags.push(normalized);

    if (tags.length >= limit) {
      break;
    }
  }

  return tags;
}

export function shortenText(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function normalizeTag(value?: string | null) {
  const cleaned = (value ?? "")
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .join("");

  if (!cleaned) {
    return null;
  }

  return `#${cleaned.slice(0, 24)}`;
}
