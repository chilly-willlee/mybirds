import { describe, it, expect } from "vitest";
import { milesToKm, kmToMiles } from "../geo";

describe("milesToKm", () => {
  it("converts miles to km", () => {
    expect(milesToKm(25)).toBeCloseTo(40.2335, 2);
    expect(milesToKm(1)).toBeCloseTo(1.60934, 4);
    expect(milesToKm(0)).toBe(0);
  });
});

describe("kmToMiles", () => {
  it("converts km to miles", () => {
    expect(kmToMiles(50)).toBeCloseTo(31.0686, 2);
    expect(kmToMiles(1.60934)).toBeCloseTo(1, 4);
    expect(kmToMiles(0)).toBe(0);
  });

  it("round-trips with milesToKm", () => {
    expect(kmToMiles(milesToKm(10))).toBeCloseTo(10, 8);
    expect(milesToKm(kmToMiles(50))).toBeCloseTo(50, 8);
  });
});
