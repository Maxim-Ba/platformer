import type { SkillCategory, SkillNodeDef, SkillTreeDefinition } from '@domain/types/SkillTree';

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  physical: 'Физические',
  energy: 'Энергетические',
  magical: 'Магические',
};

const SKILL_CATEGORIES: readonly SkillCategory[] = ['physical', 'energy', 'magical'];

const PHYSICAL_LABELS = ['Удар I', 'Сила', 'Блок', 'Рывок', 'Стойка', 'Парир.', 'Крит', 'Тяж. уд.', 'Контр.', 'Берсерк'];
const ENERGY_LABELS = ['Импульс', 'Заряд', 'Щит Э', 'Всплеск', 'Поток', 'Разряд', 'Луч I', 'Луч II', 'Волна', 'Взрыв'];
const MAGICAL_LABELS = ['Искра', 'Огонь', 'Лёд', 'Жар', 'Мороз', 'Молния', 'Огненный шар', 'Ледяной клинок', 'Цепь', 'Метеор'];

const PHYSICAL_DESCRIPTIONS = [
  'Базовая физическая атака ближнего боя.',
  'Усиливает урон от физических ударов.',
  'Снижает получаемый урон на короткое время.',
  'Рывок к цели с небольшим уроном.',
  'Устойчивая стойка: меньше отбрасывания.',
  'Шанс отразить ближнюю атаку.',
  'Повышенный шанс критического удара.',
  'Медленный, но мощный удар.',
  'Контратака после успешного парирования.',
  'Временный прирост урона и скорости атаки.',
];
const ENERGY_DESCRIPTIONS = [
  'Базовый энергетический импульс.',
  'Накапливает заряд для следующей способности.',
  'Энергетический щит поглощает урон.',
  'Всплеск энергии по области вокруг героя.',
  'Ускоряет восстановление энергии.',
  'Разряд по ближайшему врагу.',
  'Направленный энергетический луч.',
  'Усиленный луч с пробиванием целей.',
  'Энергетическая волна по линии.',
  'Мощный взрыв в точке прицеливания.',
];
const MAGICAL_DESCRIPTIONS = [
  'Базовое магическое заклинание.',
  'Поджигает цель периодическим уроном.',
  'Замедляет и ослабляет врага льдом.',
  'Усиливает огненные эффекты.',
  'Накладывает глубокое замедление.',
  'Мгновенный удар молнии по цели.',
  'Классический огненный снаряд.',
  'Ледяной удар с шансом заморозки.',
  'Молния перескакивает между врагами.',
  'Призыв метеора на большую область.',
];

const CATEGORY_LABEL_SETS: Record<SkillCategory, readonly string[]> = {
  physical: PHYSICAL_LABELS,
  energy: ENERGY_LABELS,
  magical: MAGICAL_LABELS,
};

const CATEGORY_DESCRIPTION_SETS: Record<SkillCategory, readonly string[]> = {
  physical: PHYSICAL_DESCRIPTIONS,
  energy: ENERGY_DESCRIPTIONS,
  magical: MAGICAL_DESCRIPTIONS,
};

function createTreeNodes(category: SkillCategory): SkillNodeDef[] {
  const labels = CATEGORY_LABEL_SETS[category];
  const descriptions = CATEGORY_DESCRIPTION_SETS[category];
  const prefix = category;

  const id = (level: number, index: number): string => `${prefix}-l${level}-${index}`;

  const getFlatIndex = (level: number, index: number): number => {
    if (level === 1) return 0;
    if (level === 2) return 1 + index;
    if (level === 3) return 3 + index;
    return 6 + index;
  };

  const node = (level: 1 | 2 | 3 | 4, index: number, parentId: string | null, childIds: string[]): SkillNodeDef => ({
    id: id(level, index),
    label: labels[getFlatIndex(level, index)]!,
    description: descriptions[getFlatIndex(level, index)]!,
    level,
    parentId,
    childIds,
  });

  return [
    node(1, 0, null, [id(2, 0), id(2, 1)]),
    node(2, 0, id(1, 0), [id(3, 0), id(3, 1)]),
    node(2, 1, id(1, 0), [id(3, 2)]),
    node(3, 0, id(2, 0), [id(4, 0), id(4, 1)]),
    node(3, 1, id(2, 0), [id(4, 2)]),
    node(3, 2, id(2, 1), [id(4, 3)]),
    node(4, 0, id(3, 0), []),
    node(4, 1, id(3, 0), []),
    node(4, 2, id(3, 1), []),
    node(4, 3, id(3, 2), []),
  ];
}

export const SKILL_TREES: readonly SkillTreeDefinition[] = SKILL_CATEGORIES.map((category) => ({
  category,
  label: SKILL_CATEGORY_LABELS[category],
  nodes: createTreeNodes(category),
}));

/** Корни каждого дерева открыты изначально. */
export const MOCK_DEFAULT_UNLOCKED_NODE_IDS: readonly string[] = SKILL_TREES.flatMap((tree) =>
  tree.nodes.filter((node) => node.level === 1).map((node) => node.id),
);

/** Mock-очки для изучения скилов (общий пул на все деревья). */
export const MOCK_DEFAULT_SKILL_POINTS = 4;

/** Демо loadout пустой — игрок выбирает после изучения. */
export const MOCK_DEFAULT_SELECTED_NODE_IDS: readonly string[] = [];

export function getSkillNodeLabel(nodeId: string): string {
  for (const tree of SKILL_TREES) {
    const node = tree.nodes.find((entry) => entry.id === nodeId);
    if (node) {
      return node.label;
    }
  }

  return nodeId;
}

export function findSkillNode(nodeId: string): SkillNodeDef | undefined {
  for (const tree of SKILL_TREES) {
    const node = tree.nodes.find((entry) => entry.id === nodeId);
    if (node) {
      return node;
    }
  }

  return undefined;
}
