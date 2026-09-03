import { describe, it, expect } from "vitest";
import {
	TIMEZONES,
	DEFAULT_TIMEZONE,
	tzGroupLabel,
	tzZoneLabel,
	findTzZone,
} from "../timezones";

describe("timezones catalog", () => {
	it("contains non-empty groups and zones", () => {
		expect(TIMEZONES.length).toBeGreaterThan(0);
		for (const group of TIMEZONES) {
			expect(group.groupRu.length).toBeGreaterThan(0);
			expect(group.groupEn.length).toBeGreaterThan(0);
			expect(group.zones.length).toBeGreaterThan(0);
		}
	});

	it("has unique timezone values across all groups", () => {
		const values = new Set<string>();
		for (const group of TIMEZONES) {
			for (const zone of group.zones) {
				expect(values.has(zone.value)).toBe(false);
				values.add(zone.value);
			}
		}
	});

	it("validates that all timezone values are recognized by Intl", () => {
		for (const group of TIMEZONES) {
			for (const zone of group.zones) {
				expect(() => {
					new Intl.DateTimeFormat("en-US", { timeZone: zone.value });
				}).not.toThrow();
			}
		}
	});

	it("contains DEFAULT_TIMEZONE in the catalog", () => {
		const found = findTzZone(DEFAULT_TIMEZONE);
		expect(found).toBeDefined();
		expect(found?.value).toBe(DEFAULT_TIMEZONE);
	});
});

describe("tzGroupLabel and tzZoneLabel", () => {
	const sampleGroup = TIMEZONES[0];
	const sampleZone = sampleGroup.zones[0];

	it("returns Russian labels for ru locale", () => {
		expect(tzGroupLabel(sampleGroup, "ru")).toBe(sampleGroup.groupRu);
		expect(tzZoneLabel(sampleZone, "ru")).toBe(sampleZone.labelRu);
	});

	it("returns English labels for en locale", () => {
		expect(tzGroupLabel(sampleGroup, "en")).toBe(sampleGroup.groupEn);
		expect(tzZoneLabel(sampleZone, "en")).toBe(sampleZone.labelEn);
	});
});

describe("findTzZone", () => {
	it("finds existing timezone by value", () => {
		const zone = findTzZone("UTC");
		expect(zone).toBeDefined();
		expect(zone?.value).toBe("UTC");
	});

	it("returns undefined for unknown timezone", () => {
		const zone = findTzZone("Mars/Base_1");
		expect(zone).toBeUndefined();
	});
});
