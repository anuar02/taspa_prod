import { Photo } from "@/lib/types";
import { PhotoCard } from "./PhotoCard";

export function PhotoGrid({ items }: { items: Photo[] }) {
  return (
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 [@media(min-width:1800px)]:columns-7 [@media(min-width:2200px)]:columns-8">
      {items.map((photo) => (
        <PhotoCard key={photo._id} photo={photo} />
      ))}
    </div>
  );
}
