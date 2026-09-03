import type {
	App,
	ToggleComponent,
	WorkspaceLeaf,
} from "obsidian";
import {
	ItemView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import type { Locale, Translations } from "./i18n";
import { getLocale, t } from "./i18n";
import type { ClockEntry } from "./helpers";
import {
	generateId,
	formatTime,
	formatDate,
	computeUtcOffset,
	isWorking,
	reorderClocks,
	removeClock,
	upsertClock,
} from "./helpers";
import {
	TIMEZONES,
	tzGroupLabel,
	tzZoneLabel,
	DEFAULT_TIMEZONE,
} from "./timezones";
import { NotificationManager } from "./notifications";

const VIEW_TYPE_WORLD_CLOCK = "world-clock-widget";

interface WorldClockSettings {
	clocks: ClockEntry[];
}

class ClockEditModal extends Modal {
	private readonly draft: Partial<ClockEntry>;
	private readonly onSave: (entry: ClockEntry) => void;
	private readonly isEdit: boolean;
	private readonly locale: Locale;
	private readonly tr: Translations;

	private notifySection!: HTMLElement;
	private notifyStartToggle!: ToggleComponent;
	private notifyEndToggle!: ToggleComponent;

	constructor(app: App, entry: Partial<ClockEntry>, onSave: (entry: ClockEntry) => void) {
		super(app);
		this.draft = { ...entry };
		this.onSave = onSave;
		this.isEdit = Boolean(entry.id);
		this.locale = getLocale();
		this.tr = t(this.locale);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("wc-modal");

		contentEl.createEl("h2", { text: this.isEdit ? this.tr.modalTitleEdit : this.tr.modalTitleAdd });

		new Setting(contentEl)
			.setName(this.tr.nameLabel)
			.setDesc(this.tr.nameDesc)
			.addText(textComponent => {
				textComponent.setPlaceholder(this.tr.namePlaceholder).setValue(this.draft.name ?? "");
				textComponent.onChange(v => {
					this.draft.name = v;
				});
				setTimeout(() => {
					textComponent.inputEl.focus();
				}, 50);
			});

		new Setting(contentEl)
			.setName(this.tr.timezoneLabel)
			.addDropdown(dd => {
				dd.selectEl.empty();
				const currentTz = this.draft.timezone ?? DEFAULT_TIMEZONE;
				for (const group of TIMEZONES) {
					const og = document.createElement("optgroup");
					og.label = tzGroupLabel(group, this.locale);
					dd.selectEl.appendChild(og);
					for (const zone of group.zones) {
						const opt = document.createElement("option");
						opt.value = zone.value;
						opt.text = tzZoneLabel(zone, this.locale);
						og.appendChild(opt);
					}
				}
				dd.setValue(currentTz);
				this.draft.timezone = currentTz;
				dd.onChange(v => {
					this.draft.timezone = v;
				});
			});

		contentEl.createEl("div", {
			text: this.tr.workSectionLabel,
			cls: "wc-modal-section-label",
		});

		const workRow = contentEl.createDiv("wc-modal-row");
		const workCol1 = workRow.createDiv("wc-modal-col");
		const workCol2 = workRow.createDiv("wc-modal-col");

		new Setting(workCol1)
			.setName(this.tr.workStartLabel)
			.addText(textComponent => {
				textComponent.inputEl.type = "time";
				textComponent.setValue(this.draft.workStart ?? "");
				textComponent.onChange(v => {
					this.draft.workStart = v;
					this.syncNotifySection();
				});
			});

		new Setting(workCol2)
			.setName(this.tr.workEndLabel)
			.addText(textComponent => {
				textComponent.inputEl.type = "time";
				textComponent.setValue(this.draft.workEnd ?? "");
				textComponent.onChange(v => {
					this.draft.workEnd = v;
					this.syncNotifySection();
				});
			});

		this.notifySection = contentEl.createDiv("wc-notify-section");
		this.buildNotifySection();
		this.syncNotifySection();

		const btnRow = contentEl.createDiv("wc-modal-buttons");

		btnRow.createEl("button", { text: this.tr.btnCancel })
			.addEventListener("click", () => {
				this.close();
			});

		const saveBtn = btnRow.createEl("button", { text: this.tr.btnSave, cls: "mod-cta" });
		saveBtn.addEventListener("click", () => {
			if (!this.draft.name?.trim()) {
				new Notice(this.tr.errNoName);
				return;
			}
			if (!this.draft.timezone) {
				new Notice(this.tr.errNoTimezone);
				return;
			}

			const hasStart = Boolean(this.draft.workStart);
			const hasEnd = Boolean(this.draft.workEnd);

			this.onSave({
				id: this.draft.id ?? generateId(),
				name: this.draft.name.trim(),
				timezone: this.draft.timezone,
				workStart: this.draft.workStart ?? "",
				workEnd: this.draft.workEnd ?? "",
				notifyStart: hasStart ? (this.draft.notifyStart ?? false) : false,
				notifyEnd: hasEnd ? (this.draft.notifyEnd ?? false) : false,
				enabled: this.draft.enabled ?? true,
				order: this.draft.order ?? 9999,
			});
			this.close();
		});
	}

	private buildNotifySection(): void {
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
		rowStart.addToggle(tgl => {
			this.notifyStartToggle = tgl;
			tgl.setValue(this.draft.notifyStart ?? false);
			tgl.onChange(v => {
				this.draft.notifyStart = v;
			});
		});

		const rowEnd = new Setting(notifyCol2)
			.setName(this.tr.notifyEndLabel)
			.setDesc(this.tr.notifyEndDesc);
		rowEnd.addToggle(tgl => {
			this.notifyEndToggle = tgl;
			tgl.setValue(this.draft.notifyEnd ?? false);
			tgl.onChange(v => {
				this.draft.notifyEnd = v;
			});
		});
	}

	private syncNotifySection(): void {
		const hasStart = Boolean(this.draft.workStart);
		const hasEnd = Boolean(this.draft.workEnd);

		this.notifyStartToggle.setDisabled(!hasStart);
		this.notifyEndToggle.setDisabled(!hasEnd);

		if (!hasStart) {
			this.notifyStartToggle.setValue(false);
			this.draft.notifyStart = false;
		}
		if (!hasEnd) {
			this.notifyEndToggle.setValue(false);
			this.draft.notifyEnd = false;
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

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

	getViewType(): string {
		return VIEW_TYPE_WORLD_CLOCK;
	}

	getDisplayText(): string {
		return this.tr.viewTitle;
	}

	getIcon(): string {
		return "clock";
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async onOpen(): Promise<void> {
		this.render();
		this.ticker = window.setInterval(() => {
			this.tick();
		}, 1000);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async onClose(): Promise<void> {
		if (this.ticker !== null) {
			window.clearInterval(this.ticker);
			this.ticker = null;
		}
	}

	render(): void {
		const root = this.contentEl;
		root.empty();
		root.className = "wc-root";

		const sorted = this.plugin.settings.clocks
			.filter(c => c.enabled)
			.sort((a, b) => a.order - b.order);

		if (sorted.length === 0) {
			const empty = root.createDiv("wc-empty");
			empty.createEl("div", { cls: "wc-empty-icon" }).setText("🕐");
			empty.createEl("div", { cls: "wc-empty-title", text: this.tr.emptyTitle });
			empty.createEl("div", { cls: "wc-empty-hint", text: this.tr.emptyHint });
			return;
		}

		const list = root.createDiv("wc-list");

		for (const clock of sorted) {
			const card = list.createDiv("wc-card");
			card.setAttribute("draggable", "true");
			card.dataset.wcId = clock.id;

			this.setupDrag(card, clock, list);

			card.createDiv("wc-drag-handle").setText("⠿");

			const hdr = card.createDiv("wc-header");
			hdr.createDiv({ cls: "wc-name", text: clock.name });
			const off = computeUtcOffset(clock.timezone);
			if (off) {
				hdr.createDiv({ cls: "wc-offset", text: off });
			}

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
					if (clock.notifyStart) {
						badges.createSpan({ cls: "wc-badge", text: this.tr.notifyStartBadge }).title = this.tr.notifyStartLabel;
					}
					if (clock.notifyEnd) {
						badges.createSpan({ cls: "wc-badge", text: this.tr.notifyEndBadge }).title = this.tr.notifyEndLabel;
					}
				}

				const statusEl = card.createDiv("wc-status");
				statusEl.dataset.wcStatus = clock.id;
				this.applyStatus(statusEl, clock);
			}
		}
	}

	private setupDrag(
		card: HTMLElement,
		clock: ClockEntry,
		list: HTMLElement,
	): void {
		card.addEventListener("dragstart", e => {
			this.dragSrcId = clock.id;
			card.addClass("wc-dragging");
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData("text/plain", clock.id);
			}
		});

		card.addEventListener("dragend", () => {
			card.removeClass("wc-dragging");
			list.querySelectorAll(".wc-drag-over").forEach(el => {
				el.removeClass("wc-drag-over");
			});
		});

		card.addEventListener("dragover", e => {
			e.preventDefault();
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = "move";
			}
			if (this.dragSrcId !== clock.id) {
				card.addClass("wc-drag-over");
			}
		});

		card.addEventListener("dragleave", () => {
			card.removeClass("wc-drag-over");
		});

		card.addEventListener("drop", e => {
			void (async () => {
				e.preventDefault();
				card.removeClass("wc-drag-over");
				if (!this.dragSrcId || this.dragSrcId === clock.id) {
					return;
				}

				this.plugin.settings.clocks = reorderClocks(
					this.plugin.settings.clocks,
					this.dragSrcId,
					clock.id,
				);

				await this.plugin.saveSettings();
				this.render();
			})();
		});
	}

	private tick(): void {
		const now = new Date();
		for (const clock of this.plugin.settings.clocks.filter(c => c.enabled)) {
			const tEl = this.contentEl.querySelector<HTMLElement>(`[data-wc-time="${clock.id}"]`);
			if (tEl) {
				tEl.setText(formatTime(now, clock.timezone, this.locale));
			}

			const dEl = this.contentEl.querySelector<HTMLElement>(`[data-wc-date="${clock.id}"]`);
			if (dEl) {
				dEl.setText(formatDate(now, clock.timezone, this.locale));
			}

			if (clock.workStart && clock.workEnd) {
				const sEl = this.contentEl.querySelector<HTMLElement>(`[data-wc-status="${clock.id}"]`);
				if (sEl) {
					this.applyStatus(sEl, clock);
				}
			}
		}
	}

	private applyStatus(el: HTMLElement, clock: ClockEntry): void {
		const on = isWorking(clock);
		el.className = "wc-status";
		if (on === true) {
			el.setText(this.tr.onWork);
			el.addClass("wc-on");
		}
		if (on === false) {
			el.setText(this.tr.offWork);
			el.addClass("wc-off");
		}
	}
}

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

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: this.tr.settingsTabTitle });

		new Setting(containerEl)
			.setName(this.tr.timezoneLabel)
			.setDesc(this.tr.emptyHint)
			.addButton(btn =>
				btn.setButtonText(this.tr.btnAdd).setCta().onClick(() => {
					new ClockEditModal(this.app, {}, entry => {
						void (async () => {
							this.plugin.settings.clocks = upsertClock(
								this.plugin.settings.clocks,
								entry,
							);
							await this.plugin.saveSettings();
							this.plugin.refreshView();
							this.display();
						})();
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

			s.addToggle(tgl =>
				tgl.setValue(clock.enabled).onChange(async v => {
					const e = this.plugin.settings.clocks.find(c => c.id === clock.id);
					if (e) {
						e.enabled = v;
						if (!v) {
							this.plugin.notificationManager.clearClock(clock.id);
						}
						await this.plugin.saveSettings();
						this.plugin.refreshView();
					}
				})
			);

			s.setName(clock.name);

			const parts = [computeUtcOffset(clock.timezone)];
			if (clock.workStart && clock.workEnd) {
				parts.push(`${this.tr.workDayDesc}: ${clock.workStart}–${clock.workEnd}`);
				const notifs: string[] = [];
				if (clock.notifyStart) {
					notifs.push(this.tr.notifyStartBadge + " " + this.tr.notifyStartLabel);
				}
				if (clock.notifyEnd) {
					notifs.push(this.tr.notifyEndBadge + " " + this.tr.notifyEndLabel);
				}
				if (notifs.length) {
					parts.push(notifs.join(", "));
				}
			}
			if (!clock.enabled) {
				parts.push(this.tr.hiddenDesc);
			}
			s.setDesc(parts.filter(Boolean).join(" · "));

			s.addButton(btn =>
				btn.setIcon("pencil").setTooltip(this.tr.btnEditTooltip).onClick(() => {
					new ClockEditModal(this.app, { ...clock }, updated => {
						void (async () => {
							this.plugin.notificationManager.clearClock(clock.id);
							this.plugin.settings.clocks = upsertClock(
								this.plugin.settings.clocks,
								{
									...updated,
									order: clock.order,
									enabled: clock.enabled,
								},
							);
							await this.plugin.saveSettings();
							this.plugin.refreshView();
							this.display();
						})();
					}).open();
				})
			);

			s.addButton(btn =>
				btn.setIcon("trash").setTooltip(this.tr.btnDeleteTooltip).setWarning().onClick(async () => {
					this.plugin.notificationManager.clearClock(clock.id);
					this.plugin.settings.clocks = removeClock(this.plugin.settings.clocks, clock.id);
					await this.plugin.saveSettings();
					this.plugin.refreshView();
					this.display();
				})
			);
		}
	}
}

export default class WorldClockPlugin extends Plugin {
	settings: WorldClockSettings = { clocks: [] };
	readonly notificationManager = new NotificationManager();

	private notifyInterval: number | null = null;
	private readonly locale: Locale = getLocale();
	private readonly tr: Translations = t(getLocale());

	private sendSystemNotification(title: string, body: string): void {
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

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_WORLD_CLOCK, leaf => new WorldClockView(leaf, this));

		this.addRibbonIcon("clock", this.tr.ribbonIconTooltip, () => {
			void this.activateView();
		});

		this.addCommand({
			id: "open-world-clock",
			name: this.tr.commandOpenWidget,
			callback: () => {
				void this.activateView();
			},
		});

		this.addSettingTab(new WorldClockSettingsTab(this.app, this));

		this.checkNotifications();
		this.notifyInterval = window.setInterval(() => {
			this.checkNotifications();
		}, 15_000);
		this.registerInterval(this.notifyInterval);
	}

	onunload(): void {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_WORLD_CLOCK);
		if (this.notifyInterval !== null) {
			window.clearInterval(this.notifyInterval);
			this.notifyInterval = null;
		}
		this.notificationManager.clearAll();
	}

	async loadSettings(): Promise<void> {
		const loaded = await this.loadData() as Record<string, unknown> | null;
		this.settings = {
			clocks: loaded && Array.isArray(loaded.clocks) ? (loaded.clocks as ClockEntry[]) : [],
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async activateView(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_WORLD_CLOCK);
		if (existing.length) {
			await this.app.workspace.revealLeaf(existing[0]);
			return;
		}

		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_WORLD_CLOCK, active: true });
			await this.app.workspace.revealLeaf(leaf);
		}
	}

	refreshView(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_WORLD_CLOCK).forEach(leaf => {
			if (leaf.view instanceof WorldClockView) {
				leaf.view.render();
			}
		});
	}

	private checkNotifications(): void {
		const events = this.notificationManager.check(this.settings.clocks);
		for (const ev of events) {
			const body = ev.type === "start"
				? this.tr.notifStartBody(ev.clock.name, ev.time)
				: this.tr.notifEndBody(ev.clock.name, ev.time);
			this.sendSystemNotification(this.tr.notifTitle, body);
		}
	}
}
