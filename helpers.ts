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

export function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function parseHHMMToMinutes(value: string): number | null {
	const m = value.trim().match(/^(\d{1,2}):(\d{2})$/);
	if (!m) {return null;}

	const h = Number(m[1]);
	const min = Number(m[2]);
	if (!Number.isInteger(h) || !Number.isInteger(min)) {return null;}
	if (h < 0 || h > 23 || min < 0 || min > 59) {return null;}

	return h * 60 + min;
}

export function currentMinutes(timezone: string): number | null {
	try {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		}).formatToParts(new Date());

		const hourPart = parts.find(p => p.type === "hour")?.value;
		const minutePart = parts.find(p => p.type === "minute")?.value;
		if (!hourPart || !minutePart) {return null;}

		const h = Number(hourPart);
		const m = Number(minutePart);
		if (!Number.isInteger(h) || !Number.isInteger(m)) {return null;}

		return h * 60 + m;
	} catch {
		return null;
	}
}

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
	} catch { return "--:--:--"; }
}

export function formatDate(date: Date, timezone: string, locale: Locale): string {
	try {
		const localeTag = locale === "ru" ? "ru-RU" : "en-US";
		return new Intl.DateTimeFormat(localeTag, {
			timeZone: timezone,
			weekday: "short",
			day: "numeric",
			month: "short",
		}).format(date);
	} catch { return "---"; }
}

export function computeUtcOffset(timezone: string): string {
	try {
		const now = new Date();
		const fmt: Intl.DateTimeFormatOptions = {
			year: "numeric", month: "2-digit", day: "2-digit",
			hour: "2-digit", minute: "2-digit",
			hourCycle: "h23",
		};
		const toEpoch = (tz: string): number => {
			const parts = new Intl.DateTimeFormat("en-US", { ...fmt, timeZone: tz }).formatToParts(now);
			const g = (type: string): number => Number(parts.find(x => x.type === type)?.value ?? "0");
			return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), 0, 0);
		};
		const diffMin = Math.round((toEpoch(timezone) - toEpoch("UTC")) / 60000);
		const sign = diffMin >= 0 ? "+" : "−";
		const abs  = Math.abs(diffMin);
		const h    = Math.floor(abs / 60);
		const m    = abs % 60;
		return `UTC${sign}${h}${m > 0 ? ":" + String(m).padStart(2, "0") : ""}`;
	} catch { return ""; }
}

export function isWorking(clock: ClockEntry): boolean | null {
	if (!clock.workStart || !clock.workEnd) {return null;}
	try {
		const cur = currentMinutes(clock.timezone);
		const start = parseHHMMToMinutes(clock.workStart);
		const end = parseHHMMToMinutes(clock.workEnd);
		if (cur === null || start === null || end === null) {return null;}

		return end >= start
			? cur >= start && cur < end
			: cur >= start || cur < end;
	} catch { return null; }
}

export function dayKeyInTimezone(timezone: string): string {
	try {
		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).formatToParts(new Date());

		const year = parts.find(p => p.type === "year")?.value;
		const month = parts.find(p => p.type === "month")?.value;
		const day = parts.find(p => p.type === "day")?.value;
		if (!year || !month || !day) {return "";}

		return `${year}-${month}-${day}`;
	} catch {
		return "";
	}
}

export function crossedTargetMinute(prev: number, now: number, target: number, dayChanged: boolean): boolean {
	if (prev === now) {return false;}
	if (dayChanged) {
		return target > prev || target <= now;
	}

	if (now > prev) {return target > prev && target <= now;}

	return target > prev || target <= now;
}
