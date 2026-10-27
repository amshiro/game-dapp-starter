import { createServerI18next } from "next-i18next/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createI18nConfig } from "./config";
import { defaultLocale, resolveLocale, supportedLocales } from "./locale";

// Fixture namespaces only; real copy belongs to its owner's resources.
const resources = {
  en: {
    fixture: { label: "Fixture label", blank: "", nested: { title: "Nested" } },
    other: { onlyHere: "Other owner" },
  },
};

function getT(ns: "fixture" | "other", lng: string = resolveLocale()) {
  // Created outside any request: passing lng must not touch cookies()/headers().
  return createServerI18next(createI18nConfig(resources)).getT(ns, { lng });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("locale policy", () => {
  test("resolves the same supported default on every call", () => {
    expect(supportedLocales).toContain(defaultLocale);
    expect(resolveLocale()).toBe(defaultLocale);
    expect(resolveLocale()).toBe(resolveLocale());
  });

  test("configures i18next from the central locale list without locale routing", () => {
    const config = createI18nConfig(resources);
    expect(config.supportedLngs).toEqual([...supportedLocales]);
    expect(config.fallbackLng).toBe(defaultLocale);
    expect(config.ns).toEqual(["fixture", "other"]);
    expect(config.localeInPath).toBe(false);
  });
});

describe("server translation", () => {
  test("translates supported locale resources and reports the resolved locale", async () => {
    const { t, lng } = await getT("fixture");
    expect(lng).toBe(defaultLocale);
    expect(t("label")).toBe("Fixture label");
    expect(t("nested.title")).toBe("Nested");
  });

  test("unsupported locale falls back to the default resources", async () => {
    const { t } = await getT("fixture", "zh-CN");
    expect(t("label")).toBe("Fixture label");
  });

  test("missing key renders its key, never an empty string, and is reported", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { t } = await getT("fixture");
    expect(t("absent")).toBe("absent");
    expect(error).toHaveBeenCalledWith(
      "[i18n] missing translation fixture:absent (en)",
    );
  });

  test("empty resource value counts as missing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { t } = await getT("fixture");
    expect(t("blank")).toBe("blank");
    expect(error).toHaveBeenCalledWith(
      "[i18n] missing translation fixture:blank (en)",
    );
  });

  test("keys do not silently resolve from another owner's namespace", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { t } = await getT("fixture");
    expect(t("onlyHere")).toBe("onlyHere");
    expect(error).toHaveBeenCalledOnce();
  });
});
