import type { Locale } from "./i18n";

export interface ClockEntry {
	id: string;
	name: string;
	timezone: string;
	workStart: string;
	workEnd: string;
	notifyStart: boolean;
	notifyEnd: boolean;
	enabled: boolean;
	order: number;
}

/**
 * Generates a unique identifier string.
 */
export function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Parses a "HH:MM" string into minutes since midnight (0-1439).
 */
export function parseHHMMToMinutes(value: string): number | null {
	const m = value.trim().match(/^(\d{1,2}):(\d{2})$/);
	if (!m) {
		return null;
	}

	const h = Number(m[1]);
	const min = Number(m[2]);
	if (!Number.isInteger(h) || !Number.isInteger(min)) {
		return null;
	}
	if (h < 0 || h > 23 || min < 0 || min > 59) {
		return null;
	}

	return h * 60 + min;
}

/**
 * Returns current minutes since midnight in the given timezone.
 */
export function currentMinutes(timezone: string, date: Date = new Date()): number | null {
	try {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		}).formatToParts(date);

		const hourPart = parts.find(p => p.type === "hour")?.value;
		const minutePart = parts.find(p => p.type === "minute")?.value;
		if (!hourPart || !minutePart) {
			return null;
		}

		const h = Number(hourPart);
		const m = Number(minutePart);
		if (!Number.isInteger(h) || !Number.isInteger(m)) {
			return null;
		}

		return (h % 24) * 60 + m;
	} catch {
		return null;
	}
}

/**
 * Formats time as HH:MM:SS for the specified timezone and locale.
 */
export function formatTime(date: Date, timezone: string, locale: Locale): string {
	try {
		const localeTag = locale === "ru" ? "ru-RU" : "en-US";
		return new Intl.DateTimeFormat(localeTag, {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		}).format(date);
	} catch {
		return "--:--:--";
	}
}

/**
 * Formats date as weekday and day-month for the specified timezone and locale.
 */
export function formatDate(date: Date, timezone: string, locale: Locale): string {
	try {
		const localeTag = locale === "ru" ? "ru-RU" : "en-US";
		return new Intl.DateTimeFormat(localeTag, {
			timeZone: timezone,
			weekday: "short",
			day: "numeric",
			month: "short",
		}).format(date);
	} catch {
		return "---";
	}
}

/**
 * Computes human-readable UTC offset string (e.g. UTC+3, UTC−5, UTC+5:30).
 */
export function computeUtcOffset(timezone: string, date: Date = new Date()): string {
	try {
		const fmt: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		};
		const toEpoch = (tz: string): number => {
			const parts = new Intl.DateTimeFormat("en-US", { ...fmt, timeZone: tz }).formatToParts(date);
			const g = (type: string): number => Number(parts.find(x => x.type === type)?.value ?? "0");
			return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), 0, 0);
		};
		const diffMin = Math.round((toEpoch(timezone) - toEpoch("UTC")) / 60000);
		const sign = diffMin >= 0 ? "+" : "−";
		const abs = Math.abs(diffMin);
		const h = Math.floor(abs / 60);
		const m = abs % 60;
		return `UTC${sign}${h}${m > 0 ? ":" + String(m).padStart(2, "0") : ""}`;
	} catch {
		return "";
	}
}

/**
 * Determines whether the clock's work hours are currently active.
 */
export function isWorking(clock: ClockEntry, dateOrMinutes?: Date | number | null): boolean | null {
	if (!clock.workStart || !clock.workEnd) {
		return null;
	}
	try {
		let cur: number | null = null;
		if (typeof dateOrMinutes === "number") {
			cur = dateOrMinutes;
		} else if (dateOrMinutes instanceof Date) {
			cur = currentMinutes(clock.timezone, dateOrMinutes);
		} else {
			cur = currentMinutes(clock.timezone);
		}

		const start = parseHHMMToMinutes(clock.workStart);
		const end = parseHHMMToMinutes(clock.workEnd);
		if (cur === null || start === null || end === null) {
			return null;
		}

		return end >= start
			? cur >= start && cur < end
			: cur >= start || cur < end;
	} catch {
		return null;
	}
}

/**
 * Returns date in YYYY-MM-DD format for the given timezone.
 */
export function dayKeyInTimezone(timezone: string, date: Date = new Date()): string {
	try {
		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).formatToParts(date);

		const year = parts.find(p => p.type === "year")?.value;
		const month = parts.find(p => p.type === "month")?.value;
		const day = parts.find(p => p.type === "day")?.value;
		if (!year || !month || !day) {
			return "";
		}

		return `${year}-${month}-${day}`;
	} catch {
		return "";
	}
}

/**
 * Checks whether the clock crossed the target minute between previous and current check.
 */
export function crossedTargetMinute(prev: number, now: number, target: number, dayChanged: boolean): boolean {
	if (prev === now) {
		return false;
	}

	if (dayChanged) {
		return target <= now;
	}

	if (now > prev) {
		return target > prev && target <= now;
	}

	return target > prev || target <= now;
}

/**
 * Formats a display label for work hours.
 */
export function formatWorkHours(workStart: string, workEnd: string): string {
	if (workStart && workEnd) {
		return `${workStart} – ${workEnd}`;
	}
	if (workStart) {
		return `${workStart} – …`;
	}
	if (workEnd) {
		return `… – ${workEnd}`;
	}
	return "";
}

/**
 * Reorders clocks and re-indexes all entries sequentially starting at 0.
 */
export function reorderClocks(
	clocks: readonly ClockEntry[],
	sourceId: string,
	targetId: string,
): ClockEntry[] {
	if (sourceId === targetId) {
		return [...clocks];
	}

	const sorted = [...clocks].sort((a, b) => a.order - b.order);
	const sourceIndex = sorted.findIndex(c => c.id === sourceId);
	const targetIndex = sorted.findIndex(c => c.id === targetId);

	if (sourceIndex === -1 || targetIndex === -1) {
		return [...clocks];
	}

	const [moved] = sorted.splice(sourceIndex, 1);
	sorted.splice(targetIndex, 0, moved);

	return sorted.map((clock, index) => ({
		...clock,
		order: index,
	}));
}

/**
 * Removes a clock by id and normalizes order indices.
 */
export function removeClock(
	clocks: readonly ClockEntry[],
	clockId: string,
): ClockEntry[] {
	return clocks
		.filter(c => c.id !== clockId)
		.sort((a, b) => a.order - b.order)
		.map((clock, index) => ({
			...clock,
			order: index,
		}));
}

/**
 * Inserts or updates a clock entry in the list, preserving normalized orders.
 */
export function upsertClock(
	clocks: readonly ClockEntry[],
	clock: ClockEntry,
): ClockEntry[] {
	const index = clocks.findIndex(c => c.id === clock.id);
	if (index === -1) {
		return [...clocks, { ...clock, order: clocks.length }];
	}
	const updated = [...clocks];
	updated[index] = clock;
	return updated;
}
