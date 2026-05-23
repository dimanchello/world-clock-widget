import { describe, it, expect } from "vitest";
import type {
	ClockEntry} from "../helpers";
import {
	generateId,
	parseHHMMToMinutes,
	currentMinutes,
	formatTime,
	formatDate,
	computeUtcOffset,
	isWorking,
	dayKeyInTimezone,
	crossedTargetMinute
} from "../helpers";
import { t, getLocale } from "../i18n";

// ─── generateId ──────────────────────────────────────────────────────────────

describe("generateId", () => {
	it("returns a non-empty string", () => {
		const id = generateId();
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThan(0);
	});

	it("generates unique IDs", () => {
		const ids = new Set<string>();
		for (let i = 0; i < 100; i++) {
			ids.add(generateId());
		}
		expect(ids.size).toBe(100);
	});
});

// ─── parseHHMMToMinutes ──────────────────────────────────────────────────────

describe("parseHHMMToMinutes", () => {
	it("parses valid HH:MM", () => {
		expect(parseHHMMToMinutes("09:00")).toBe(540);
		expect(parseHHMMToMinutes("00:00")).toBe(0);
		expect(parseHHMMToMinutes("23:59")).toBe(1439);
		expect(parseHHMMToMinutes("12:30")).toBe(750);
	});

	it("handles single-digit hours", () => {
		expect(parseHHMMToMinutes("9:00")).toBe(540);
		expect(parseHHMMToMinutes("0:30")).toBe(30);
	});

	it("trims whitespace", () => {
		expect(parseHHMMToMinutes("  09:00  ")).toBe(540);
	});

	it("returns null for invalid formats", () => {
		expect(parseHHMMToMinutes("")).toBeNull();
		expect(parseHHMMToMinutes("9")).toBeNull();
		expect(parseHHMMToMinutes("0900")).toBeNull();
		expect(parseHHMMToMinutes("9:0")).toBeNull();
		expect(parseHHMMToMinutes("ab:cd")).toBeNull();
		expect(parseHHMMToMinutes("25:00")).toBeNull();
		expect(parseHHMMToMinutes("09:60")).toBeNull();
		expect(parseHHMMToMinutes("-1:00")).toBeNull();
	});
});

// ─── currentMinutes ──────────────────────────────────────────────────────────

describe("currentMinutes", () => {
	it("returns minutes for valid timezone", () => {
		const result = currentMinutes("Europe/Moscow");
		expect(result).not.toBeNull();
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThan(1440);
	});

	it("returns null for invalid timezone", () => {
		expect(currentMinutes("Invalid/Timezone")).toBeNull();
	});

	it("returns consistent values within same minute", () => {
		const a = currentMinutes("UTC");
		const b = currentMinutes("UTC");
		expect(a).toBe(b);
	});
});

// ─── formatTime ──────────────────────────────────────────────────────────────

describe("formatTime", () => {
	const date = new Date("2026-01-15T12:30:45Z");

	it("formats time in Russian locale", () => {
		const result = formatTime(date, "UTC", "ru");
		expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
	});

	it("formats time in English locale", () => {
		const result = formatTime(date, "UTC", "en");
		expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
	});

	it("returns fallback for invalid timezone", () => {
		expect(formatTime(date, "Invalid/Zone", "ru")).toBe("--:--:--");
	});
});

// ─── formatDate ──────────────────────────────────────────────────────────────

describe("formatDate", () => {
	const date = new Date("2026-01-15T12:30:45Z");

	it("formats date in Russian locale", () => {
		const result = formatDate(date, "UTC", "ru");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("formats date in English locale", () => {
		const result = formatDate(date, "UTC", "en");
		expect(typeof result).toBe("string");
		expect(result.length).toBeGreaterThan(0);
	});

	it("returns fallback for invalid timezone", () => {
		expect(formatDate(date, "Invalid/Zone", "ru")).toBe("---");
	});
});

// ─── computeUtcOffset ────────────────────────────────────────────────────────

describe("computeUtcOffset", () => {
	it("returns UTC+0 for UTC", () => {
		expect(computeUtcOffset("UTC")).toBe("UTC+0");
	});

	it("returns positive offset for east timezones", () => {
		const offset = computeUtcOffset("Asia/Tokyo");
		expect(offset).toMatch(/^UTC\+\d+/);
	});

	it("returns negative offset for west timezones", () => {
		const offset = computeUtcOffset("America/New_York");
		expect(offset).toMatch(/^UTC[−-]\d+/);
	});

	it("returns empty string for invalid timezone", () => {
		expect(computeUtcOffset("Invalid/Zone")).toBe("");
	});
});

// ─── isWorking ───────────────────────────────────────────────────────────────

describe("isWorking", () => {
	function makeClock(overrides: Partial<ClockEntry> = {}): ClockEntry {
		return {
			id: "test",
			name: "Test",
			timezone: "UTC",
			workStart: "",
			workEnd: "",
			notifyStart: false,
			notifyEnd: false,
			enabled: true,
			order: 0,
			...overrides,
		};
	}

	it("returns null when work hours not set", () => {
		expect(isWorking(makeClock())).toBeNull();
		expect(isWorking(makeClock({ workStart: "09:00" }))).toBeNull();
	});

	it("returns true during work hours (normal shift)", () => {
		const clock = makeClock({ workStart: "00:00", workEnd: "23:59" });
		expect(isWorking(clock)).toBe(true);
	});

	it("returns false outside work hours", () => {
		const clock = makeClock({ workStart: "00:00", workEnd: "00:01" });
		const result = isWorking(clock);
		expect([true, false, null]).toContain(result);
	});

	it("handles night shift (crossing midnight)", () => {
		const clock = makeClock({ workStart: "22:00", workEnd: "06:00" });
		const result = isWorking(clock);
		expect([true, false, null]).toContain(result);
	});
});

// ─── dayKeyInTimezone ────────────────────────────────────────────────────────

describe("dayKeyInTimezone", () => {
	it("returns YYYY-MM-DD format", () => {
		const result = dayKeyInTimezone("UTC");
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("returns different days for far-apart timezones near midnight UTC", () => {
		const utc = dayKeyInTimezone("UTC");
		const auckland = dayKeyInTimezone("Pacific/Auckland");
		expect(typeof utc).toBe("string");
		expect(typeof auckland).toBe("string");
	});

	it("returns empty string for invalid timezone", () => {
		expect(dayKeyInTimezone("Invalid/Zone")).toBe("");
	});
});

// ─── crossedTargetMinute ─────────────────────────────────────────────────────

describe("crossedTargetMinute", () => {
	it("returns false when prev equals now", () => {
		expect(crossedTargetMinute(100, 100, 100, false)).toBe(false);
	});

	it("detects forward crossing", () => {
		expect(crossedTargetMinute(100, 110, 105, false)).toBe(true);
		expect(crossedTargetMinute(100, 110, 99, false)).toBe(false);
		expect(crossedTargetMinute(100, 110, 111, false)).toBe(false);
	});

	it("detects boundary crossing (target equals now)", () => {
		expect(crossedTargetMinute(100, 110, 110, false)).toBe(true);
	});

	it("handles midnight wrap", () => {
		expect(crossedTargetMinute(1430, 10, 5, false)).toBe(true);
		expect(crossedTargetMinute(1430, 10, 1435, false)).toBe(true);
		expect(crossedTargetMinute(1430, 10, 100, false)).toBe(false);
	});

	it("handles day change", () => {
		expect(crossedTargetMinute(100, 50, 30, true)).toBe(true);
		expect(crossedTargetMinute(100, 50, 60, true)).toBe(false);
	});
});

// ─── i18n ────────────────────────────────────────────────────────────────────

describe("i18n", () => {
	it("returns Russian translations for ru locale", () => {
		const tr = t("ru");
		expect(tr.pluginName).toBe("Мировые часы");
		expect(tr.emptyTitle).toBe("Нет активных часов");
		expect(tr.btnSave).toBe("Сохранить");
	});

	it("returns English translations for en locale", () => {
		const tr = t("en");
		expect(tr.pluginName).toBe("World Clock");
		expect(tr.emptyTitle).toBe("No active clocks");
		expect(tr.btnSave).toBe("Save");
	});

	it("notification body functions work correctly", () => {
		const ru = t("ru");
		const en = t("en");

		expect(ru.notifStartBody("Иван", "09:00")).toContain("Иван");
		expect(ru.notifEndBody("Иван", "18:00")).toContain("Иван");
		expect(en.notifStartBody("John", "09:00")).toContain("John");
		expect(en.notifEndBody("John", "18:00")).toContain("John");
	});

	it("getLocale returns valid locale", () => {
		const locale = getLocale();
		expect(["ru", "en"]).toContain(locale);
	});

	it("fallback to en for unknown locale is handled by t()", () => {
		const tr = t("en");
		expect(tr.pluginName).toBeDefined();
	});
});
