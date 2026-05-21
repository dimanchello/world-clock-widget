import {
	App,
	ItemView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";
import { getLocale, Locale, t, Translations } from "./i18n";
import {
	ClockEntry,
	generateId,
	parseHHMMToMinutes,
	currentMinutes,
	formatTime,
	formatDate,
	computeUtcOffset,
	isWorking,
	dayKeyInTimezone,
	crossedTargetMinute,
} from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const VIEW_TYPE_WORLD_CLOCK = "world-clock-widget";

interface TzZone { value: string; labelRu: string; labelEn: string }
interface TzGroup { groupRu: string; groupEn: string; zones: TzZone[] }

const TIMEZONES: TzGroup[] = [
	{
		groupRu: "🇷🇺 Россия",
		groupEn: "🇷🇺 Russia",
		zones: [
			{ value: "Europe/Kaliningrad",  labelRu: "Калининград",        labelEn: "Kaliningrad"        },
			{ value: "Europe/Moscow",        labelRu: "Москва / СПб",       labelEn: "Moscow / St.Petersburg"  },
			{ value: "Europe/Samara",        labelRu: "Самара / Удмуртия",  labelEn: "Samara / Udmurtia"  },
			{ value: "Asia/Yekaterinburg",   labelRu: "Екатеринбург",       labelEn: "Yekaterinburg"       },
			{ value: "Asia/Omsk",            labelRu: "Омск",               labelEn: "Omsk"               },
			{ value: "Asia/Krasnoyarsk",     labelRu: "Красноярск",         labelEn: "Krasnoyarsk"         },
			{ value: "Asia/Irkutsk",         labelRu: "Иркутск",            labelEn: "Irkutsk"            },
			{ value: "Asia/Yakutsk",         labelRu: "Якутск",             labelEn: "Yakutsk"             },
			{ value: "Asia/Vladivostok",     labelRu: "Владивосток",        labelEn: "Vladivostok"        },
			{ value: "Asia/Magadan",         labelRu: "Магадан",            labelEn: "Magadan"            },
			{ value: "Asia/Kamchatka",       labelRu: "Камчатка",           labelEn: "Kamchatka"           },
		],
	},
	{
		groupRu: "🌍 Европа",
		groupEn: "🌍 Europe",
		zones: [
			{ value: "UTC",                  labelRu: "UTC / Рейкьявик",    labelEn: "UTC / Reykjavik"    },
			{ value: "Europe/London",        labelRu: "Лондон",             labelEn: "London"             },
			{ value: "Europe/Amsterdam",     labelRu: "Амстердам",          labelEn: "Amsterdam"          },
			{ value: "Europe/Berlin",        labelRu: "Берлин",             labelEn: "Berlin"             },
			{ value: "Europe/Paris",         labelRu: "Париж",              labelEn: "Paris"              },
			{ value: "Europe/Warsaw",        labelRu: "Варшава",            labelEn: "Warsaw"             },
			{ value: "Europe/Kyiv",          labelRu: "Киев",               labelEn: "Kyiv"               },
			{ value: "Europe/Helsinki",      labelRu: "Хельсинки",          labelEn: "Helsinki"           },
			{ value: "Europe/Bucharest",     labelRu: "Бухарест",           labelEn: "Bucharest"          },
			{ value: "Europe/Athens",        labelRu: "Афины",              labelEn: "Athens"             },
			{ value: "Europe/Istanbul",      labelRu: "Стамбул",            labelEn: "Istanbul"           },
		],
	},
	{
		groupRu: "🌏 СНГ и Ближний Восток",
		groupEn: "🌏 CIS & Middle East",
		zones: [
			{ value: "Asia/Baku",            labelRu: "Баку",               labelEn: "Baku"               },
			{ value: "Asia/Tbilisi",         labelRu: "Тбилиси",            labelEn: "Tbilisi"            },
			{ value: "Asia/Yerevan",         labelRu: "Ереван",             labelEn: "Yerevan"            },
			{ value: "Asia/Almaty",          labelRu: "Алматы",             labelEn: "Almaty"             },
			{ value: "Asia/Tashkent",        labelRu: "Ташкент",            labelEn: "Tashkent"           },
			{ value: "Asia/Bishkek",         labelRu: "Бишкек",             labelEn: "Bishkek"            },
			{ value: "Asia/Riyadh",          labelRu: "Эр-Рияд",            labelEn: "Riyadh"             },
			{ value: "Asia/Tehran",          labelRu: "Тегеран",            labelEn: "Tehran"             },
			{ value: "Asia/Dubai",           labelRu: "Дубай",              labelEn: "Dubai"              },
		],
	},
	{
		groupRu: "🌏 Азия",
		groupEn: "🌏 Asia",
		zones: [
			{ value: "Asia/Karachi",         labelRu: "Карачи",             labelEn: "Karachi"            },
			{ value: "Asia/Kolkata",         labelRu: "Индия",              labelEn: "India"              },
			{ value: "Asia/Dhaka",           labelRu: "Дакка",              labelEn: "Dhaka"              },
			{ value: "Asia/Bangkok",         labelRu: "Бангкок",            labelEn: "Bangkok"            },
			{ value: "Asia/Jakarta",         labelRu: "Джакарта",           labelEn: "Jakarta"            },
			{ value: "Asia/Shanghai",        labelRu: "Пекин / Шанхай",     labelEn: "Beijing / Shanghai"     },
			{ value: "Asia/Singapore",       labelRu: "Сингапур",           labelEn: "Singapore"          },
			{ value: "Asia/Hong_Kong",       labelRu: "Гонконг",            labelEn: "Hong Kong"          },
			{ value: "Asia/Seoul",           labelRu: "Сеул",               labelEn: "Seoul"              },
			{ value: "Asia/Tokyo",           labelRu: "Токио",              labelEn: "Tokyo"              },
		],
	},
	{
		groupRu: "🌎 Северная Америка",
		groupEn: "🌎 North America",
		zones: [
			{ value: "America/New_York",     labelRu: "Нью-Йорк",           labelEn: "New York"           },
			{ value: "America/Chicago",      labelRu: "Чикаго",             labelEn: "Chicago"            },
			{ value: "America/Denver",       labelRu: "Денвер",             labelEn: "Denver"             },
			{ value: "America/Los_Angeles",  labelRu: "Лос-Анджелес",       labelEn: "Los Angeles"       },
			{ value: "America/Anchorage",    labelRu: "Анкоридж",           labelEn: "Anchorage"          },
			{ value: "Pacific/Honolulu",     labelRu: "Гонолулу",           labelEn: "Honolulu"           },
		],
	},
	{
		groupRu: "🌎 Южная Америка",
		groupEn: "🌎 South America",
		zones: [
			{ value: "America/Sao_Paulo",    labelRu: "Сан-Паулу",          labelEn: "Sao Paulo"          },
			{ value: "America/Buenos_Aires", labelRu: "Буэнос-Айрес",       labelEn: "Buenos Aires"       },
			{ value: "America/Bogota",       labelRu: "Богота",             labelEn: "Bogota"             },
		],
	},
	{
		groupRu: "🌏 Австралия и Океания",
		groupEn: "🌏 Australia & Oceania",
		zones: [
			{ value: "Australia/Perth",      labelRu: "Перт",               labelEn: "Perth"              },
			{ value: "Australia/Darwin",     labelRu: "Дарвин",             labelEn: "Darwin"             },
			{ value: "Australia/Adelaide",   labelRu: "Аделаида",           labelEn: "Adelaide"           },
			{ value: "Australia/Brisbane",   labelRu: "Брисбен",            labelEn: "Brisbane"           },
			{ value: "Australia/Sydney",     labelRu: "Сидней",             labelEn: "Sydney"             },
			{ value: "Pacific/Auckland",     labelRu: "Окленд",             labelEn: "Auckland"           },
		],
	},
	{
		groupRu: "🌍 Африка",
		groupEn: "🌍 Africa",
		zones: [
			{ value: "Africa/Cairo",         labelRu: "Каир",               labelEn: "Cairo"              },
			{ value: "Africa/Johannesburg",  labelRu: "Йоханнесбург",       labelEn: "Johannesburg"       },
			{ value: "Africa/Lagos",         labelRu: "Лагос",              labelEn: "Lagos"              },
			{ value: "Africa/Casablanca",    labelRu: "Касабланка",         labelEn: "Casablanca"         },
		],
	},
];

function tzGroupLabel(group: TzGroup, locale: Locale): string {
	return locale === "ru" ? group.groupRu : group.groupEn;
}

function tzZoneLabel(zone: TzZone, locale: Locale): string {
	return locale === "ru" ? zone.labelRu : zone.labelEn;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface WorldClockSettings {
	clocks: ClockEntry[];
}

const DEFAULT_SETTINGS: WorldClockSettings = { clocks: [] };

// ─────────────────────────────────────────────────────────────────────────────
// Modal — Add / Edit Clock
// ─────────────────────────────────────────────────────────────────────────────

class ClockEditModal extends Modal {
	private draft: Partial<ClockEntry>;
	private readonly onSave: (entry: ClockEntry) => void;
	private readonly isEdit: boolean;
	private readonly locale: Locale;
	private readonly tr: Translations;

	private notifySection!: HTMLElement;
	private notifyStartToggle!: HTMLElement;
	private notifyEndToggle!: HTMLElement;

	constructor(app: App, entry: Partial<ClockEntry>, onSave: (entry: ClockEntry) => void) {
		super(app);
		this.draft  = { ...entry };
		this.onSave = onSave;
		this.isEdit = !!entry.id;
		this.locale = getLocale();
		this.tr = t(this.locale);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("wc-modal");

		contentEl.createEl("h2", { text: this.isEdit ? this.tr.modalTitleEdit : this.tr.modalTitleAdd });

		// ── Name ──────────────────────────────────────────────────────────────
		new Setting(contentEl)
			.setName(this.tr.nameLabel)
			.setDesc(this.tr.nameDesc)
			.addText(t => {
				t.setPlaceholder(this.tr.namePlaceholder)
				 .setValue(this.draft.name ?? "");
				t.onChange(v => this.draft.name = v);
				setTimeout(() => t.inputEl.focus(), 50);
			});

		// ── Timezone ──────────────────────────────────────────────────────────
		new Setting(contentEl)
			.setName(this.tr.timezoneLabel)
			.addDropdown(dd => {
				dd.selectEl.empty();
				const currentTz = this.draft.timezone ?? "Europe/Moscow";
				for (const group of TIMEZONES) {
					const og = document.createElement("optgroup");
					og.label = tzGroupLabel(group, this.locale);
					dd.selectEl.appendChild(og);
					for (const zone of group.zones) {
						const opt = document.createElement("option");
						opt.value = zone.value;
						opt.text  = tzZoneLabel(zone, this.locale);
						og.appendChild(opt);
					}
				}
				dd.setValue(currentTz);
				this.draft.timezone = currentTz;
				dd.onChange(v => this.draft.timezone = v);
			});

		// ── Work hours (optional) — 2-column row ──────────────────────────────
		contentEl.createEl("div", {
			text: this.tr.workSectionLabel,
			cls: "wc-modal-section-label",
		});

		const workRow = contentEl.createDiv("wc-modal-row");
		const workCol1 = workRow.createDiv("wc-modal-col");
		const workCol2 = workRow.createDiv("wc-modal-col");

		new Setting(workCol1)
			.setName(this.tr.workStartLabel)
			.addText(t => {
				t.inputEl.type = "time";
				t.setValue(this.draft.workStart ?? "");
				t.onChange(v => {
					this.draft.workStart = v;
					this.syncNotifySection();
				});
			});

		new Setting(workCol2)
			.setName(this.tr.workEndLabel)
			.addText(t => {
				t.inputEl.type = "time";
				t.setValue(this.draft.workEnd ?? "");
				t.onChange(v => {
					this.draft.workEnd = v;
					this.syncNotifySection();
				});
			});

		// ── Notifications ─────────────────────────────────────────────────────
		this.notifySection = contentEl.createDiv("wc-notify-section");
		this.buildNotifySection();
		this.syncNotifySection();

		// ── Buttons ───────────────────────────────────────────────────────────
		const btnRow = contentEl.createDiv("wc-modal-buttons");

		btnRow.createEl("button", { text: this.tr.btnCancel })
			.addEventListener("click", () => this.close());

		const saveBtn = btnRow.createEl("button", { text: this.tr.btnSave, cls: "mod-cta" });
		saveBtn.addEventListener("click", () => {
			if (!this.draft.name?.trim()) { new Notice(this.tr.errNoName); return; }
			if (!this.draft.timezone)     { new Notice(this.tr.errNoTimezone); return; }

			const hasStart = !!this.draft.workStart;
			const hasEnd = !!this.draft.workEnd;

			this.onSave({
				id:          this.draft.id          ?? generateId(),
				name:        this.draft.name.trim(),
				timezone:    this.draft.timezone,
				workStart:   this.draft.workStart   ?? "",
				workEnd:     this.draft.workEnd      ?? "",
				notifyStart: hasStart ? (this.draft.notifyStart ?? false) : false,
				notifyEnd:   hasEnd ? (this.draft.notifyEnd   ?? false) : false,
				enabled:     this.draft.enabled     ?? true,
				order:       this.draft.order        ?? 9999,
			});
			this.close();
		});
	}

	private buildNotifySection() {
		const sec = this.notifySection;
		sec.empty();

		sec.createEl("div", {
			text: this.tr.notifySectionLabel,
			cls: "wc-modal-section-label",
		});

		const notifyRow = sec.createDiv("wc-modal-row");
		const notifyCol1 = notifyRow.createDiv("wc-modal-col");
		const notifyCol2 = notifyRow.createDiv("wc-modal-col");

		const rowStart = new Setting(notifyCol1)
			.setName(this.tr.notifyStartLabel)
			.setDesc(this.tr.notifyStartDesc);
		rowStart.addToggle(t => {
			this.notifyStartToggle = t.toggleEl;
			t.setValue(this.draft.notifyStart ?? false);
			t.onChange(v => this.draft.notifyStart = v);
		});

		const rowEnd = new Setting(notifyCol2)
			.setName(this.tr.notifyEndLabel)
			.setDesc(this.tr.notifyEndDesc);
		rowEnd.addToggle(t => {
			this.notifyEndToggle = t.toggleEl;
			t.setValue(this.draft.notifyEnd ?? false);
			t.onChange(v => this.draft.notifyEnd = v);
		});
	}

	private syncNotifySection() {
		const hasStart = !!this.draft.workStart;
		const hasEnd = !!this.draft.workEnd;
		const hasAnyWorkTime = hasStart || hasEnd;
		this.notifySection.toggleClass("wc-notify-disabled", !hasAnyWorkTime);

		(this.notifyStartToggle as HTMLInputElement).disabled = !hasStart;
		(this.notifyEndToggle as HTMLInputElement).disabled   = !hasEnd;

		if (!hasStart) {
			(this.notifyStartToggle as HTMLInputElement).checked = false;
			this.draft.notifyStart = false;
		}
		if (!hasEnd) {
			(this.notifyEndToggle as HTMLInputElement).checked   = false;
			this.draft.notifyEnd   = false;
		}
	}

	onClose() { this.contentEl.empty(); }
}

// ─────────────────────────────────────────────────────────────────────────────
// View — Widget Panel
// ─────────────────────────────────────────────────────────────────────────────

class WorldClockView extends ItemView {
	plugin: WorldClockPlugin;
	private ticker: number | null = null;
	private dragSrcId: string | null = null;
	private readonly locale: Locale;
	private readonly tr: Translations;

	constructor(leaf: WorkspaceLeaf, plugin: WorldClockPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.locale = getLocale();
		this.tr = t(this.locale);
	}

	getViewType()    { return VIEW_TYPE_WORLD_CLOCK; }
	getDisplayText() { return this.tr.viewTitle; }
	getIcon()        { return "clock"; }

	async onOpen()  { this.render(); this.ticker = window.setInterval(() => this.tick(), 1000); }
	async onClose() { if (this.ticker !== null) { window.clearInterval(this.ticker); this.ticker = null; } }

	render() {
		const root = this.containerEl.children[1] as HTMLElement;
		root.empty();
		root.className = "wc-root";

		const sorted = this.plugin.settings.clocks
			.filter(c => c.enabled)
			.sort((a, b) => a.order - b.order);

		if (sorted.length === 0) {
			const empty = root.createDiv("wc-empty");
			empty.createEl("div", { cls: "wc-empty-icon", text: "🕐" });
			empty.createEl("div", { cls: "wc-empty-title", text: this.tr.emptyTitle });
			empty.createEl("div", { cls: "wc-empty-hint",  text: this.tr.emptyHint });
			return;
		}

		const list = root.createDiv("wc-list");

		for (const clock of sorted) {
			const card = list.createDiv("wc-card");
			card.setAttribute("draggable", "true");
			card.dataset.wcId = clock.id;

			this.setupDrag(card, clock, sorted, list);

			card.createDiv("wc-drag-handle").setText("⠿");

			const hdr = card.createDiv("wc-header");
			hdr.createDiv({ cls: "wc-name", text: clock.name });
			const off = computeUtcOffset(clock.timezone);
			if (off) hdr.createDiv({ cls: "wc-offset", text: off });

			const timeEl = card.createDiv("wc-time");
			timeEl.dataset.wcTime = clock.id;
			timeEl.setText(formatTime(new Date(), clock.timezone, this.locale));

			const dateEl = card.createDiv("wc-date");
			dateEl.dataset.wcDate = clock.id;
			dateEl.setText(formatDate(new Date(), clock.timezone, this.locale));

			if (clock.workStart && clock.workEnd) {
				const workRow = card.createDiv("wc-work");

				const hoursEl = workRow.createSpan({ cls: "wc-work-hours" });
				hoursEl.setText(`${clock.workStart} – ${clock.workEnd}`);

				if (clock.notifyStart || clock.notifyEnd) {
					const badges = workRow.createSpan("wc-notify-badges");
					if (clock.notifyStart) badges.createSpan({ cls: "wc-badge", text: this.tr.notifyStartBadge }).title = this.tr.notifyStartLabel;
					if (clock.notifyEnd)   badges.createSpan({ cls: "wc-badge", text: this.tr.notifyEndBadge }).title = this.tr.notifyEndLabel;
				}

				const statusEl = workRow.createSpan("wc-status");
				statusEl.dataset.wcStatus = clock.id;
				this.applyStatus(statusEl, clock);
			}
		}
	}

	private setupDrag(
		card: HTMLElement,
		clock: ClockEntry,
		sorted: ClockEntry[],
		list: HTMLElement,
	) {
		card.addEventListener("dragstart", e => {
			this.dragSrcId = clock.id;
			card.addClass("wc-dragging");
			if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", clock.id); }
		});

		card.addEventListener("dragend", () => {
			card.removeClass("wc-dragging");
			list.querySelectorAll(".wc-drag-over").forEach(el => el.removeClass("wc-drag-over"));
		});

		card.addEventListener("dragover", e => {
			e.preventDefault();
			if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
			if (this.dragSrcId !== clock.id) card.addClass("wc-drag-over");
		});

		card.addEventListener("dragleave", () => card.removeClass("wc-drag-over"));

		card.addEventListener("drop", async e => {
			e.preventDefault();
			card.removeClass("wc-drag-over");
			if (!this.dragSrcId || this.dragSrcId === clock.id) return;

			const arr = [...sorted];
			const si  = arr.findIndex(c => c.id === this.dragSrcId);
			const di  = arr.findIndex(c => c.id === clock.id);
			if (si === -1 || di === -1) return;

			const [moved] = arr.splice(si, 1);
			arr.splice(di, 0, moved);
			arr.forEach((c, i) => {
				const entry = this.plugin.settings.clocks.find(x => x.id === c.id);
				if (entry) entry.order = i;
			});

			await this.plugin.saveSettings();
			this.render();
		});
	}

	private tick() {
		const now = new Date();
		for (const clock of this.plugin.settings.clocks.filter(c => c.enabled)) {
			const t = this.containerEl.querySelector<HTMLElement>(`[data-wc-time="${clock.id}"]`);
			if (t) t.setText(formatTime(now, clock.timezone, this.locale));

			const d = this.containerEl.querySelector<HTMLElement>(`[data-wc-date="${clock.id}"]`);
			if (d) d.setText(formatDate(now, clock.timezone, this.locale));

			if (clock.workStart && clock.workEnd) {
				const s = this.containerEl.querySelector<HTMLElement>(`[data-wc-status="${clock.id}"]`);
				if (s) this.applyStatus(s, clock);
			}
		}
	}

	private applyStatus(el: HTMLElement, clock: ClockEntry) {
		const on = isWorking(clock);
		el.className = "wc-status";
		if (on === true)  { el.setText(this.tr.onWork);   el.addClass("wc-on");  }
		if (on === false) { el.setText(this.tr.offWork); el.addClass("wc-off"); }
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Tab
// ─────────────────────────────────────────────────────────────────────────────

class WorldClockSettingsTab extends PluginSettingTab {
	plugin: WorldClockPlugin;
	private readonly locale: Locale;
	private readonly tr: Translations;

	constructor(app: App, plugin: WorldClockPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.locale = getLocale();
		this.tr = t(this.locale);
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: this.tr.settingsTabTitle });

		new Setting(containerEl)
			.setName(this.tr.timezoneLabel)
			.setDesc(this.tr.emptyHint)
			.addButton(btn =>
				btn.setButtonText(this.tr.btnAdd).setCta().onClick(() => {
					new ClockEditModal(this.app, {}, async entry => {
						entry.order = this.plugin.settings.clocks.length;
						this.plugin.settings.clocks.push(entry);
						await this.plugin.saveSettings();
						this.plugin.refreshView();
						this.display();
					}).open();
				})
			);

		const clocks = [...this.plugin.settings.clocks].sort((a, b) => a.order - b.order);

		if (clocks.length === 0) {
			containerEl.createEl("p", {
				text: this.tr.settingsEmpty,
				cls: "wc-settings-empty",
			});
			return;
		}

		containerEl.createEl("h3", { text: this.tr.clockListTitle });
		containerEl.createEl("p", {
			text: this.tr.settingsHint,
			cls: "wc-settings-hint",
		});

		for (const clock of clocks) {
			const s = new Setting(containerEl);

			s.addToggle(t =>
				t.setValue(clock.enabled).onChange(async v => {
					const e = this.plugin.settings.clocks.find(c => c.id === clock.id);
					if (e) { e.enabled = v; await this.plugin.saveSettings(); this.plugin.refreshView(); }
				})
			);

			s.setName(clock.name);

			const parts = [computeUtcOffset(clock.timezone)];
			if (clock.workStart && clock.workEnd) {
				parts.push(`${this.tr.workDayDesc}: ${clock.workStart}–${clock.workEnd}`);
				const notifs: string[] = [];
				if (clock.notifyStart) notifs.push(this.tr.notifyStartBadge + " " + this.tr.notifyStartLabel);
				if (clock.notifyEnd)   notifs.push(this.tr.notifyEndBadge + " " + this.tr.notifyEndLabel);
				if (notifs.length)     parts.push(notifs.join(", "));
			}
			if (!clock.enabled) parts.push(this.tr.hiddenDesc);
			s.setDesc(parts.filter(Boolean).join(" · "));

			s.addButton(btn =>
				btn.setIcon("pencil").setTooltip(this.tr.btnEditTooltip).onClick(() => {
					new ClockEditModal(this.app, { ...clock }, async updated => {
						const idx = this.plugin.settings.clocks.findIndex(c => c.id === clock.id);
						if (idx !== -1) {
							this.plugin.settings.clocks[idx] = {
								...updated,
								order:   clock.order,
								enabled: clock.enabled,
							};
						}
						await this.plugin.saveSettings();
						this.plugin.refreshView();
						this.display();
					}).open();
				})
			);

			s.addButton(btn =>
				btn.setIcon("trash").setTooltip(this.tr.btnDeleteTooltip).setWarning().onClick(async () => {
					this.plugin.settings.clocks = this.plugin.settings.clocks.filter(c => c.id !== clock.id);
					[...this.plugin.settings.clocks]
						.sort((a, b) => a.order - b.order)
						.forEach((c, i) => c.order = i);
					await this.plugin.saveSettings();
					this.plugin.refreshView();
					this.display();
				})
			);
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Plugin
// ─────────────────────────────────────────────────────────────────────────────

type FiredMap = Map<string, string>;
type LastSeenMap = Map<string, { dayKey: string; minute: number }>;

export default class WorldClockPlugin extends Plugin {
	settings: WorldClockSettings = { clocks: [] };

	private notifyInterval: number | null = null;
	private fired: FiredMap = new Map();
	private lastSeen: LastSeenMap = new Map();
	private readonly locale: Locale = getLocale();
	private readonly tr: Translations = t(getLocale());

	private sendSystemNotification(title: string, body: string) {
		if (typeof window !== "undefined" && "Notification" in window) {
			if (Notification.permission === "granted") {
				new Notification(title, { body });
				return;
			}

			if (Notification.permission === "default") {
				void Notification.requestPermission().then(permission => {
					if (permission === "granted") {
						new Notification(title, { body });
					} else {
						new Notice(`${title}: ${body}`, 8000);
					}
				});
				return;
			}
		}

		new Notice(`${title}: ${body}`, 8000);
	}

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_WORLD_CLOCK, leaf => new WorldClockView(leaf, this));

		this.addRibbonIcon("clock", this.tr.ribbonIconTooltip, () => this.activateView());

		this.addCommand({
			id:       "open-world-clock",
			name:     this.tr.commandOpenWidget,
			callback: () => this.activateView(),
		});

		this.addSettingTab(new WorldClockSettingsTab(this.app, this));

		this.checkNotifications();
		this.notifyInterval = window.setInterval(() => this.checkNotifications(), 15_000);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_WORLD_CLOCK);
		if (this.notifyInterval !== null) {
			window.clearInterval(this.notifyInterval);
			this.notifyInterval = null;
		}
	}

	async loadSettings() {
		const loaded = await this.loadData();
		this.settings = {
			clocks: Array.isArray(loaded?.clocks) ? loaded.clocks : [],
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_WORLD_CLOCK);
		if (existing.length) { await this.app.workspace.revealLeaf(existing[0]); return; }

		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_WORLD_CLOCK, active: true });
			await this.app.workspace.revealLeaf(leaf);
		}
	}

	refreshView() {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_WORLD_CLOCK).forEach(leaf => {
			if (leaf.view instanceof WorldClockView) leaf.view.render();
		});
	}

	private checkNotifications() {
		for (const clock of this.settings.clocks) {
			if (!clock.enabled) continue;
			if (!clock.notifyStart && !clock.notifyEnd) continue;

			const nowMinutes = currentMinutes(clock.timezone);
			if (nowMinutes === null) continue;
			const dayKey = dayKeyInTimezone(clock.timezone);
			if (!dayKey) continue;

			const startKey = `${clock.id}:start`;
			const endKey   = `${clock.id}:end`;
			const last = this.lastSeen.get(clock.id);

			const startMinutes = clock.workStart ? parseHHMMToMinutes(clock.workStart) : null;
			const shouldStart =
				clock.notifyStart &&
				startMinutes !== null &&
				(
					nowMinutes === startMinutes ||
					(last ? crossedTargetMinute(last.minute, nowMinutes, startMinutes, last.dayKey !== dayKey) : false)
				);
			if (shouldStart) {
				if (this.fired.get(startKey) !== dayKey) {
					this.fired.set(startKey, dayKey);
					this.sendSystemNotification(
						this.tr.notifTitle,
						this.tr.notifStartBody(clock.name, clock.workStart),
					);
				}
			}

			const endMinutes = clock.workEnd ? parseHHMMToMinutes(clock.workEnd) : null;
			const shouldEnd =
				clock.notifyEnd &&
				endMinutes !== null &&
				(
					nowMinutes === endMinutes ||
					(last ? crossedTargetMinute(last.minute, nowMinutes, endMinutes, last.dayKey !== dayKey) : false)
				);
			if (shouldEnd) {
				if (this.fired.get(endKey) !== dayKey) {
					this.fired.set(endKey, dayKey);
					this.sendSystemNotification(
						this.tr.notifTitle,
						this.tr.notifEndBody(clock.name, clock.workEnd),
					);
				}
			}

			this.lastSeen.set(clock.id, { dayKey, minute: nowMinutes });
		}
	}
}
