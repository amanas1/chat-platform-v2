/* ═══ Avatar Configuration Data ═══ */

export interface AvatarConfig {
  gender: 'male' | 'female';
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  beard: string;
  clothes: string;
  accessories: string;
}

export const SKIN_TONES = [
  '#FFCC99', '#FFE0BD', '#F5C5A3', '#D4A373',
  '#C68642', '#8D5524', '#6B3F1F',
];

export const HAIR_STYLES_MALE = [
  { id: 'short', label: 'Короткие' },
  { id: 'medium', label: 'Средние' },
  { id: 'curly', label: 'Кудри' },
  { id: 'afro', label: 'Афро' },
  { id: 'buzz', label: 'Бокс' },
  { id: 'spiky', label: 'Ёжик' },
  { id: 'slickback', label: 'Зачёс назад' },
  { id: 'none', label: 'Лысый' },
];

export const HAIR_STYLES_FEMALE = [
  { id: 'long', label: 'Длинные' },
  { id: 'medium', label: 'Средние' },
  { id: 'curly', label: 'Кудри' },
  { id: 'ponytail', label: 'Хвост' },
  { id: 'bun', label: 'Пучок' },
  { id: 'bob', label: 'Каре' },
  { id: 'pixie', label: 'Пикси' },
  { id: 'braids', label: 'Косы' },
];

export const HAIR_COLORS = [
  '#1C1C1C', '#3B2219', '#4A3728', '#8B6C42',
  '#C4A35A', '#E8C97E', '#B22222', '#D35400',
  '#FF69B4', '#6B6B6B', '#F5F5F5',
];

export const EYES_OPTIONS = [
  { id: 'default', label: 'Обычные' },
  { id: 'happy', label: 'Счастливые' },
  { id: 'squint', label: 'Прищур' },
  { id: 'wink', label: 'Подмигивание' },
  { id: 'closed', label: 'Закрытые' },
  { id: 'surprised', label: 'Удивление' },
  { id: 'hearts', label: 'Сердечки' },
  { id: 'side', label: 'В сторону' },
  { id: 'rolling', label: 'Закатывание' },
  { id: 'cry', label: 'Плачущие' },
  { id: 'dizzy', label: 'Головокружение' },
  { id: 'crazy', label: 'Безумный' },
];

export const EYEBROW_OPTIONS = [
  { id: 'default', label: 'Обычные' },
  { id: 'raised', label: 'Приподнятые' },
  { id: 'angry', label: 'Злые' },
  { id: 'sad', label: 'Грустные' },
  { id: 'unibrow', label: 'Монобровь' },
  { id: 'excited', label: 'Восторженные' },
  { id: 'frown', label: 'Хмурые' },
  { id: 'flat', label: 'Прямые' },
  { id: 'updown', label: 'Вверх-вниз' },
];

export const MOUTH_OPTIONS = [
  { id: 'smile', label: 'Улыбка' },
  { id: 'default', label: 'Обычный' },
  { id: 'open', label: 'Открытый' },
  { id: 'sad', label: 'Грустный' },
  { id: 'serious', label: 'Серьёзный' },
  { id: 'tongue', label: 'Язык' },
  { id: 'smirk', label: 'Ухмылка' },
  { id: 'grimace', label: 'Гримаса' },
  { id: 'scream', label: 'Крик' },
  { id: 'concerned', label: 'Обеспокоенный' },
  { id: 'disbelief', label: 'Недоверие' },
  { id: 'eating', label: 'Жующий' },
];

export const BEARD_OPTIONS = [
  { id: 'none', label: 'Нет' },
  { id: 'stubble', label: 'Щетина' },
  { id: 'short', label: 'Короткая' },
  { id: 'full', label: 'Полная' },
  { id: 'goatee', label: 'Козлиная' },
  { id: 'mustache', label: 'Усы' },
  { id: 'handlebar', label: 'Хэндлбар' },
];

export const CLOTHES_OPTIONS = [
  { id: 'tshirt', label: 'Круглый вырез' },
  { id: 'vneck', label: 'V-образный' },
  { id: 'hoodie', label: 'Худи' },
  { id: 'blazer', label: 'Пиджак и рубашка' },
  { id: 'sweater', label: 'Свитер' },
  { id: 'collar', label: 'Воротник и свитер' },
  { id: 'overall', label: 'Комбинезон' },
  { id: 'graphic', label: 'Футболка с принтом' },
  { id: 'deepv', label: 'Глубокий вырез' },
];

export const ACCESSORY_OPTIONS = [
  { id: 'none', label: 'Нет' },
  { id: 'glasses1', label: 'Очки 1' },
  { id: 'glasses2', label: 'Очки 2' },
  { id: 'round', label: 'Круглые' },
  { id: 'sunglasses', label: 'Солнечные' },
  { id: 'wayfarers', label: 'Вайфареры' },
  { id: 'kurt', label: 'Курт' },
];

export const DEFAULT_MALE: AvatarConfig = {
  gender: 'male', skinTone: '#FFCC99', hairStyle: 'short',
  hairColor: '#3B2219', eyes: 'default', eyebrows: 'default',
  mouth: 'smile', beard: 'none', clothes: 'tshirt', accessories: 'none',
};

export const DEFAULT_FEMALE: AvatarConfig = {
  gender: 'female', skinTone: '#FFE0BD', hairStyle: 'long',
  hairColor: '#4A3728', eyes: 'default', eyebrows: 'default',
  mouth: 'smile', beard: 'none', clothes: 'vneck', accessories: 'none',
};

export const PRESETS: AvatarConfig[] = [
  { gender: 'male', skinTone: '#FFCC99', hairStyle: 'short', hairColor: '#1C1C1C', eyes: 'default', eyebrows: 'default', mouth: 'smile', beard: 'none', clothes: 'blazer', accessories: 'none' },
  { gender: 'male', skinTone: '#D4A373', hairStyle: 'curly', hairColor: '#1C1C1C', eyes: 'squint', eyebrows: 'excited', mouth: 'open', beard: 'full', clothes: 'hoodie', accessories: 'glasses1' },
  { gender: 'male', skinTone: '#8D5524', hairStyle: 'afro', hairColor: '#1C1C1C', eyes: 'happy', eyebrows: 'raised', mouth: 'smile', beard: 'goatee', clothes: 'tshirt', accessories: 'sunglasses' },
  { gender: 'female', skinTone: '#FFE0BD', hairStyle: 'long', hairColor: '#E8C97E', eyes: 'default', eyebrows: 'default', mouth: 'smile', beard: 'none', clothes: 'vneck', accessories: 'none' },
  { gender: 'female', skinTone: '#F5C5A3', hairStyle: 'ponytail', hairColor: '#B22222', eyes: 'happy', eyebrows: 'excited', mouth: 'open', beard: 'none', clothes: 'sweater', accessories: 'round' },
  { gender: 'female', skinTone: '#C68642', hairStyle: 'bob', hairColor: '#1C1C1C', eyes: 'wink', eyebrows: 'raised', mouth: 'smirk', beard: 'none', clothes: 'blazer', accessories: 'wayfarers' },
  { gender: 'male', skinTone: '#FFE0BD', hairStyle: 'spiky', hairColor: '#D35400', eyes: 'surprised', eyebrows: 'raised', mouth: 'open', beard: 'stubble', clothes: 'graphic', accessories: 'kurt' },
  { gender: 'female', skinTone: '#FFCC99', hairStyle: 'bun', hairColor: '#4A3728', eyes: 'side', eyebrows: 'flat', mouth: 'serious', beard: 'none', clothes: 'collar', accessories: 'glasses2' },
  { gender: 'male', skinTone: '#6B3F1F', hairStyle: 'buzz', hairColor: '#1C1C1C', eyes: 'default', eyebrows: 'angry', mouth: 'serious', beard: 'mustache', clothes: 'deepv', accessories: 'none' },
];

export function randomAvatar(gender?: 'male' | 'female'): AvatarConfig {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const g = gender || pick(['male', 'female'] as const);
  const hairStyles = g === 'male' ? HAIR_STYLES_MALE : HAIR_STYLES_FEMALE;
  return {
    gender: g,
    skinTone: pick(SKIN_TONES),
    hairStyle: pick(hairStyles).id,
    hairColor: pick(HAIR_COLORS),
    eyes: pick(EYES_OPTIONS).id,
    eyebrows: pick(EYEBROW_OPTIONS).id,
    mouth: pick(MOUTH_OPTIONS).id,
    beard: g === 'male' ? pick(BEARD_OPTIONS).id : 'none',
    clothes: pick(CLOTHES_OPTIONS).id,
    accessories: pick(ACCESSORY_OPTIONS).id,
  };
}
