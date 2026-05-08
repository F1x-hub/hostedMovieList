import { Timestamp } from 'firebase/firestore'

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserStats {
  totalRatings: number
  averageRating: number
}

export interface UserDoc {
  userId: string
  displayName: string
  firstName: string
  lastName: string
  username: string
  usernameLower: string
  photoURL: string
  photoPath: string
  email: string
  stats: UserStats
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Collections ─────────────────────────────────────────────────────────────

export interface CollectionDoc {
  id: string
  title: string
  description: string
  coverUrl: string
  isPublic: boolean
  movies: Array<string | number>
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

export interface RatingDoc {
  userId: string
  userName: string
  userPhoto: string
  movieId: number | string
  movieTitle?: string
  posterPath?: string
  releaseYear?: number
  genres?: string[]
  kpRating?: number
  imdbRating?: number
  description?: string
  rating: number
  comment: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Watchlist / Watching / Favorites ────────────────────────────────────────

export type WatchlistType = 'watchlist' | 'watching' | 'favorites'

export interface WatchlistDoc {
  userId: string
  movieId: number | string
  movieTitle: string
  movieTitleRu: string
  posterPath: string
  releaseYear: number
  genres: string[]
  description: string
  kpRating: number
  imdbRating: number
  createdAt: Timestamp
  updatedAt: Timestamp
  movedFrom?: string
}

// ─── Movies (Kinopoisk cache) ─────────────────────────────────────────────────

export interface MovieDoc {
  [key: string]: unknown
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export interface RecordDoc {
  title: string
  content: string
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ReportDoc {
  text: string
  photoUrl: string
  photoPath: string
  status: string
  userId: string
  pageUrl: string
  createdAt: Timestamp
}

// ─── Kinopoisk API ───────────────────────────────────────────────────────────

export interface KinopoiskGenre {
  name: string
}

export interface KinopoiskCountry {
  name: string
}

export interface KinopoiskRating {
  kp?: number
  imdb?: number
  filmCritics?: number
  russianFilmCritics?: number
  await?: number
}

export interface KinopoiskVotes {
  kp?: number
  imdb?: number
  filmCritics?: number
  russianFilmCritics?: number
  await?: number
}

export interface KinopoiskPoster {
  url?: string
  previewUrl?: string
}

export interface KinopoiskMovie {
  id: number
  name?: string
  alternativeName?: string
  enName?: string
  type?: string
  year?: number
  description?: string
  shortDescription?: string
  rating?: KinopoiskRating
  votes?: KinopoiskVotes
  movieLength?: number
  genres?: KinopoiskGenre[]
  countries?: KinopoiskCountry[]
  poster?: KinopoiskPoster
  ageRating?: number
  top250?: number
  isSeries?: boolean
  totalSeriesLength?: number
}

export interface KinopoiskSearchResponse {
  docs: KinopoiskMovie[]
  total: number
  limit: number
  page: number
  pages: number
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc'
