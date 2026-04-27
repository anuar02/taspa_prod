import { buildHashtags, ImportedPhoto, inferPhotoCategory, shortenText } from "../utils/photoImport.js";

type NasaSearchItem = {
  data?: Array<{
    nasa_id?: string;
    title?: string;
    description?: string;
    keywords?: string[];
    center?: string;
    photographer?: string | string[];
  }>;
  links?: Array<{
    href?: string;
    render?: string;
  }>;
};

type NasaSearchResponse = {
  collection?: {
    items?: NasaSearchItem[];
  };
};

async function nasaFetch<T>(path: string) {
  const response = await fetch(`https://images-api.nasa.gov${path}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`NASA request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function searchNasaImportPhotos(query: string, limit = 8, page = 1) {
  const params = new URLSearchParams({
    q: query,
    media_type: "image",
    page: String(page)
  });

  const response = await nasaFetch<NasaSearchResponse>(`/search?${params.toString()}`);

  return (response.collection?.items ?? [])
    .flatMap<ImportedPhoto>((item) => {
      const metadata = item.data?.[0];
      const imageUrl =
        item.links?.find((link) => link.render === "image")?.href ?? item.links?.[0]?.href ?? "";

      if (!metadata?.nasa_id || !imageUrl) {
        return [];
      }

      const photographer = Array.isArray(metadata.photographer)
        ? metadata.photographer.join(", ")
        : metadata.photographer;
      const title = metadata.title?.trim() || query;
      const caption = shortenText(
        [title, photographer ? `NASA / ${photographer}` : "NASA"].filter(Boolean).join(" - ")
      );

      return [
        {
          externalId: `nasa:${metadata.nasa_id}`,
          imageUrl,
          thumbnailUrl: imageUrl,
          caption,
          tags: buildHashtags([
            query,
            ...(metadata.keywords ?? []).slice(0, 3),
            "nasa",
            "imported"
          ]),
          category: inferPhotoCategory(query, title, metadata.description, ...(metadata.keywords ?? [])),
          location: metadata.center?.trim() || "NASA Image Library"
        }
      ];
    })
    .slice(0, limit);
}
