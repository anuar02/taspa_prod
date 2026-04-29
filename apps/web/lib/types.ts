export type Author = {
  _id?: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
};

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
  author: Author;
};

export type UserProfile = {
  _id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
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
