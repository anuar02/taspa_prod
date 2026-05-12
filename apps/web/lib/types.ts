export type Author = {
  _id?: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
};

export type UserRole = "USER" | "ADMIN";

export type Photo = {
  _id: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  tags: string[];
  category: string;
  location: string;
  likesCount: number;
  commentsCount: number;
  saves?: string[];
  likes?: string[];
  isPrivate?: boolean;
  isPopular?: boolean;
  views?: number;
  createdAt?: string;
  author: Author;
};

export type UserProfile = {
  _id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  email?: string;
  role?: UserRole;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

export type Comment = {
  _id: string;
  text: string;
  likes?: string[];
  createdAt: string;
  author: Author;
};

export type Collection = {
  _id: string;
  title: string;
  description?: string;
  photos: Photo[];
  createdAt?: string;
  updatedAt?: string;
};

export type PhotoReport = {
  _id: string;
  photo: Photo | null;
  reporter: Author;
  reason: string;
  status: "OPEN" | "REVIEWED" | "DISMISSED";
  createdAt: string;
};
