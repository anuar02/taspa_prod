"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Eye,
  EyeOff,
  Flag,
  ImageOff,
  Loader2,
  Search,
  Shield,
  Trash2,
  Users
} from "lucide-react";
import axios from "axios";

import { TopBar } from "@/components/layout/TopBar";
import { api } from "@/lib/api";
import { Photo, PhotoReport, UserProfile, UserRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

type AdminStats = {
  usersCount: number;
  photosCount: number;
  commentsCount: number;
  privatePhotosCount: number;
  popularPhotosCount: number;
  adminsCount: number;
  reportsCount: number;
};

type AdminUser = UserProfile & {
  email: string;
  role: UserRole;
  createdAt?: string;
};

type TabKey = "users" | "photos" | "reports";
type PhotoFilterKey = "category" | "visibility" | "popularity" | "sort";

type PhotoFilters = {
  category: string;
  visibility: string;
  popularity: string;
  sort: string;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "users", label: "Қолданушылар" },
  { key: "photos", label: "Фотолар" },
  { key: "reports", label: "Шағымдар" }
];

const categoryOptions = [
  { value: "all", label: "Барлық санат" },
  { value: "NATURE", label: "Табиғат" },
  { value: "PORTRAIT", label: "Портрет" },
  { value: "CITY", label: "Қала" },
  { value: "ART", label: "Өнер" },
  { value: "FOOD", label: "Тағам" },
  { value: "OTHER", label: "Басқа" }
];

const visibilityOptions = [
  { value: "all", label: "Барлық күй" },
  { value: "public", label: "Ашық" },
  { value: "private", label: "Жабық" }
];

const popularityOptions = [
  { value: "all", label: "Барлығы" },
  { value: "popular", label: "Танымал" },
  { value: "regular", label: "Қалыпты" }
];

const sortOptions = [
  { value: "newest", label: "Жаңа алдымен" },
  { value: "oldest", label: "Ескі алдымен" },
  { value: "mostLiked", label: "Көп like" },
  { value: "mostViewed", label: "Көп қаралым" },
  { value: "mostCommented", label: "Көп пікір" }
];

const defaultPhotoFilters: PhotoFilters = {
  category: "all",
  visibility: "all",
  popularity: "all",
  sort: "newest"
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("kk-KZ", { dateStyle: "medium" }).format(new Date(value));
}

export default function AdminPage() {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<TabKey>("users");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reports, setReports] = useState<PhotoReport[]>([]);
  const [search, setSearch] = useState("");
  const [reportStatus, setReportStatus] = useState("OPEN");
  const [photoFilters, setPhotoFilters] = useState<PhotoFilters>(defaultPhotoFilters);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const canUseAdmin = authUser?.role === "ADMIN";

  useEffect(() => {
    if (authUser && authUser.role !== "ADMIN") {
      router.replace("/feed");
    }
  }, [authUser, router]);

  useEffect(() => {
    if (!canUseAdmin) return;

    const timeout = window.setTimeout(() => {
      void loadAdminData();
    }, 180);

    return () => window.clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseAdmin, tab, search, photoFilters, reportStatus]);

  async function loadAdminData() {
    try {
      setLoading(true);
      setError("");

      const [overviewResponse, listResponse] = await Promise.all([
        api.get<{ stats: AdminStats }>("/admin/overview"),
        tab === "users"
          ? api.get<{ items: AdminUser[] }>("/admin/users", { params: { search } })
          : tab === "photos"
            ? api.get<{ items: Photo[] }>("/admin/photos", { params: { search, ...photoFilters } })
            : api.get<{ items: PhotoReport[] }>("/admin/reports", { params: { status: reportStatus } })
      ]);

      setStats(overviewResponse.data.stats);
      if (tab === "users") {
        setUsers((listResponse.data as { items: AdminUser[] }).items);
      } else if (tab === "photos") {
        setPhotos((listResponse.data as { items: Photo[] }).items);
      } else {
        setReports((listResponse.data as { items: PhotoReport[] }).items);
      }
    } catch (loadError) {
      const message = axios.isAxiosError(loadError)
        ? loadError.response?.data?.message ?? "Админ деректері жүктелмеді"
        : "Админ деректері жүктелмеді";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, role: UserRole) {
    try {
      setActionId(userId);
      const { data } = await api.patch<{ item: AdminUser }>(`/admin/users/${userId}/role`, { role });
      setUsers((items) => items.map((item) => (item._id === userId ? data.item : item)));
      await refreshStats();
    } catch (roleError) {
      setError(axios.isAxiosError(roleError) ? roleError.response?.data?.message ?? "Рөл өзгермеді" : "Рөл өзгермеді");
    } finally {
      setActionId("");
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("Қолданушыны және оның контентін өшіру керек пе?")) return;

    try {
      setActionId(userId);
      await api.delete(`/admin/users/${userId}`);
      setUsers((items) => items.filter((item) => item._id !== userId));
      await refreshStats();
    } catch (deleteError) {
      setError(axios.isAxiosError(deleteError) ? deleteError.response?.data?.message ?? "Қолданушы өшірілмеді" : "Қолданушы өшірілмеді");
    } finally {
      setActionId("");
    }
  }

  async function updatePhoto(photoId: string, updates: Pick<Photo, "isPrivate" | "isPopular">) {
    try {
      setActionId(photoId);
      const { data } = await api.patch<{ item: Photo }>(`/admin/photos/${photoId}`, updates);
      setPhotos((items) => items.map((item) => (item._id === photoId ? data.item : item)));
      await refreshStats();
    } catch (photoError) {
      setError(axios.isAxiosError(photoError) ? photoError.response?.data?.message ?? "Фото жаңартылмады" : "Фото жаңартылмады");
    } finally {
      setActionId("");
    }
  }

  async function deletePhoto(photoId: string) {
    if (!window.confirm("Фотоны өшіру керек пе?")) return;

    try {
      setActionId(photoId);
      await api.delete(`/admin/photos/${photoId}`);
      setPhotos((items) => items.filter((item) => item._id !== photoId));
      await refreshStats();
    } catch (deleteError) {
      setError(axios.isAxiosError(deleteError) ? deleteError.response?.data?.message ?? "Фото өшірілмеді" : "Фото өшірілмеді");
    } finally {
      setActionId("");
    }
  }

  async function refreshStats() {
    const { data } = await api.get<{ stats: AdminStats }>("/admin/overview");
    setStats(data.stats);
  }

  async function updateReportStatus(reportId: string, status: PhotoReport["status"]) {
    try {
      setActionId(reportId);
      const { data } = await api.patch<{ item: PhotoReport }>(`/admin/reports/${reportId}`, { status });
      setReports((items) => items.map((item) => (item._id === reportId ? data.item : item)));
      await refreshStats();
    } catch (reportError) {
      setError(axios.isAxiosError(reportError) ? reportError.response?.data?.message ?? "Шағым жаңартылмады" : "Шағым жаңартылмады");
    } finally {
      setActionId("");
    }
  }

  function updatePhotoFilter(key: PhotoFilterKey, value: string) {
    setPhotoFilters((current) => ({ ...current, [key]: value }));
  }

  const statItems = useMemo(
    () => [
      { label: "Қолданушылар", value: stats?.usersCount ?? 0, icon: Users },
      { label: "Фотолар", value: stats?.photosCount ?? 0, icon: Camera },
      { label: "Пікірлер", value: stats?.commentsCount ?? 0, icon: Search },
      { label: "Ашық шағым", value: stats?.reportsCount ?? 0, icon: Flag },
      { label: "Админдер", value: stats?.adminsCount ?? 0, icon: Shield }
    ],
    [stats]
  );

  if (!canUseAdmin) {
    return (
      <main>
        <TopBar title="Админ" subtitle="Қолжетімділік тексерілуде" />
      </main>
    );
  }

  return (
    <main>
      <TopBar title="Админ панель" subtitle="Қолданушылар мен жарияланған фотоларды басқару" />

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted">{label}</p>
              <Icon size={18} className="text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold text-text">{value}</p>
          </div>
        ))}
      </section>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-auto pb-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                tab === item.key ? "bg-primary text-white" : "bg-white text-muted shadow-card"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab !== "reports" ? (
        <label className="relative block w-full lg:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tab === "users" ? "Аты, email, username" : "Сипаттама, тег, орын"}
            className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>
        ) : (
          <FilterSelect
            label="Күйі"
            value={reportStatus}
            options={[
              { value: "OPEN", label: "Ашық" },
              { value: "REVIEWED", label: "Қаралды" },
              { value: "DISMISSED", label: "Қабылданбады" },
              { value: "ALL", label: "Барлығы" }
            ]}
            onChange={setReportStatus}
          />
        )}
      </div>

      {tab === "photos" ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <FilterSelect
            label="Санат"
            value={photoFilters.category}
            options={categoryOptions}
            onChange={(value) => updatePhotoFilter("category", value)}
          />
          <FilterSelect
            label="Көрінуі"
            value={photoFilters.visibility}
            options={visibilityOptions}
            onChange={(value) => updatePhotoFilter("visibility", value)}
          />
          <FilterSelect
            label="Танымалдығы"
            value={photoFilters.popularity}
            options={popularityOptions}
            onChange={(value) => updatePhotoFilter("popularity", value)}
          />
          <FilterSelect
            label="Сұрыптау"
            value={photoFilters.sort}
            options={sortOptions}
            onChange={(value) => updatePhotoFilter("sort", value)}
          />
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setPhotoFilters(defaultPhotoFilters);
            }}
            className="min-h-[44px] self-end rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary"
          >
            Тазалау
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-white p-5 text-sm text-muted shadow-card">
          <Loader2 size={18} className="animate-spin" />
          Жүктелуде...
        </div>
      ) : tab === "users" ? (
        <UsersTable
          actionId={actionId}
          currentUserId={authUser._id}
          items={users}
          onDelete={deleteUser}
          onRoleChange={updateUserRole}
        />
      ) : (
        tab === "photos" ? (
          <PhotosTable actionId={actionId} items={photos} onDelete={deletePhoto} onUpdate={updatePhoto} />
        ) : (
          <ReportsTable actionId={actionId} items={reports} onStatusChange={updateReportStatus} />
        )
      )}
    </main>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function UsersTable({
  actionId,
  currentUserId,
  items,
  onDelete,
  onRoleChange
}: {
  actionId: string;
  currentUserId: string;
  items: AdminUser[];
  onDelete: (userId: string) => void;
  onRoleChange: (userId: string, role: UserRole) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Қолданушы</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Рөл</th>
              <th className="px-4 py-3 font-semibold">Пост</th>
              <th className="px-4 py-3 font-semibold">Тіркелді</th>
              <th className="px-4 py-3 text-right font-semibold">Әрекет</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((user) => (
              <tr key={user._id} className="align-middle">
                <td className="px-4 py-3">
                  <Link href={`/profile/${user.username}`} className="font-semibold text-text hover:text-primary">
                    {user.displayName}
                  </Link>
                  <p className="text-xs text-muted">@{user.username}</p>
                </td>
                <td className="px-4 py-3 text-muted">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    disabled={actionId === user._id || user._id === currentUserId}
                    onChange={(event) => onRoleChange(user._id, event.target.value as UserRole)}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-muted">{user.postsCount}</td>
                <td className="px-4 py-3 text-muted">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={actionId === user._id || user._id === currentUserId}
                    onClick={() => onDelete(user._id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger transition hover:bg-danger/10 disabled:opacity-40"
                    title="Өшіру"
                  >
                    {actionId === user._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 ? <p className="p-6 text-center text-sm text-muted">Қолданушы табылмады</p> : null}
    </div>
  );
}

function PhotosTable({
  actionId,
  items,
  onDelete,
  onUpdate
}: {
  actionId: string;
  items: Photo[];
  onDelete: (photoId: string) => void;
  onUpdate: (photoId: string, updates: Pick<Photo, "isPrivate" | "isPopular">) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Фото</th>
              <th className="px-4 py-3 font-semibold">Автор</th>
              <th className="px-4 py-3 font-semibold">Күйі</th>
              <th className="px-4 py-3 font-semibold">Статистика</th>
              <th className="px-4 py-3 font-semibold">Жүктелді</th>
              <th className="px-4 py-3 text-right font-semibold">Әрекет</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((photo) => (
              <tr key={photo._id} className="align-middle">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/photo/${photo._id}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
                      {photo.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo.thumbnailUrl} alt={photo.caption} className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff size={18} className="m-4 text-muted" />
                      )}
                    </Link>
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-semibold text-text">{photo.caption || "Сипаттама жоқ"}</p>
                      <p className="line-clamp-1 text-xs text-muted">{photo.location || photo.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/profile/${photo.author.username}`} className="font-medium text-text hover:text-primary">
                    @{photo.author.username}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionId === photo._id}
                      onClick={() => onUpdate(photo._id, { isPrivate: !photo.isPrivate })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      {photo.isPrivate ? <EyeOff size={14} /> : <Eye size={14} />}
                      {photo.isPrivate ? "Жабық" : "Ашық"}
                    </button>
                    <button
                      type="button"
                      disabled={actionId === photo._id}
                      onClick={() => onUpdate(photo._id, { isPopular: !photo.isPopular })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                        photo.isPopular ? "bg-primary/10 text-primary" : "border border-border text-muted hover:border-primary"
                      }`}
                    >
                      Танымал
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {photo.likesCount} like · {photo.commentsCount} пікір · {photo.views ?? 0} қаралым
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(photo.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={actionId === photo._id}
                    onClick={() => onDelete(photo._id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger transition hover:bg-danger/10 disabled:opacity-40"
                    title="Өшіру"
                  >
                    {actionId === photo._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 ? <p className="p-6 text-center text-sm text-muted">Фото табылмады</p> : null}
    </div>
  );
}

function ReportsTable({
  actionId,
  items,
  onStatusChange
}: {
  actionId: string;
  items: PhotoReport[];
  onStatusChange: (reportId: string, status: PhotoReport["status"]) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-border bg-bg text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Фото</th>
              <th className="px-4 py-3 font-semibold">Шағымданушы</th>
              <th className="px-4 py-3 font-semibold">Себеп</th>
              <th className="px-4 py-3 font-semibold">Күйі</th>
              <th className="px-4 py-3 font-semibold">Күні</th>
              <th className="px-4 py-3 text-right font-semibold">Әрекет</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((report) => (
              <tr key={report._id} className="align-middle">
                <td className="px-4 py-3">
                  {report.photo ? (
                    <div className="flex items-center gap-3">
                      <Link href={`/photo/${report.photo._id}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
                        {report.photo.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={report.photo.thumbnailUrl} alt={report.photo.caption} className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff size={18} className="m-4 text-muted" />
                        )}
                      </Link>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-semibold text-text">{report.photo.caption || "Сипаттама жоқ"}</p>
                        <p className="text-xs text-muted">@{report.photo.author.username}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted">Фото өшірілген</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/profile/${report.reporter.username}`} className="font-medium text-text hover:text-primary">
                    @{report.reporter.username}
                  </Link>
                </td>
                <td className="max-w-xs px-4 py-3 text-muted">
                  <p className="line-clamp-3">{report.reason}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    report.status === "OPEN"
                      ? "bg-danger/10 text-danger"
                      : report.status === "REVIEWED"
                        ? "bg-primary/10 text-primary"
                        : "bg-bg text-muted"
                  }`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(report.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={actionId === report._id}
                      onClick={() => onStatusChange(report._id, "REVIEWED")}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary transition hover:border-primary disabled:opacity-40"
                    >
                      Қаралды
                    </button>
                    <button
                      type="button"
                      disabled={actionId === report._id}
                      onClick={() => onStatusChange(report._id, "DISMISSED")}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary disabled:opacity-40"
                    >
                      Қабылдамау
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 ? <p className="p-6 text-center text-sm text-muted">Шағым табылмады</p> : null}
    </div>
  );
}
