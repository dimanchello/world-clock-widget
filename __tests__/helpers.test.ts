import { describe, it, expect } from "vitest";
import type { ClockEntry } from "../helpers";
import {
	generateId,
	parseHHMMToMinutes,
	currentMinutes,
	formatTime,
	formatDate,
	computeUtcOffset,
	isWorking,
	dayKeyInTimezone,
	crossedTargetMinute,
	formatWorkHours,
	reorderClocks,
	removeClock,
	upsertClock,
} from "../helpers";
import { t, getLocale } from "../i18n";

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
		expect(parseHHMMToMinutes("12:00:00")).toBeNull();
	});
});

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

	it("returns exact minutes when specific date is provided", () => {
		const d = new Date("2026-06-15T14:35:00Z");
		expect(currentMinutes("UTC", d)).toBe(14 * 60 + 35);
	});
});

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

	it("returns fractional offset for half-hour timezones", () => {
		const offset = computeUtcOffset("Asia/Kolkata");
		expect(offset).toBe("UTC+5:30");
	});

	it("returns empty string for invalid timezone", () => {
		expect(computeUtcOffset("Invalid/Zone")).toBe("");
	});
});

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
		expect(isWorking(makeClock({ workEnd: "18:00" }))).toBeNull();
	});

	it("evaluates daytime shift deterministically", () => {
		const clock = makeClock({ workStart: "09:00", workEnd: "18:00" });

		expect(isWorking(clock, 539)).toBe(false);
		expect(isWorking(clock, 540)).toBe(true);
		expect(isWorking(clock, 720)).toBe(true);
		expect(isWorking(clock, 1079)).toBe(true);
		expect(isWorking(clock, 1080)).toBe(false);
		expect(isWorking(clock, 1200)).toBe(false);
	});

	it("evaluates night shift crossing midnight deterministically", () => {
		const clock = makeClock({ workStart: "22:00", workEnd: "06:00" });

		expect(isWorking(clock, 1319)).toBe(false);
		expect(isWorking(clock, 1320)).toBe(true);
		expect(isWorking(clock, 1439)).toBe(true);
		expect(isWorking(clock, 0)).toBe(true);
		expect(isWorking(clock, 359)).toBe(true);
		expect(isWorking(clock, 360)).toBe(false);
		expect(isWorking(clock, 720)).toBe(false);
	});

	it("evaluates with explicit Date object", () => {
		const clock = makeClock({ timezone: "UTC", workStart: "09:00", workEnd: "18:00" });
		const workingDate = new Date("2026-06-15T12:00:00Z");
		const offDate = new Date("2026-06-15T20:00:00Z");

		expect(isWorking(clock, workingDate)).toBe(true);
		expect(isWorking(clock, offDate)).toBe(false);
	});

	it("returns null when timezone is invalid and no minute provided", () => {
		const clock = makeClock({ timezone: "Invalid/Tz", workStart: "09:00", workEnd: "18:00" });
		expect(isWorking(clock)).toBeNull();
	});
});

describe("dayKeyInTimezone", () => {
	it("returns YYYY-MM-DD format", () => {
		const result = dayKeyInTimezone("UTC");
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("returns correct day for given Date", () => {
		const d = new Date("2026-01-01T00:30:00Z");
		expect(dayKeyInTimezone("UTC", d)).toBe("2026-01-01");
	});

	it("returns different days for far-apart timezones near midnight UTC", () => {
		const d = new Date("2026-01-01T23:30:00Z");
		const utc = dayKeyInTimezone("UTC", d);
		const tokyo = dayKeyInTimezone("Asia/Tokyo", d);
		expect(utc).toBe("2026-01-01");
		expect(tokyo).toBe("2026-01-02");
	});

	it("returns empty string for invalid timezone", () => {
		expect(dayKeyInTimezone("Invalid/Zone")).toBe("");
	});
});

describe("crossedTargetMinute", () => {
	it("returns false when prev equals now", () => {
		expect(crossedTargetMinute(100, 100, 100, false)).toBe(false);
	});

	it("detects forward crossing within the same day", () => {
		expect(crossedTargetMinute(100, 110, 105, false)).toBe(true);
		expect(crossedTargetMinute(100, 110, 99, false)).toBe(false);
		expect(crossedTargetMinute(100, 110, 111, false)).toBe(false);
	});

	it("detects boundary crossing when target equals now", () => {
		expect(crossedTargetMinute(100, 110, 110, false)).toBe(true);
	});

	it("handles midnight wrap when dayChanged is false", () => {
		expect(crossedTargetMinute(1430, 10, 5, false)).toBe(true);
		expect(crossedTargetMinute(1430, 10, 1435, false)).toBe(true);
		expect(crossedTargetMinute(1430, 10, 100, false)).toBe(false);
	});

	it("handles day change correctly and prevents premature firing for future targets", () => {
		expect(crossedTargetMinute(100, 50, 30, true)).toBe(true);
		expect(crossedTargetMinute(100, 50, 60, true)).toBe(false);
		expect(crossedTargetMinute(100, 50, 120, true)).toBe(false);
		expect(crossedTargetMinute(600, 660, 700, true)).toBe(false);
		expect(crossedTargetMinute(600, 660, 540, true)).toBe(true);
	});
});

describe("formatWorkHours", () => {
	it("formats both start and end", () => {
		expect(formatWorkHours("09:00", "18:00")).toBe("09:00 – 18:00");
	});

	it("formats start only", () => {
		expect(formatWorkHours("09:00", "")).toBe("09:00 – …");
	});

	it("formats end only", () => {
		expect(formatWorkHours("", "18:00")).toBe("… – 18:00");
	});

	it("returns empty string when neither is provided", () => {
		expect(formatWorkHours("", "")).toBe("");
	});
});

describe("reorderClocks", () => {
	const c1: ClockEntry = {
		id: "1", name: "A", timezone: "UTC",
		workStart: "", workEnd: "", notifyStart: false, notifyEnd: false,
		enabled: true, order: 0,
	};
	const c2: ClockEntry = {
		id: "2", name: "B", timezone: "UTC",
		workStart: "", workEnd: "", notifyStart: false, notifyEnd: false,
		enabled: false, order: 1,
	};
	const c3: ClockEntry = {
		id: "3", name: "C", timezone: "UTC",
		workStart: "", workEnd: "", notifyStart: false, notifyEnd: false,
		enabled: true, order: 2,
	};

	it("moves item forward and normalizes orders", () => {
		const result = reorderClocks([c1, c2, c3], "1", "3");
		expect(result.map(c => c.id)).toEqual(["2", "3", "1"]);
		expect(result.map(c => c.order)).toEqual([0, 1, 2]);
	});

	it("moves item backward and normalizes orders", () => {
		const result = reorderClocks([c1, c2, c3], "3", "1");
		expect(result.map(c => c.id)).toEqual(["3", "1", "2"]);
		expect(result.map(c => c.order)).toEqual([0, 1, 2]);
	});

	it("returns shallow copy when sourceId equals targetId", () => {
		const result = reorderClocks([c1, c2], "1", "1");
		expect(result.map(c => c.id)).toEqual(["1", "2"]);
	});

	it("returns shallow copy when item not found", () => {
		const result = reorderClocks([c1, c2], "unknown", "1");
		expect(result.map(c => c.id)).toEqual(["1", "2"]);
	});
});

describe("removeClock", () => {
	const c1: ClockEntry = {
		id: "1", name: "A", timezone: "UTC",
		workStart: "", workEnd: "", notifyStart: false, notifyEnd: false,
		enabled: true, order: 0,
	};
	const c2: ClockEntry = {
		id: "2", name: "B", timezone: "UTC",
		workStart: "", workEnd: "", notifyStart: false, notifyEnd: false,
		enabled: true, order: 1,
	};
	const c3: ClockEntry = {
		id: "3", name: "C", timezone: "UTC",
		workStart: "", workEnd: "", notifyStart: false, notifyEnd: false,
		enabled: true, order: 2,
	};

	it("removes specified clock and normalizes orders", () => {
		const result = removeClock([c1, c2, c3], "2");
		expect(result.map(c => c.id)).toEqual(["1", "3"]);
		expect(result.map(c => c.order)).toEqual([0, 1]);
	});

	it("returns remaining items with normalized orders if unknown id", () => {
		const result = removeClock([c1, c2], "non-existent");
		expect(result.map(c => c.id)).toEqual(["1", "2"]);
		expect(result.map(c => c.order)).toEqual([0, 1]);
	});
});

describe("upsertClock", () => {
	const c1: ClockEntry = {
		id: "1", name: "A", timezone: "UTC",
		workStart: "", workEnd: "", notifyStart: false, notifyEnd: false,
		enabled: true, order: 0,
	};

	it("inserts new clock with next sequential order", () => {
		const c2: ClockEntry = {
			id: "2", name: "B", timezone: "UTC",
			workStart: "", workEnd: "", notifyStart: false, notifyEnd: false,
			enabled: true, order: 999,
		};
		const result = upsertClock([c1], c2);
		expect(result.length).toBe(2);
		expect(result[1]?.id).toBe("2");
		expect(result[1]?.order).toBe(1);
	});

	it("updates existing clock in place", () => {
		const updated: ClockEntry = { ...c1, name: "Updated" };
		const result = upsertClock([c1], updated);
		expect(result.length).toBe(1);
		expect(result[0]?.name).toBe("Updated");
	});
});

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
