// App configuration constants
export const APP_CONFIG = {
  APP_NAME: 'SoundCheck',
  VERSION: '1.0.0',
  MIN_PASSWORD_LENGTH: 8,
  MAX_TITLE_LENGTH: 100,
  MAX_NOTE_LENGTH: 500,
  DEBOUNCE_DELAY: 300,
} as const;

// Date/Time formats
export const DATE_FORMATS = {
  SHORT_DATE: 'MMM d, yyyy',
  LONG_DATE: 'EEEE, MMMM d, yyyy',
  TIME_12H: 'h:mm a',
  TIME_24H: 'HH:mm',
  DATETIME: 'MMM d, yyyy h:mm a',
} as const;

// Animation durations
export const ANIMATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Screen names for navigation
export const SCREENS = {
  TABS: {
    REHEARSAL: 'index',
    PRACTICE: 'practice',
    GIGS: 'gigs',
  },
  MODALS: {
    ADD_REHEARSAL: 'add-rehearsal',
    ADD_PRACTICE: 'add-practice',
    ADD_GIG: 'add-gig',
    EDIT_REHEARSAL: 'edit-rehearsal',
    EDIT_PRACTICE: 'edit-practice',
    EDIT_GIG: 'edit-gig',
  },
} as const;

// Practice categories
export const PRACTICE_CATEGORIES = [
  'Technique',
  'Repertoire',
  'Theory',
  'Ear Training',
  'Sight Reading',
  'Improvisation',
  'Performance',
  'Other',
] as const;

// Gig status
export const GIG_STATUS = {
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
} as const;