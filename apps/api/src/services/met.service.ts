import { buildHashtags, ImportedPhoto, inferPhotoCategory, shortenText } from "../utils/photoImport.js";

type MetSearchResponse = {
  objectIDs?: number[] | null;
};

type MetObjectResponse = {
  objectID: number;
  title?: string;
  primaryImage?: string;
  primaryImageSmall?: string;
  artistDisplayName?: string;
  objectName?: string;
  classification?: string;
  culture?: string;
  objectDate?: string;
  city?: string;
  tags?: Array<{
    term?: string;
  }>;
};

async function metFetch<T>(path: string) {
  const response = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1${path}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Met Museum request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function searchMetImportPhotos(query: string, limit = 8) {
  const params = new URLSearchParams({
    hasImages: "true",
    q: query
  });
  const response = await metFetch<MetSearchResponse>(`/search?${params.toString()}`);
  const ids = (response.objectIDs ?? []).slice(0, Math.max(limit * 3, limit));

  const objects = await Promise.allSettled(
    ids.map((id) => metFetch<MetObjectResponse>(`/objects/${id}`))
  );

  return objects
    .flatMap<ImportedPhoto>((result) => {
      if (result.status !== "fulfilled") {
        return [];
      }

      const item = result.value;
      const imageUrl = item.primaryImage || item.primaryImageSmall || "";
      const thumbnailUrl = item.primaryImageSmall || item.primaryImage || "";

      if (!item.objectID || !imageUrl || !thumbnailUrl) {
        return [];
      }

      const title = item.title?.trim() || query;
      const artist = item.artistDisplayName?.trim();
      const caption = shortenText(
        [title, artist ? `by ${artist}` : undefined, item.objectDate?.trim()].filter(Boolean).join(" - ")
      );

      return [
        {
          externalId: `met:${item.objectID}`,
          imageUrl,
          thumbnailUrl,
          caption,
          tags: buildHashtags([
            query,
            item.objectName,
            item.classification,
            ...(item.tags ?? []).map((tag) => tag.term).slice(0, 3),
            "metmuseum",
            "imported"
          ]),
          category: inferPhotoCategory(
            query,
            title,
            item.objectName,
            item.classification,
            item.culture
          ),
          location: item.city?.trim() || "The Met Collection"
        }
      ];
    })
    .slice(0, limit);
}
