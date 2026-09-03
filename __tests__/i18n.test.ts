import { describe, it, expect } from "vitest";
import type { Locale, Translations } from "../i18n";
import { t, getLocale } from "../i18n";

describe("i18n translations parity and content", () => {
	const ru = t("ru");
	const en = t("en");

	it("has all matching keys in Russian and English translations", () => {
		const ruKeys = Object.keys(ru).sort();
		const enKeys = Object.keys(en).sort();
		expect(ruKeys).toEqual(enKeys);
	});

	it("ensures all string properties are non-empty", () => {
		const keys = Object.keys(ru) as (keyof Translations)[];
		for (const key of keys) {
			const ruVal = ru[key];
			const enVal = en[key];

			if (typeof ruVal === "string") {
				expect(ruVal.trim().length).toBeGreaterThan(0);
			}
			if (typeof enVal === "string") {
				expect(enVal.trim().length).toBeGreaterThan(0);
			}
		}
	});

	it("formats notification messages correctly", () => {
		expect(ru.notifStartBody("Анна", "10:00")).toBe("🟢 Анна начинает рабочий день (10:00)");
		expect(ru.notifEndBody("Анна", "19:00")).toBe("🔴 Анна заканчивает рабочий день (19:00)");

		expect(en.notifStartBody("Anna", "10:00")).toBe("🟢 Anna starts work day (10:00)");
		expect(en.notifEndBody("Anna", "19:00")).toBe("🔴 Anna ends work day (19:00)");
	});

	it("falls back to English for unknown locale", () => {
		const fallback = t("de" as unknown as Locale);
		expect(fallback.pluginName).toBe(en.pluginName);
	});

	it("returns a valid locale from getLocale()", () => {
		const loc = getLocale();
		expect(["ru", "en"]).toContain(loc);
	});
});
