import { PhotoDetail } from "@/components/photo/PhotoDetail";
import { CommentSection } from "@/components/photo/CommentSection";
import { api } from "@/lib/api";
import { Photo } from "@/lib/types";

async function getPhoto(id: string) {
  const { data } = await api.get<{ item: Photo }>(`/photos/${id}`);
  return data.item;
}

export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await getPhoto(id);

  return (
    <main>
      <PhotoDetail
        photo={photo}
        aside={<CommentSection photoId={photo._id} commentsCount={photo.commentsCount} />}
      />
    </main>
  );
}
