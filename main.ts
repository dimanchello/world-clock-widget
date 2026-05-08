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

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const VIEW_TYPE_WORLD_CLOCK = "world-clock-widget";

interface TzZone { value: string; label: string }
interface TzGroup { group: string; zones: TzZone[] }

const TIMEZONES: TzGroup[] = [
	{
		group: "🇷🇺 Россия",
		zones: [
			{ value: "Europe/Kaliningrad",  label: "Калининград        UTC+2"  },
			{ value: "Europe/Moscow",        label: "Москва / СПб       UTC+3"  },
			{ value: "Europe/Samara",        label: "Самара / Удмуртия  UTC+4"  },
			{ value: "Asia/Yekaterinburg",   label: "Екатеринбург       UTC+5"  },
			{ value: "Asia/Omsk",            label: "Омск               UTC+6"  },
			{ value: "Asia/Krasnoyarsk",     label: "Красноярск         UTC+7"  },
			{ value: "Asia/Irkutsk",         label: "Иркутск            UTC+8"  },
			{ value: "Asia/Yakutsk",         label: "Якутск             UTC+9"  },
			{ value: "Asia/Vladivostok",     label: "Владивосток        UTC+10" },
			{ value: "Asia/Magadan",         label: "Магадан            UTC+11" },
			{ value: "Asia/Kamchatka",       label: "Камчатка           UTC+12" },
		],
	},
	{
		group: "🌍 Европа",
		zones: [
			{ value: "UTC",                  label: "UTC / Рейкьявик    UTC+0"  },
			{ value: "Europe/London",        label: "Лондон             UTC+0/+1" },
			{ value: "Europe/Amsterdam",     label: "Амстердам          UTC+1/+2" },
			{ value: "Europe/Berlin",        label: "Берлин             UTC+1/+2" },
			{ value: "Europe/Paris",         label: "Париж              UTC+1/+2" },
			{ value: "Europe/Warsaw",        label: "Варшава            UTC+1/+2" },
			{ value: "Europe/Kyiv",          label: "Киев               UTC+2/+3" },
			{ value: "Europe/Helsinki",      label: "Хельсинки          UTC+2/+3" },
			{ value: "Europe/Bucharest",     label: "Бухарест           UTC+2/+3" },
			{ value: "Europe/Athens",        label: "Афины              UTC+2/+3" },
			{ value: "Europe/Istanbul",      label: "Стамбул            UTC+3"  },
		],
	},
	{
		group: "🌏 СНГ и Ближний Восток",
		zones: [
			{ value: "Asia/Baku",            label: "Баку               UTC+4"  },
			{ value: "Asia/Tbilisi",         label: "Тбилиси            UTC+4"  },
			{ value: "Asia/Yerevan",         label: "Ереван             UTC+4"  },
			{ value: "Asia/Almaty",          label: "Алматы             UTC+5"  },
			{ value: "Asia/Tashkent",        label: "Ташкент            UTC+5"  },
			{ value: "Asia/Bishkek",         label: "Бишкек             UTC+6"  },
			{ value: "Asia/Riyadh",          label: "Эр-Рияд            UTC+3"  },
			{ value: "Asia/Tehran",          label: "Тегеран            UTC+3:30" },
			{ value: "Asia/Dubai",           label: "Дубай              UTC+4"  },
		],
	},
	{
		group: "🌏 Азия",
		zones: [
			{ value: "Asia/Karachi",         label: "Карачи             UTC+5"  },
			{ value: "Asia/Kolkata",         label: "Индия              UTC+5:30" },
			{ value: "Asia/Dhaka",           label: "Дакка              UTC+6"  },
			{ value: "Asia/Bangkok",         label: "Бангкок            UTC+7"  },
			{ value: "Asia/Jakarta",         label: "Джакарта           UTC+7"  },
			{ value: "Asia/Shanghai",        label: "Пекин / Шанхай     UTC+8"  },
			{ value: "Asia/Singapore",       label: "Сингапур           UTC+8"  },
			{ value: "Asia/Hong_Kong",       label: "Гонконг            UTC+8"  },
			{ value: "Asia/Seoul",           label: "Сеул               UTC+9"  },
			{ value: "Asia/Tokyo",           label: "Токио              UTC+9"  },
		],
	},
	{
		group: "🌎 Северная Америка",
		zones: [
			{ value: "America/New_York",     label: "Нью-Йорк           UTC-5/-4" },
			{ value: "America/Chicago",      label: "Чикаго             UTC-6/-5" },
			{ value: "America/Denver",       label: "Денвер             UTC-7/-6" },
			{ value: "America/Los_Angeles",  label: "Лос-Анджелес       UTC-8/-7" },
			{ value: "America/Anchorage",    label: "Анкоридж           UTC-9/-8" },
			{ value: "Pacific/Honolulu",     label: "Гонолулу           UTC-10" },
		],
	},
	{
		group: "🌎 Южная Америка",
		zones: [
			{ value: "America/Sao_Paulo",    label: "Сан-Паулу          UTC-3/-2" },
			{ value: "America/Buenos_Aires", label: "Буэнос-Айрес       UTC-3"  },
			{ value: "America/Bogota",       label: "Богота             UTC-5"  },
		],
	},
	{
		group: "🌏 Австралия и Океания",
		zones: [
			{ value: "Australia/Perth",      label: "Перт               UTC+8"  },
			{ value: "Australia/Darwin",     label: "Дарвин             UTC+9:30" },
			{ value: "Australia/Adelaide",   label: "Аделаида           UTC+9:30/+10:30" },
			{ value: "Australia/Brisbane",   label: "Брисбен            UTC+10" },
			{ value: "Australia/Sydney",     label: "Сидней             UTC+10/+11" },
			{ value: "Pacific/Auckland",     label: "Окленд             UTC+12/+13" },
		],
	},
	{
		group: "🌍 Африка",
		zones: [
			{ value: "Africa/Cairo",         label: "Каир               UTC+2/+3" },
			{ value: "Africa/Johannesburg",  label: "Йоханнесбург       UTC+2"  },
			{ value: "Africa/Lagos",         label: "Лагос              UTC+1"  },
			{ value: "Africa/Casablanca",    label: "Касабланка         UTC+0/+1" },
		],
	},
];

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface ClockEntry {
	id: string;
	name: string;
	timezone: string;
	workStart: string;    // "HH:MM" or ""
	workEnd: string;      // "HH:MM" or ""
	notifyStart: boolean; // уведомить о начале рабочего дня
	notifyEnd: boolean;   // уведомить об окончании рабочего дня
	enabled: boolean;
	order: number;
}

interface WorldClockSettings {
	clocks: ClockEntry[];
}

const DEFAULT_SETTINGS: WorldClockSettings = { clocks: [] };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function parseHHMMToMinutes(value: string): number | null {
	const m = value.trim().match(/^(\d{1,2}):(\d{2})$/);
	if (!m) return null;

	const h = Number(m[1]);
	const min = Number(m[2]);
	if (!Number.isInteger(h) || !Number.isInteger(min)) return null;
	if (h < 0 || h > 23 || min < 0 || min > 59) return null;

	return h * 60 + min;
}

function currentMinutes(timezone: string): number | null {
	try {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		}).formatToParts(new Date());

		const hourPart = parts.find(p => p.type === "hour")?.value;
		const minutePart = parts.find(p => p.type === "minute")?.value;
		if (!hourPart || !minutePart) return null;

		const h = Number(hourPart);
		const m = Number(minutePart);
		if (!Number.isInteger(h) || !Number.isInteger(m)) return null;

		return h * 60 + m;
	} catch {
		return null;
	}
}

function formatTime(date: Date, timezone: string): string {
	try {
		return new Intl.DateTimeFormat("ru-RU", {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		}).format(date);
	} catch { return "--:--:--"; }
}

function formatDate(date: Date, timezone: string): string {
	try {
		return new Intl.DateTimeFormat("ru-RU", {
			timeZone: timezone,
			weekday: "short",
			day: "numeric",
			month: "short",
		}).format(date);
	} catch { return "---"; }
}

function computeUtcOffset(timezone: string): string {
	try {
		const now = new Date();
		const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
		const tz  = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
		const diffMin = Math.round((tz.getTime() - utc.getTime()) / 60000);
		const sign = diffMin >= 0 ? "+" : "−";
		const abs  = Math.abs(diffMin);
		const h    = Math.floor(abs / 60);
		const m    = abs % 60;
		return `UTC${sign}${h}${m > 0 ? ":" + String(m).padStart(2, "0") : ""}`;
	} catch { return ""; }
}

function isWorking(clock: ClockEntry): boolean | null {
	if (!clock.workStart || !clock.workEnd) return null;
	try {
		const cur = currentMinutes(clock.timezone);
		const start = parseHHMMToMinutes(clock.workStart);
		const end = parseHHMMToMinutes(clock.workEnd);
		if (cur === null || start === null || end === null) return null;

		return end >= start
			? cur >= start && cur < end
			: cur >= start || cur < end; // ночная смена
	} catch { return null; }
}

/**
 * Возвращает текущую дату "YYYY-MM-DD" в указанном часовом поясе
 * (для дедупликации уведомлений по локальному дню сотрудника).
 */
function dayKeyInTimezone(timezone: string): string {
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
		if (!year || !month || !day) return "";

		return `${year}-${month}-${day}`;
	} catch {
		return "";
	}
}

function crossedTargetMinute(prev: number, now: number, target: number, dayChanged: boolean): boolean {
	if (prev === now) return false;
	if (dayChanged) {
		// При переходе даты считаем только интервал [00:00, now].
		return target <= now;
	}

	// Обычный ход в рамках суток.
	if (now > prev) return target > prev && target <= now;

	// Переход через полночь или длинная пауза.
	return target > prev || target <= now;
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal — Add / Edit Clock
// ─────────────────────────────────────────────────────────────────────────────

class ClockEditModal extends Modal {
	private draft: Partial<ClockEntry>;
	private readonly onSave: (entry: ClockEntry) => void;
	private readonly isEdit: boolean;

	// Ссылки для динамического управления секцией уведомлений
	private notifySection!: HTMLElement;
	private notifyStartToggle!: HTMLElement;
	private notifyEndToggle!: HTMLElement;

	constructor(app: App, entry: Partial<ClockEntry>, onSave: (entry: ClockEntry) => void) {
		super(app);
		this.draft  = { ...entry };
		this.onSave = onSave;
		this.isEdit = !!entry.id;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("wc-modal");

		contentEl.createEl("h2", { text: this.isEdit ? "Редактировать часы" : "Добавить часы" });

		// ── Name ──────────────────────────────────────────────────────────────
		new Setting(contentEl)
			.setName("Название")
			.setDesc("Имя коллеги или произвольная метка")
			.addText(t => {
				t.setPlaceholder("Например: Иван (Москва)")
				 .setValue(this.draft.name ?? "");
				t.onChange(v => this.draft.name = v);
				setTimeout(() => t.inputEl.focus(), 50);
			});

		// ── Timezone ──────────────────────────────────────────────────────────
		new Setting(contentEl)
			.setName("Часовой пояс")
			.addDropdown(dd => {
				dd.selectEl.empty();
				const currentTz = this.draft.timezone ?? "Europe/Moscow";
				for (const group of TIMEZONES) {
					const og = document.createElement("optgroup");
					og.label = group.group;
					dd.selectEl.appendChild(og);
					for (const zone of group.zones) {
						const opt = document.createElement("option");
						opt.value = zone.value;
						opt.text  = zone.label;
						og.appendChild(opt);
					}
				}
				dd.setValue(currentTz);
				this.draft.timezone = currentTz;
				dd.onChange(v => this.draft.timezone = v);
			});

		// ── Work hours (optional) ─────────────────────────────────────────────
		contentEl.createEl("div", {
			text: "Рабочее время (необязательно)",
			cls: "wc-modal-section-label",
		});

		new Setting(contentEl)
			.setName("Начало рабочего дня")
			.addText(t => {
				t.inputEl.type = "time";
				t.setValue(this.draft.workStart ?? "");
				t.onChange(v => {
					this.draft.workStart = v;
					this.syncNotifySection();
				});
			});

		new Setting(contentEl)
			.setName("Конец рабочего дня")
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

		btnRow.createEl("button", { text: "Отмена" })
			.addEventListener("click", () => this.close());

		const saveBtn = btnRow.createEl("button", { text: "Сохранить", cls: "mod-cta" });
		saveBtn.addEventListener("click", () => {
			if (!this.draft.name?.trim()) { new Notice("Введите название"); return; }
			if (!this.draft.timezone)     { new Notice("Выберите часовой пояс"); return; }

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

	// ── Строим внутренности секции уведомлений ────────────────────────────────
	private buildNotifySection() {
		const sec = this.notifySection;
		sec.empty();

		sec.createEl("div", {
			text: "Уведомления",
			cls: "wc-modal-section-label",
		});

		// Start notification
		const rowStart = new Setting(sec)
			.setName("Начало рабочего дня")
			.setDesc("Уведомить, когда коллега начинает работать");
		rowStart.addToggle(t => {
			this.notifyStartToggle = t.toggleEl;
			t.setValue(this.draft.notifyStart ?? false);
			t.onChange(v => this.draft.notifyStart = v);
		});

		// End notification
		const rowEnd = new Setting(sec)
			.setName("Конец рабочего дня")
			.setDesc("Уведомить, когда коллега заканчивает работать");
		rowEnd.addToggle(t => {
			this.notifyEndToggle = t.toggleEl;
			t.setValue(this.draft.notifyEnd ?? false);
			t.onChange(v => this.draft.notifyEnd = v);
		});
	}

	// ── Включаем / выключаем секцию в зависимости от заполненности времени ───
	private syncNotifySection() {
		const hasStart = !!this.draft.workStart;
		const hasEnd = !!this.draft.workEnd;
		const hasAnyWorkTime = hasStart || hasEnd;
		this.notifySection.toggleClass("wc-notify-disabled", !hasAnyWorkTime);

		(this.notifyStartToggle as HTMLInputElement).disabled = !hasStart;
		(this.notifyEndToggle as HTMLInputElement).disabled   = !hasEnd;

		// Если время убрали — снимаем соответствующие галочки визуально и в черновике
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

	constructor(leaf: WorkspaceLeaf, plugin: WorldClockPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType()    { return VIEW_TYPE_WORLD_CLOCK; }
	getDisplayText() { return "Мировые часы"; }
	getIcon()        { return "clock"; }

	async onOpen()  { this.render(); this.ticker = window.setInterval(() => this.tick(), 1000); }
	async onClose() { if (this.ticker !== null) { window.clearInterval(this.ticker); this.ticker = null; } }

	// ── Full render ───────────────────────────────────────────────────────────
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
			empty.createEl("div", { cls: "wc-empty-title", text: "Нет активных часов" });
			empty.createEl("div", { cls: "wc-empty-hint",  text: "Добавьте часовые пояса в настройках плагина" });
			return;
		}

		const list = root.createDiv("wc-list");

		for (const clock of sorted) {
			const card = list.createDiv("wc-card");
			card.setAttribute("draggable", "true");
			card.dataset.wcId = clock.id;

			this.setupDrag(card, clock, sorted, list);

			// Drag handle
			card.createDiv("wc-drag-handle").setText("⠿");

			// Header: name + UTC offset
			const hdr = card.createDiv("wc-header");
			hdr.createDiv({ cls: "wc-name", text: clock.name });
			const off = computeUtcOffset(clock.timezone);
			if (off) hdr.createDiv({ cls: "wc-offset", text: off });

			// Big time
			const timeEl = card.createDiv("wc-time");
			timeEl.dataset.wcTime = clock.id;
			timeEl.setText(formatTime(new Date(), clock.timezone));

			// Date row
			const dateEl = card.createDiv("wc-date");
			dateEl.dataset.wcDate = clock.id;
			dateEl.setText(formatDate(new Date(), clock.timezone));

			// Work status + notification badges
			if (clock.workStart && clock.workEnd) {
				const workRow = card.createDiv("wc-work");

				const hoursEl = workRow.createSpan({ cls: "wc-work-hours" });
				hoursEl.setText(`${clock.workStart} – ${clock.workEnd}`);

				// Иконки уведомлений
				if (clock.notifyStart || clock.notifyEnd) {
					const badges = workRow.createSpan("wc-notify-badges");
					if (clock.notifyStart) badges.createSpan({ cls: "wc-badge", text: "🔔▶" }).title = "Уведомление: начало";
					if (clock.notifyEnd)   badges.createSpan({ cls: "wc-badge", text: "🔔■" }).title = "Уведомление: конец";
				}

				const statusEl = workRow.createSpan("wc-status");
				statusEl.dataset.wcStatus = clock.id;
				this.applyStatus(statusEl, clock);
			}
		}
	}

	// ── Drag & drop ───────────────────────────────────────────────────────────
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

	// ── Per-tick update ───────────────────────────────────────────────────────
	private tick() {
		const now = new Date();
		for (const clock of this.plugin.settings.clocks.filter(c => c.enabled)) {
			const t = this.containerEl.querySelector<HTMLElement>(`[data-wc-time="${clock.id}"]`);
			if (t) t.setText(formatTime(now, clock.timezone));

			const d = this.containerEl.querySelector<HTMLElement>(`[data-wc-date="${clock.id}"]`);
			if (d) d.setText(formatDate(now, clock.timezone));

			if (clock.workStart && clock.workEnd) {
				const s = this.containerEl.querySelector<HTMLElement>(`[data-wc-status="${clock.id}"]`);
				if (s) this.applyStatus(s, clock);
			}
		}
	}

	private applyStatus(el: HTMLElement, clock: ClockEntry) {
		const on = isWorking(clock);
		el.className = "wc-status";
		if (on === true)  { el.setText("● на работе");   el.addClass("wc-on");  }
		if (on === false) { el.setText("○ не работает"); el.addClass("wc-off"); }
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Tab
// ─────────────────────────────────────────────────────────────────────────────

class WorldClockSettingsTab extends PluginSettingTab {
	plugin: WorldClockPlugin;

	constructor(app: App, plugin: WorldClockPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Мировые часы" });

		// ── Add button ────────────────────────────────────────────────────────
		new Setting(containerEl)
			.setName("Добавить часовой пояс")
			.setDesc("Добавить карточку с часами для коллеги или города")
			.addButton(btn =>
				btn.setButtonText("+ Добавить").setCta().onClick(() => {
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
				text: "Список пуст. Нажмите «+ Добавить» чтобы создать первую карточку.",
				cls: "wc-settings-empty",
			});
			return;
		}

		containerEl.createEl("h3", { text: "Список часов" });
		containerEl.createEl("p", {
			text: "Порядок карточек меняется перетаскиванием прямо в виджете.",
			cls: "wc-settings-hint",
		});

		for (const clock of clocks) {
			const s = new Setting(containerEl);

			// Toggle enabled
			s.addToggle(t =>
				t.setValue(clock.enabled).onChange(async v => {
					const e = this.plugin.settings.clocks.find(c => c.id === clock.id);
					if (e) { e.enabled = v; await this.plugin.saveSettings(); this.plugin.refreshView(); }
				})
			);

			s.setName(clock.name);

			const parts = [computeUtcOffset(clock.timezone)];
			if (clock.workStart && clock.workEnd) {
				parts.push(`рабочий день: ${clock.workStart}–${clock.workEnd}`);
				const notifs: string[] = [];
				if (clock.notifyStart) notifs.push("🔔 начало");
				if (clock.notifyEnd)   notifs.push("🔔 конец");
				if (notifs.length)     parts.push(notifs.join(", "));
			}
			if (!clock.enabled) parts.push("скрыт");
			s.setDesc(parts.filter(Boolean).join(" · "));

			// Edit
			s.addButton(btn =>
				btn.setIcon("pencil").setTooltip("Редактировать").onClick(() => {
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

			// Delete
			s.addButton(btn =>
				btn.setIcon("trash").setTooltip("Удалить").setWarning().onClick(async () => {
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

/**
 * Хранит, какие уведомления уже были отправлены сегодня.
 * Ключ: `${clockId}:start` или `${clockId}:end`
 * Значение: todayKey() в момент срабатывания
 */
type FiredMap = Map<string, string>;
type LastSeenMap = Map<string, { dayKey: string; minute: number }>;

export default class WorldClockPlugin extends Plugin {
	settings: WorldClockSettings = DEFAULT_SETTINGS;

	// Интервал проверки уведомлений
	private notifyInterval: number | null = null;
	private fired: FiredMap = new Map();
	private lastSeen: LastSeenMap = new Map();

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

		// Fallback: внутри Obsidian, если системные уведомления недоступны.
		new Notice(`${title}: ${body}`, 8000);
	}

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_WORLD_CLOCK, leaf => new WorldClockView(leaf, this));

		this.addRibbonIcon("clock", "Мировые часы", () => this.activateView());

		this.addCommand({
			id:       "open-world-clock",
			name:     "Открыть виджет мировых часов",
			callback: () => this.activateView(),
		});

		this.addSettingTab(new WorldClockSettingsTab(this.app, this));

		// Запускаем планировщик уведомлений
		this.checkNotifications(); // сразу после загрузки, чтобы не ждать первый тик
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
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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

	// ── Проверка уведомлений ──────────────────────────────────────────────────
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
				// Срабатываем только один раз в сутки
				if (this.fired.get(startKey) !== dayKey) {
					this.fired.set(startKey, dayKey);
					this.sendSystemNotification(
						"World Clock Widget",
						`🟢 ${clock.name} начинает рабочий день (${clock.workStart})`,
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
						"World Clock Widget",
						`🔴 ${clock.name} заканчивает рабочий день (${clock.workEnd})`,
					);
				}
			}

			this.lastSeen.set(clock.id, { dayKey, minute: nowMinutes });
		}
	}
}
