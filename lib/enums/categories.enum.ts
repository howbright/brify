export enum Category {
  HEALTH_WELLNESS = 'health_wellness',
  SELF_IMPROVEMENT = 'self_improvement',
  FINANCE = 'finance',
  LIFESTYLE = 'lifestyle',
  HOBBY = 'hobby',
  DIGITAL_TREND = 'digital_trend',
  POLITICS = 'politics',
  RELIGION = 'religion',
  ART = 'art',                   // 예술 (미술, 음악, 문학, 공연예술 등)
  PURE_SCIENCE = 'pure_science', // 순수학문 (수학, 이론물리, 철학-비종교, 역사학 등)
  LAW_PUBLIC_ADMIN = 'law_public_admin',
  OTHER = 'other',
}

// 카테고리별 색상 맵핑
export const categoryColors: Record<Category, string> = {
  [Category.HEALTH_WELLNESS]: "bg-green-500",
  [Category.SELF_IMPROVEMENT]: "bg-blue-500",
  [Category.FINANCE]: "bg-yellow-500",
  [Category.LIFESTYLE]: "bg-pink-500",
  [Category.HOBBY]: "bg-purple-500",
  [Category.DIGITAL_TREND]: "bg-indigo-500",
  [Category.POLITICS]: "bg-red-500",
  [Category.RELIGION]: "bg-orange-500",
  [Category.ART]: "bg-fuchsia-500",
  [Category.PURE_SCIENCE]: "bg-cyan-500",
  [Category.LAW_PUBLIC_ADMIN]: "bg-teal-500",
  [Category.OTHER]: "bg-gray-500",
};