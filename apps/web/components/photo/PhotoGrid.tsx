import { Photo } from "@/lib/types";
import { PhotoCard } from "./PhotoCard";

export function PhotoGrid({ items }: { items: Photo[] }) {
  return (
    <div className="columns-2 gap-4 sm:columns-3 xl:columns-4">
      {items.map((photo) => (
        <PhotoCard key={photo._id} photo={photo} />
      ))}
    </div>
  );
}
