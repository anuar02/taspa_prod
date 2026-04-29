"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Globe,
  ImagePlus,
  Images,
  Lock,
  MapPin,
  Tags,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";

const categories = [
  { key: "NATURE", label: "Табиғат" },
  { key: "PORTRAIT", label: "Портрет" },
  { key: "CITY", label: "Қала" },
  { key: "ART", label: "Өнер" },
  { key: "FOOD", label: "Тағам" },
  { key: "OTHER", label: "Басқа" }
] as const;

const steps = [
  { id: 1, eyebrow: "1-қадам", title: "Фото таңдау" },
  { id: 2, eyebrow: "2-қадам", title: "Мәлімет қосу" },
  { id: 3, eyebrow: "3-қадам", title: "Жариялау" }
] as const;

const suggestedTags = ["#табиғат", "#қала", "#портрет", "#өнер", "#кеш", "#саяхат"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type StepId = (typeof steps)[number]["id"];

function normalizeTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("#") ? item : `#${item}`));
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<StepId>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]["key"]>("OTHER");
  const [location, setLocation] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const parsedTags = normalizeTags(tags);
  const hasImage = Boolean(file && preview);
  const activeCategory = categories.find((item) => item.key === category);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (isMobile) {
      cameraInputRef.current?.click();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function resetFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function applyFile(nextFile: File | null) {
    if (!nextFile) { resetFile(); return; }

    if (!nextFile.type.startsWith("image/")) {
      setError("Тек сурет файлын жүктеңіз.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError("Файл көлемі 10MB-тан аспауы керек.");
      return;
    }

    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setStep(2);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    applyFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  }

  function goToStep(nextStep: StepId) {
    if (nextStep > 1 && !hasImage) { setStep(1); return; }
    setError("");
    setStep(nextStep);
  }

  function appendTag(tag: string) {
    const normalized = tag.startsWith("#") ? tag : `#${tag}`;
    if (parsedTags.includes(normalized)) return;
    setTags((current) => (current.trim() ? `${current}, ${normalized}` : normalized));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) { setError("Алдымен сурет таңдаңыз."); setStep(1); return; }

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("image", file);
      formData.append("caption", caption.trim());
      formData.append("tags", parsedTags.join(", "));
      formData.append("category", category);
      formData.append("location", location.trim());
      formData.append("isPrivate", String(isPrivate));

      const { data } = await api.post("/photos", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

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
      {/* hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* step indicator — only shown on step 2+ */}
      {step > 1 && (
        <div className="mb-6 rounded-[32px] bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-3">
            {steps.map((item) => {
              const isActive = step === item.id;
              const isDone = step > item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToStep(item.id)}
                  disabled={item.id > 1 && !hasImage}
                  className={`flex flex-1 items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isActive ? "border-primary bg-primary/5" : "border-border bg-bg hover:border-primary/35"
                  }`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive || isDone ? "bg-primary text-white" : "bg-white text-muted"
                  }`}>
                    {isDone ? <Check size={13} /> : item.id}
                  </div>
                  <span className="hidden text-sm font-semibold text-text sm:block">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-[24px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── STEP 1: photo picker ── */}
        {step === 1 && (
          <section>
            {/* desktop: drag-and-drop zone */}
            <div
              className={`hidden sm:flex min-h-[calc(100dvh-12rem)] cursor-pointer flex-col items-center justify-center gap-6 rounded-[36px] border-2 border-dashed bg-white transition ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`flex h-20 w-20 items-center justify-center rounded-3xl transition ${isDragging ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                {isDragging ? <UploadCloud size={36} /> : <ImagePlus size={36} />}
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-text">
                  {isDragging ? "Файлды осында жіберіңіз" : "Фотоны сүйреп апарыңыз немесе таңдаңыз"}
                </p>
                <p className="mt-2 text-sm text-muted">JPG немесе PNG · 10 MB дейін</p>
              </div>
              <span className="rounded-full border border-border bg-bg px-6 py-2.5 text-sm font-medium text-text">
                Файл таңдау
              </span>
            </div>

            {/* mobile: full-screen camera trigger + gallery fallback */}
            <div className="flex flex-col items-center gap-6 sm:hidden">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex min-h-[calc(100dvh-16rem)] w-full flex-col items-center justify-center gap-5 rounded-[32px] bg-primary px-6 py-10 text-white shadow-card active:scale-[0.98]"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20">
                  <Camera size={40} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">Камераны ашу</p>
                  <p className="mt-1 text-sm text-white/70">Фото түсіру үшін басыңыз</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm font-medium text-muted active:text-primary"
              >
                <Images size={16} />
                Галереядан таңдау
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 2: details ── */}
        {step === 2 && (
          <section className="rounded-[36px] bg-white p-5 shadow-card sm:p-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-primary">2-қадам</p>
                <h2 className="mt-2 text-2xl font-semibold text-text">Фото туралы айтыңыз</h2>
                <p className="mt-1 text-sm text-muted">
                  Сипаттама, категория, тегтер мен локация фотоны табуды жеңілдетеді.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-[24px] bg-bg px-4 py-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-surface">
                  <Image src={preview} alt="Selected file" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{file?.name}</p>
                  <button type="button" onClick={resetFile} className="mt-1 text-xs font-medium text-primary">
                    Фотоны ауыстыру
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-text">Сипаттама</label>
                    <span className="text-xs text-muted">{caption.length} таңба</span>
                  </div>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    rows={6}
                    placeholder="Фото туралы қысқа тарих жазыңыз..."
                    className="min-h-[160px] w-full resize-none rounded-[24px] border border-border bg-bg px-4 py-3 text-sm text-text outline-none transition placeholder:text-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Tags size={15} className="text-primary" />
                    <label className="text-sm font-medium text-text">Категория</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCategory(item.key)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          category === item.key ? "bg-primary text-white" : "bg-bg text-muted hover:text-text"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-text">
                    <MapPin size={15} className="text-primary" />
                    Локация
                  </label>
                  <Input
                    placeholder="Мысалы: Алматы, Медеу"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="bg-bg"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text">Тегтер</label>
                  <Input
                    placeholder="#табиғат, #қала, #таң"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    className="bg-bg"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => appendTag(tag)}
                        className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted transition hover:border-primary hover:text-primary"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {parsedTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {parsedTags.map((tag) => (
                        <span key={tag} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-[24px] border border-border bg-bg px-4 py-4">
                  <div className="flex items-center gap-3">
                    {isPrivate ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-text/10 text-text">
                        <Lock size={16} />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Globe size={16} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {isPrivate ? "Жеке фото" : "Жалпыға ашық"}
                      </p>
                      <p className="text-xs text-muted">
                        {isPrivate ? "Тек сіз ғана көре аласыз" : "Барлық пайдаланушылар лентада көреді"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate((v) => !v)}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${isPrivate ? "bg-text" : "bg-primary"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${isPrivate ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] bg-bg p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Қысқаша кеңес</p>
                <div className="mt-4 space-y-3 text-sm text-muted">
                  <div className="rounded-2xl bg-white px-4 py-3">Сипаттаманы 1-3 сөйлеммен ұстаңыз.</div>
                  <div className="rounded-2xl bg-white px-4 py-3">3-5 нақты тег іздеуді жақсартады.</div>
                  <div className="rounded-2xl bg-white px-4 py-3">Категория карточканың қабылдануын күшейтеді.</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="secondary" onClick={resetFile}>
                <Trash2 size={16} />
                Фотоны өзгерту
              </Button>
              <Button type="button" onClick={() => goToStep(3)}>
                Шолу қадамына өту
                <ArrowRight size={16} />
              </Button>
            </div>
          </section>
        )}

        {/* ── STEP 3: review ── */}
        {step === 3 && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[36px] bg-white p-5 shadow-card sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-primary">3-қадам</p>
                  <h2 className="mt-2 text-2xl font-semibold text-text">Соңғы шолу</h2>
                </div>
                <Button type="button" variant="secondary" onClick={() => goToStep(2)}>
                  Өңдеу
                </Button>
              </div>

              <div className="relative min-h-[520px] overflow-hidden rounded-[32px] bg-[#ede9e2]">
                <Image src={preview} alt="Review preview" fill className="object-cover" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/70">
                    {activeCategory?.label ?? "Категория"}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {caption.trim() || "Сипаттама қосылмаған"}
                  </p>
                  {location.trim() && (
                    <p className="mt-2 text-sm text-white/75">{location.trim()}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[36px] bg-white p-5 shadow-card sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-primary">Жариялау парағы</p>
              <div className="mt-4 space-y-5">
                <div className="rounded-[24px] bg-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Категория</p>
                  <p className="mt-2 text-sm font-semibold text-text">{activeCategory?.label}</p>
                </div>

                <div className="rounded-[24px] bg-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Сипаттама</p>
                  <p className="mt-2 text-sm leading-6 text-text">
                    {caption.trim() || "Сипаттама қосылмаған"}
                  </p>
                </div>

                <div className="rounded-[24px] bg-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Локация</p>
                  <p className="mt-2 text-sm text-text">{location.trim() || "Көрсетілмеген"}</p>
                </div>

                <div className="rounded-[24px] bg-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Тегтер</p>
                  {parsedTags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {parsedTags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-text">Тегтер қосылмаған</p>
                  )}
                </div>

                <div className="rounded-[24px] bg-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Көріну</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-text">
                    {isPrivate ? <Lock size={14} /> : <Globe size={14} className="text-primary" />}
                    {isPrivate ? "Жеке — тек сіз ғана көресіз" : "Жалпыға ашық"}
                  </div>
                </div>

                <div className="rounded-[24px] border border-border bg-white p-4">
                  <p className="text-sm font-semibold text-text">Жариялауға дайынсыз ба?</p>
                  <p className="mt-2 text-sm text-muted">
                    {isPrivate
                      ? "Жеке фото тек сіздің профиліңізде көрінеді, лентаға шықпайды."
                      : "Басқаннан кейін фото лентада және профиліңізде бірден көрінеді."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Жарияланып жатыр..." : "Жариялау"}
                </Button>
                <Button type="button" variant="secondary" className="w-full" onClick={() => goToStep(2)}>
                  <ArrowLeft size={16} />
                  Мәліметтерге оралу
                </Button>
              </div>
            </div>
          </section>
        )}
      </form>
    </main>
  );
}
