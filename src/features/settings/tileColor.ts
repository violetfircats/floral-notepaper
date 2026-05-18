import type { TileColorMode } from "./types";

export const DEFAULT_TILE_COLOR = "#f6f3ec";
export const SYSTEM_TILE_COLOR_LIGHT = "#f6f3ec";
export const SYSTEM_TILE_COLOR_DARK = "#191919";
export const TRANSPARENT_TILE_COLOR = "transparent";

const FULL_HEX_COLOR = /^#?([0-9a-fA-F]{6})$/;
const SHORT_HEX_COLOR = /^#?([0-9a-fA-F]{3})$/;
const HEX8_COLOR = /^#?([0-9a-fA-F]{8})$/;

export function normalizeTileColor(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";

  if (trimmed === TRANSPARENT_TILE_COLOR) return TRANSPARENT_TILE_COLOR;

  const hex8Match = trimmed.match(HEX8_COLOR);
  if (hex8Match) {
    return `#${hex8Match[1].toLowerCase()}`;
  }

  const fullMatch = trimmed.match(FULL_HEX_COLOR);
  if (fullMatch) {
    return `#${fullMatch[1].toLowerCase()}`;
  }

  const shortMatch = trimmed.match(SHORT_HEX_COLOR);
  if (shortMatch) {
    return `#${shortMatch[1]
      .split("")
      .map((character) => character + character)
      .join("")
      .toLowerCase()}`;
  }

  return DEFAULT_TILE_COLOR;
}

export function isTileColorTransparent(value: string): boolean {
  return value === TRANSPARENT_TILE_COLOR;
}

export function tileColorAlpha(value: string): number {
  if (value === TRANSPARENT_TILE_COLOR) return 0;
  if (value.length === 9) {
    // 8-digit hex: #RRGGBBAA
    const alphaHex = value.slice(7);
    return parseInt(alphaHex, 16) / 255;
  }
  return 1;
}

export function tileColorHex6(value: string): string {
  if (value === TRANSPARENT_TILE_COLOR) return "#000000";
  return value.length >= 7 ? value.slice(0, 7) : value;
}

export function resolveSystemTileColor(): string {
  if (typeof document === "undefined") return SYSTEM_TILE_COLOR_LIGHT;
  const theme = document.documentElement.getAttribute("data-theme");
  return theme === "dark" ? SYSTEM_TILE_COLOR_DARK : SYSTEM_TILE_COLOR_LIGHT;
}

export function resolveTileColor(
  mode: TileColorMode,
  customColor: string,
): string {
  return mode === "system"
    ? resolveSystemTileColor()
    : normalizeTileColor(customColor);
}
