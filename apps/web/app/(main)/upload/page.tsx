"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";

const categories = ["NATURE", "PORTRAIT", "CITY", "ART", "FOOD", "OTHER"];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      setFile(null);
      setPreview("");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Алдымен сурет таңдаңыз");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("image", file);
      formData.append("caption", caption);
      formData.append("tags", tags);
      formData.append("category", category);
      formData.append("location", location);

      const { data } = await api.post("/photos", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage("Фото сәтті жүктелді");
      router.push(`/photo/${data.item._id}`);
    } catch (submitError) {
      console.error(submitError);
      setError("Жүктеу сәтсіз аяқталды. API және авторизацияны тексеріңіз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <TopBar title="Жүктеу" subtitle="Жаңа фото жариялаңыз" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex min-h-64 cursor-pointer items-center justify-center rounded-[32px] border border-dashed border-primary/40 bg-white p-6 shadow-card">
          {preview ? (
            <div className="relative h-80 w-full overflow-hidden rounded-[28px]">
              <Image src={preview} alt="Preview" fill className="object-cover" />
            </div>
          ) : (
            <span className="text-center text-sm text-muted">Фотоны таңдау немесе сүйреп апару</span>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
        <Input placeholder="Подпись" value={caption} onChange={(event) => setCaption(event.target.value)} />
        <Input
          placeholder="Тегтер: #табиғат, #қала"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text outline-none"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <Input placeholder="Локация" value={location} onChange={(event) => setLocation(event.target.value)} />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-primary">{message}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Жүктелуде..." : "Жүктеу"}
        </Button>
      </form>
    </main>
  );
}
