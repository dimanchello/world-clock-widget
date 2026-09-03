import { describe, it, expect, beforeEach } from "vitest";
import type { ClockEntry } from "../helpers";
import { NotificationManager } from "../notifications";

describe("NotificationManager", () => {
	let manager: NotificationManager;

	const baseClock: ClockEntry = {
		id: "clock-1",
		name: "Alice",
		timezone: "UTC",
		workStart: "09:00",
		workEnd: "18:00",
		notifyStart: true,
		notifyEnd: true,
		enabled: true,
		order: 0,
	};

	beforeEach(() => {
		manager = new NotificationManager();
	});

	it("returns empty array for empty clocks list", () => {
		const events = manager.check([], new Date("2026-06-15T09:00:00Z"));
		expect(events).toEqual([]);
	});

	it("does not trigger notifications for disabled clocks", () => {
		const clock = { ...baseClock, enabled: false };
		const events = manager.check([clock], new Date("2026-06-15T09:00:00Z"));
		expect(events).toEqual([]);
	});

	it("does not trigger when notification flags are false", () => {
		const clock = { ...baseClock, notifyStart: false, notifyEnd: false };
		const events = manager.check([clock], new Date("2026-06-15T09:00:00Z"));
		expect(events).toEqual([]);
	});

	it("triggers start notification at exact start time", () => {
		const events = manager.check([baseClock], new Date("2026-06-15T09:00:00Z"));
		expect(events.length).toBe(1);
		expect(events[0]?.type).toBe("start");
		expect(events[0]?.time).toBe("09:00");
		expect(events[0]?.clock.id).toBe("clock-1");
		expect(manager.getFiredDay("clock-1", "start")).toBe("2026-06-15");
	});

	it("triggers end notification at exact end time", () => {
		const events = manager.check([baseClock], new Date("2026-06-15T18:00:00Z"));
		expect(events.length).toBe(1);
		expect(events[0]?.type).toBe("end");
		expect(events[0]?.time).toBe("18:00");
		expect(manager.getFiredDay("clock-1", "end")).toBe("2026-06-15");
	});

	it("deduplicates notifications on the same day", () => {
		const first = manager.check([baseClock], new Date("2026-06-15T09:00:00Z"));
		expect(first.length).toBe(1);

		const second = manager.check([baseClock], new Date("2026-06-15T09:00:30Z"));
		expect(second.length).toBe(0);

		const third = manager.check([baseClock], new Date("2026-06-15T09:01:00Z"));
		expect(third.length).toBe(0);
	});

	it("triggers notification when crossing target minute in consecutive ticks", () => {
		manager.check([baseClock], new Date("2026-06-15T08:59:50Z"));
		const events = manager.check([baseClock], new Date("2026-06-15T09:00:15Z"));
		expect(events.length).toBe(1);
		expect(events[0]?.type).toBe("start");
	});

	it("fires again on the next day after midnight rollover", () => {
		const day1 = manager.check([baseClock], new Date("2026-06-15T09:00:00Z"));
		expect(day1.length).toBe(1);

		const day2 = manager.check([baseClock], new Date("2026-06-16T09:00:00Z"));
		expect(day2.length).toBe(1);
		expect(manager.getFiredDay("clock-1", "start")).toBe("2026-06-16");
	});

	it("does not fire prematurely when waking up on a new day before target time", () => {
		manager.check([baseClock], new Date("2026-06-15T10:00:00Z"));
		const events = manager.check([baseClock], new Date("2026-06-16T08:30:00Z"));
		expect(events.length).toBe(0);
	});

	it("clears clock state with clearClock allowing re-trigger", () => {
		manager.check([baseClock], new Date("2026-06-15T09:00:00Z"));
		expect(manager.getFiredDay("clock-1", "start")).toBe("2026-06-15");

		manager.clearClock("clock-1");
		expect(manager.getFiredDay("clock-1", "start")).toBeUndefined();
		expect(manager.getLastSeen("clock-1")).toBeUndefined();

		const retrigger = manager.check([baseClock], new Date("2026-06-15T09:00:00Z"));
		expect(retrigger.length).toBe(1);
	});

	it("clears all state with clearAll", () => {
		manager.check([baseClock], new Date("2026-06-15T09:00:00Z"));
		manager.clearAll();
		expect(manager.getFiredDay("clock-1", "start")).toBeUndefined();
	});

	it("handles invalid work time strings gracefully", () => {
		const clock = { ...baseClock, workStart: "invalid-time" };
		const events = manager.check([clock], new Date("2026-06-15T09:00:00Z"));
		expect(events.length).toBe(0);
	});

	it("handles invalid timezone gracefully", () => {
		const clock = { ...baseClock, timezone: "Invalid/Zone" };
		const events = manager.check([clock], new Date("2026-06-15T09:00:00Z"));
		expect(events.length).toBe(0);
	});
});
