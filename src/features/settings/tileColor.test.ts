import { describe, expect, test } from "vitest";
import {
  DEFAULT_TILE_COLOR,
  isTileColorTransparent,
  normalizeTileColor,
  tileColorAlpha,
  tileColorHex6,
  TRANSPARENT_TILE_COLOR,
} from "./tileColor";

describe("tile color settings", () => {
  test("normalizes full and shorthand hex colors", () => {
    expect(normalizeTileColor("#ABCDEF")).toBe("#abcdef");
    expect(normalizeTileColor("abc")).toBe("#aabbcc");
  });

  test("normalizes 8-digit hex colors with alpha", () => {
    expect(normalizeTileColor("#f6f3ec80")).toBe("#f6f3ec80");
    expect(normalizeTileColor("F6F3EC80")).toBe("#f6f3ec80");
  });

  test("recognizes the transparent keyword", () => {
    expect(normalizeTileColor("transparent")).toBe(TRANSPARENT_TILE_COLOR);
    expect(isTileColorTransparent(TRANSPARENT_TILE_COLOR)).toBe(true);
    expect(isTileColorTransparent("#f6f3ec")).toBe(false);
  });

  test("extracts alpha from tile colors", () => {
    expect(tileColorAlpha("#f6f3ec")).toBe(1);
    expect(tileColorAlpha("#f6f3ec80")).toBeCloseTo(0.502, 2);
    expect(tileColorAlpha("#f6f3ec00")).toBe(0);
    expect(tileColorAlpha("#f6f3ecff")).toBe(1);
    expect(tileColorAlpha(TRANSPARENT_TILE_COLOR)).toBe(0);
  });

  test("extracts 6-digit hex from tile colors", () => {
    expect(tileColorHex6("#f6f3ec80")).toBe("#f6f3ec");
    expect(tileColorHex6("#abcdef")).toBe("#abcdef");
    expect(tileColorHex6(TRANSPARENT_TILE_COLOR)).toBe("#000000");
  });

  test("falls back to the default tile color for invalid values", () => {
    expect(DEFAULT_TILE_COLOR).toBe("#f6f3ec");
    expect(normalizeTileColor("")).toBe(DEFAULT_TILE_COLOR);
    expect(normalizeTileColor("#12zz99")).toBe(DEFAULT_TILE_COLOR);
  });
});
