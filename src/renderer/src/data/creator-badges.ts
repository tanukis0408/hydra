export type CreatorBadge = {
  accent?: string;
  label?: string;
  iconUrl?: string;
};

export type CreatorBadgeMap = Record<string, CreatorBadge>;

export const localCreatorBadges: CreatorBadgeMap = {
  Bj2k7W9y: {
    accent: "#f00070",
    label: "#Monster Inc",
  },
};
