# TASPA — Photo Social Network
## Product Requirements Document (PRD)
> Используй этот документ как основу для Codex/Claude Code. Читай секции по порядку.

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 14+ |
| Styling | Tailwind CSS | 3.x |
| State | Zustand | 4.x |
| Backend | Node.js + Express | 20 LTS |
| Database | MongoDB + Mongoose | 7.x |
| Auth | JWT (access + refresh tokens) | — |
| File Storage | Cloudinary | free tier |
| Real-time | Socket.io | 4.x |
| Language | Казахский (kk-KZ) | — |

---

## 2. Структура проекта (Monorepo)

```
taspa/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (main)/
│   │   │   │   ├── layout.tsx      # Bottom nav wrapper
│   │   │   │   ├── feed/page.tsx
│   │   │   │   ├── search/page.tsx
│   │   │   │   ├── upload/page.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── [username]/page.tsx
│   │   │   │   └── photo/
│   │   │   │       └── [id]/page.tsx
│   │   │   └── splash/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # Кнопки, инпуты, модалки
│   │   │   ├── photo/              # PhotoCard, PhotoGrid, PhotoDetail
│   │   │   ├── auth/               # LoginForm, RegisterForm
│   │   │   └── layout/             # BottomNav, TopBar
│   │   ├── lib/
│   │   │   ├── api.ts              # axios instance + interceptors
│   │   │   └── socket.ts           # Socket.io client
│   │   └── store/
│   │       ├── authStore.ts
│   │       └── feedStore.ts
│   │
│   └── api/                        # Express backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── photo.routes.ts
│       │   │   ├── user.routes.ts
│       │   │   ├── comment.routes.ts
│       │   │   └── search.routes.ts
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   └── upload.middleware.ts   # multer + cloudinary
│       │   ├── services/
│       │   │   ├── cloudinary.service.ts
│       │   │   └── socket.service.ts
│       │   └── app.ts
│       └── package.json
├── package.json                    # root (workspaces)
└── .env.example
```

---

## 3. MongoDB Schemas

### User
```typescript
{
  _id: ObjectId,
  username: string,           // unique, @handle
  email: string,              // unique
  password: string,           // bcrypt hash
  displayName: string,        // "Сан Арыс"
  bio: string,
  avatarUrl: string,          // cloudinary url
  followers: ObjectId[],      // ref: User
  following: ObjectId[],      // ref: User
  postsCount: number,
  followersCount: number,
  followingCount: number,
  refreshToken: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Photo
```typescript
{
  _id: ObjectId,
  author: ObjectId,           // ref: User
  imageUrl: string,           // cloudinary url
  thumbnailUrl: string,       // cloudinary transformation
  caption: string,
  tags: string[],             // ["#табиғат", "#менреңк"]
  category: string,           // enum: NATURE | PORTRAIT | CITY | ART | FOOD | OTHER
  location: string,
  likes: ObjectId[],          // ref: User
  likesCount: number,
  commentsCount: number,
  saves: ObjectId[],          // ref: User
  views: number,
  isPopular: boolean,         // computed: likesCount > threshold
  createdAt: Date,
  updatedAt: Date
}
```

### Comment
```typescript
{
  _id: ObjectId,
  photo: ObjectId,            // ref: Photo
  author: ObjectId,           // ref: User
  text: string,
  likes: ObjectId[],
  parentComment: ObjectId,    // null = top-level, else reply
  createdAt: Date
}
```

### Notification
```typescript
{
  _id: ObjectId,
  recipient: ObjectId,        // ref: User
  sender: ObjectId,           // ref: User
  type: string,               // enum: LIKE | COMMENT | FOLLOW | SAVE
  photo: ObjectId,            // ref: Photo (optional)
  isRead: boolean,
  createdAt: Date
}
```

---

## 4. API Endpoints

### Auth `/api/auth`
```
POST   /register          body: { username, email, password, displayName }
POST   /login             body: { email, password }
POST   /refresh           body: { refreshToken }
POST   /logout            body: { refreshToken }
GET    /me                headers: Authorization: Bearer <token>
```

### Photos `/api/photos`
```
GET    /                  query: ?tab=all|popular|following&page=1&limit=12
GET    /:id               — детальная страница фото
POST   /                  multipart/form-data: image, caption, tags, category, location
DELETE /:id               — только автор
POST   /:id/like          — toggle лайк
POST   /:id/save          — toggle сохранение
GET    /saved             — сохранённые текущего юзера
GET    /popular           — isPopular=true
```

### Comments `/api/comments`
```
GET    /photo/:photoId    query: ?page=1&limit=20
POST   /photo/:photoId    body: { text, parentComment? }
DELETE /:commentId
POST   /:commentId/like   — toggle лайк комментария
```

### Users `/api/users`
```
GET    /:username         — публичный профиль
GET    /:username/photos  query: ?page=1&limit=12
POST   /:username/follow  — toggle подписки
GET    /suggestions       — рекомендуемые пользователи
```

### Search `/api/search`
```
GET    /                  query: ?q=текст&type=photo|user|tag&page=1
GET    /categories        — список категорий с превью
GET    /trending          — популярные теги
```

---

## 5. Экраны → Компоненты (из Figma)

### Splash (`/splash`)
- Логотип TASPA по центру
- Слоган: "Әр сурет — бір тарих"
- Кнопка "Тіркелу" → `/register`
- Кнопка "Кіру" → `/login`

### Регистрация (`/register`)
- Поля: Аты-Жөні, Email, Password
- Чекбокс: согласие с условиями
- Кнопка "Жасақтау"
- Ссылка "Кіру" → `/login`
- Валидация: email format, password min 8 chars

### Вход (`/login`)
- Поля: Email, Password
- Toggle видимости пароля
- Ссылка "Құпиясөзді ұмыттыңыз бе?"
- Кнопка "Кіру"

### Лента (`/feed`) — главный экран
- Табы: **Барлығы** | **Танымал** | **Ұйымшан**
    - Барлығы = все фото по дате
    - Танымал = isPopular=true
    - Ұйымшан = фото от тех, на кого подписан
- Masonry grid 2 колонки
- Infinite scroll (IntersectionObserver)
- Каждая карточка: фото, лайк, сохранение

### Детальное фото (`/photo/[id]`)
- Полноэкранное фото
- Аватар + имя автора + кнопка Follow
- Лайк (с анимацией) + Сохранить + Поделиться
- Подпись и теги
- Секция комментариев (10 первых + "Показать ещё")
- Инпут добавления комментария

### Поиск (`/search`)
- Поисковая строка
- Без запроса: сетка категорий (природа, портрет, город...)
- С запросом: результаты фото/пользователей

### Загрузка (`/upload`)
- Drag & drop или выбор файла
- Preview загруженного фото
- Поля: Подпись, Теги (#), Категория (select), Локация
- Кнопка "Жүктеу"

### Профиль (`/profile/[username]`)
- Аватар + displayName + username
- Статистика: Posts | Followers | Following
- Bio
- Кнопка Follow/Unfollow (если чужой)
- Tabbed grid: Посты | Сохранённые
- Masonry grid

### Bottom Navigation (везде в main layout)
- 🏠 Басты бет (feed)
- 🔍 Іздеу (search)
- ➕ Жүктеу (upload)
- 🤍 Сохранённые
- 👤 Профиль

---

## 6. Дизайн-токены

```css
/* Цвета из Figma */
--primary: #7C3AED;          /* фиолетовый — кнопки, акценты */
--primary-light: #A78BFA;
--bg: #FFFFFF;
--surface: #F9FAFB;
--text-primary: #111827;
--text-secondary: #6B7280;
--border: #E5E7EB;
--danger: #EF4444;

/* Типографика */
font-family: 'Inter', sans-serif;
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;

/* Радиусы */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-full: 9999px;
```

---

## 7. ENV переменные

### `/apps/api/.env`
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

### `/apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## 8. Socket.io Events

```typescript
// Клиент → Сервер
socket.emit('join', userId)
socket.emit('leave', userId)

// Сервер → Клиент
socket.on('notification', { type, sender, photo })  // новое уведомление
socket.on('like_updated', { photoId, likesCount })  // обновление лайков
```

---

## 9. Cloudinary — трансформации

```typescript
// При загрузке фото — генерируй два URL:
imageUrl:     `https://res.cloudinary.com/.../upload/q_auto,f_auto/${publicId}`
thumbnailUrl: `https://res.cloudinary.com/.../upload/w_400,h_400,c_fill,q_auto/${publicId}`

// Аватар
avatarUrl:    `https://res.cloudinary.com/.../upload/w_150,h_150,c_fill,r_max/${publicId}`
```

---

## 10. Промпты для Codex

### Промпт 1 — Инициализация проекта
```
Create a monorepo named "taspa" with two apps:
1. apps/api — Express + TypeScript + Mongoose backend
2. apps/web — Next.js 14 App Router + TypeScript + Tailwind CSS frontend

Root package.json with npm workspaces. Both apps should have their own package.json.
Install all dependencies listed in the PRD tech stack.
Create folder structure exactly as specified in section 2 of the PRD.
Create .env.example files for both apps.
```

### Промпт 2 — MongoDB Models
```
Based on these schemas (paste section 3), create Mongoose models with TypeScript interfaces:
- User.model.ts
- Photo.model.ts  
- Comment.model.ts
- Notification.model.ts

Add indexes: User.email (unique), User.username (unique), Photo.author, Photo.tags, Photo.category, Photo.createdAt desc.
```

### Промпт 3 — Auth Backend
```
Create Express auth routes for /api/auth with these endpoints (paste section 4 auth part).
Use bcrypt for password hashing, jsonwebtoken for JWT.
Implement access token (15m) + refresh token (7d) pattern.
Store refreshToken in User document.
Create auth middleware that validates Bearer token.
```

### Промпт 4 — Photo Backend
```
Create Express photo routes for /api/photos (paste section 4 photos part).
Use multer for file upload, then upload to Cloudinary using the transformation strategy in section 9.
Implement pagination with mongoose .skip().limit().
Toggle like/save should add/remove userId from array and update count fields.
```

### Промпт 5 — Next.js Auth Pages
```
Create Next.js pages for /login and /register using Tailwind CSS.
Design should match: purple primary button (#7C3AED), clean white background, rounded inputs.
Use react-hook-form for form handling, axios for API calls.
On success login: store tokens in httpOnly cookie via API response, redirect to /feed.
Language: Kazakh (use text from section 5).
```

### Промпт 6 — Feed Page
```
Create Next.js /feed page with:
- Three tabs: Барлығы | Танымал | Ұйымшан
- Masonry grid 2 columns using CSS columns
- PhotoCard component: image, like button, save button
- Infinite scroll using IntersectionObserver
- API call to GET /api/photos?tab=all&page=1&limit=12
```

### Промпт 7 — Profile Page
```
Create Next.js /profile/[username] page with:
- User stats header (posts, followers, following)
- Follow/Unfollow button toggle
- Photo grid with saved/posts tabs
- Fetch from GET /api/users/:username and /api/users/:username/photos
```

---

## 11. Порядок разработки (итерации)

```
Итерация 1 (Codex):
  ✅ Monorepo setup + структура папок
  ✅ MongoDB models
  ✅ Auth backend (register, login, refresh)
  ✅ Basic Express app с CORS, helmet

Итерация 2 (Codex):
  ✅ Photo CRUD + Cloudinary upload
  ✅ Like/Save toggles
  ✅ Comments CRUD
  ✅ User profile endpoints

Итерация 3 (Codex):
  ✅ Next.js Splash + Auth pages
  ✅ Feed page + PhotoCard
  ✅ Zustand authStore

Итерация 4 (Claude Code):
  🔧 Photo detail page + comments
  🔧 Upload page с preview
  🔧 Profile page
  🔧 Search page + категории

Итерация 5 (Claude Code):
  🔧 Socket.io интеграция
  🔧 Notifications
  🔧 Оптимизации (image lazy load, pagination)
  🔧 Баги и полировка UI
```

---

## 12. Деплой (опционально)

```
Frontend: Vercel (бесплатно, Next.js native)
Backend:  Railway или Render (бесплатный tier)
Database: MongoDB Atlas (бесплатный M0 512MB)
Storage:  Cloudinary (бесплатный 25GB)

Итого стоимость MVP: $0/месяц
```
