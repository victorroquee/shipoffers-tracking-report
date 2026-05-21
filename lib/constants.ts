// Centralized constants — single source of truth for status, colors, and ranking

export type TrackingStatus =
  | 'PENDING' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY'
  | 'DELIVERED' | 'EXCEPTION' | 'UNKNOWN'

// Status rank for preventing downgrades (e.g. IN_TRANSIT → UNKNOWN)
export const STATUS_RANK: Record<string, number> = {
  UNKNOWN: 0,
  PENDING: 1,
  IN_TRANSIT: 2,
  EXCEPTION: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
}

// 17track credit limits
// IMPORTANT: Only /register costs credits (1 per code). /gettrackinfo is FREE.
export const REGISTER_BUDGET = 500  // Max new codes to register per sync (production)

// Smart polling: query frequency based on days in transit
// gettrackinfo is free, but we avoid unnecessary load
export const POLLING_INTERVALS: { maxDays: number; intervalHours: number }[] = [
  { maxDays: 3,  intervalHours: 72 },   // 0-3 days: every 3 days (too early for updates)
  { maxDays: 7,  intervalHours: 48 },   // 4-7 days: every 2 days
  { maxDays: 14, intervalHours: 12 },   // 8-14 days: twice a day (critical window)
  { maxDays: 30, intervalHours: 12 },   // 15-30 days: twice a day (delayed, needs monitoring)
  { maxDays: Infinity, intervalHours: 168 }, // 30+ days: weekly (likely lost)
]

// Max codes per tracking query batch (17track API limit is 40)
export const TRACK_BATCH_SIZE = 40

// Flag images CDN (flagcdn.com — free, Cloudflare-backed, no API key)
export const FLAG_CDN_URL = 'https://flagcdn.com/w20'

// Design system colors
export const COLORS = {
  danger:  '#C92A2A',
  warning: '#B45309',
  success: '#0D6330',
  info:    '#1D4ED8',
  muted:   '#9299A8',
  text:    '#0C0E13',
  textSecondary: '#4A5165',
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8F9FB',
  bgTertiary: '#F0F2F5',
  border: '#E5E8EE',
  dangerBg: '#FFF0F0',
  warningBg: '#FFFBEB',
  successBg: '#EDFAF3',
  infoBg: '#EFF6FF',
} as const
