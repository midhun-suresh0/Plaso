export const PLASO_INTERESTS = [
  'Food',
  'Shopping',
  'Sports',
  'Technology',
  'Travel',
  'Fitness',
  'Entertainment',
  'Education',
  'Local Events',
  'Music',
  'Art & Design',
  'Gaming',
  'Books & Literature',
  'Pets',
  'Photography',
] as const;

export type Interest = typeof PLASO_INTERESTS[number];
