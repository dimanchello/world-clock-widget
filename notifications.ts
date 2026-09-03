import type { ClockEntry } from "./helpers";
import {
	currentMinutes,
	dayKeyInTimezone,
	parseHHMMToMinutes,
	crossedTargetMinute,
} from "./helpers";

export type NotificationEventType = "start" | "end";

export interface ClockNotificationEvent {
	readonly clock: ClockEntry;
	readonly type: NotificationEventType;
	readonly time: string;
}

export interface ClockLastSeen {
	readonly dayKey: string;
	readonly minute: number;
}

/**
 * Service that evaluates clock notification triggers and tracks delivery states.
 */
export class NotificationManager {
	private readonly fired = new Map<string, string>();
	private readonly lastSeen = new Map<string, ClockLastSeen>();

	clearClock(clockId: string): void {
		this.fired.delete(`${clockId}:start`);
		this.fired.delete(`${clockId}:end`);
		this.lastSeen.delete(clockId);
	}

	clearAll(): void {
		this.fired.clear();
		this.lastSeen.clear();
	}

	getFiredDay(clockId: string, type: NotificationEventType): string | undefined {
		return this.fired.get(`${clockId}:${type}`);
	}

	getLastSeen(clockId: string): ClockLastSeen | undefined {
		return this.lastSeen.get(clockId);
	}

	check(clocks: readonly ClockEntry[], now: Date = new Date()): ClockNotificationEvent[] {
		const events: ClockNotificationEvent[] = [];

		for (const clock of clocks) {
			if (!clock.enabled) {
				continue;
			}
			if (!clock.notifyStart && !clock.notifyEnd) {
				continue;
			}

			const nowMinutes = currentMinutes(clock.timezone, now);
			if (nowMinutes === null) {
				continue;
			}
			const dayKey = dayKeyInTimezone(clock.timezone, now);
			if (!dayKey) {
				continue;
			}

			const last = this.lastSeen.get(clock.id);

			this.checkEvent(clock, "start", clock.workStart, clock.notifyStart, nowMinutes, dayKey, last, events);
			this.checkEvent(clock, "end", clock.workEnd, clock.notifyEnd, nowMinutes, dayKey, last, events);

			this.lastSeen.set(clock.id, { dayKey, minute: nowMinutes });
		}

		return events;
	}

	private checkEvent(
		clock: ClockEntry,
		type: NotificationEventType,
		timeStr: string,
		notifyEnabled: boolean,
		nowMinutes: number,
		dayKey: string,
		last: ClockLastSeen | undefined,
		events: ClockNotificationEvent[],
	): void {
		if (!notifyEnabled || !timeStr) {
			return;
		}

		const targetMinutes = parseHHMMToMinutes(timeStr);
		if (targetMinutes === null) {
			return;
		}

		const shouldTrigger = nowMinutes === targetMinutes || (
			last !== undefined && crossedTargetMinute(last.minute, nowMinutes, targetMinutes, last.dayKey !== dayKey)
		);

		if (!shouldTrigger) {
			return;
		}

		const key = `${clock.id}:${type}`;
		if (this.fired.get(key) === dayKey) {
			return;
		}

		this.fired.set(key, dayKey);
		events.push({ clock, type, time: timeStr });
	}
}
