import { expect, test } from "vitest";

// Infrastructure smoke test only; this does not validate application behavior.
test("runs TypeScript tests in the Node environment", () => {
  const values: number[] = [1, 2, 3];
  expect(values.reduce((total, value) => total + value, 0)).toBe(6);
  expect(typeof process.versions.node).toBe("string");
});
