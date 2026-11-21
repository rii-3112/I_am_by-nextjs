export const PAGE_W = 1.34;
export const PAGE_H = 1.9;
export const COVER_W = PAGE_W + 0.055;
export const COVER_H = PAGE_H + 0.06;

export const LEAF_COUNT = 4;

export function viewCenterZ(narrow: boolean) {
  return narrow ? 1.45 : 0;
}
