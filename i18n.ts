export type Locale = "ru" | "en";

export interface Translations {
	// Plugin meta
	pluginName: string;
	ribbonIconTooltip: string;
	commandOpenWidget: string;
	viewTitle: string;
	settingsTabTitle: string;

	// Empty states
	emptyTitle: string;
	emptyHint: string;
	settingsEmpty: string;
	settingsHint: string;

	// Modal
	modalTitleAdd: string;
	modalTitleEdit: string;
	nameLabel: string;
	nameDesc: string;
	namePlaceholder: string;
	timezoneLabel: string;
	workSectionLabel: string;
	workStartLabel: string;
	workEndLabel: string;
	notifySectionLabel: string;
	notifyStartLabel: string;
	notifyStartDesc: string;
	notifyEndLabel: string;
	notifyEndDesc: string;
	btnCancel: string;
	btnSave: string;
	btnAdd: string;
	errNoName: string;
	errNoTimezone: string;
	notifyDisabledHint: string;

	// Card UI
	onWork: string;
	offWork: string;
	notifyStartBadge: string;
	notifyEndBadge: string;
	clockListTitle: string;
	btnEditTooltip: string;
	btnDeleteTooltip: string;
	workDayDesc: string;
	hiddenDesc: string;

	// Notifications
	notifTitle: string;
	notifStartBody: (name: string, time: string) => string;
	notifEndBody: (name: string, time: string) => string;

	// Timezone groups
	tzGroupRussia: string;
	tzGroupEurope: string;
	tzGroupCISMiddleEast: string;
	tzGroupAsia: string;
	tzGroupNorthAmerica: string;
	tzGroupSouthAmerica: string;
	tzGroupAustraliaOceania: string;
	tzGroupAfrica: string;
}

const ru: Translations = {
	pluginName: "Мировые часы",
	ribbonIconTooltip: "Мировые часы",
	commandOpenWidget: "Открыть виджет мировых часов",
	viewTitle: "Мировые часы",
	settingsTabTitle: "Мировые часы",

	emptyTitle: "Нет активных часов",
	emptyHint: "Добавьте часовые пояса в настройках плагина",
	settingsEmpty: "Список пуст. Нажмите «+ Добавить» чтобы создать первую карточку.",
	settingsHint: "Порядок карточек меняется перетаскиванием прямо в виджете.",

	modalTitleAdd: "Добавить часы",
	modalTitleEdit: "Редактировать часы",
	nameLabel: "Название",
	nameDesc: "Имя коллеги или произвольная метка",
	namePlaceholder: "Например: Иван (Москва)",
	timezoneLabel: "Часовой пояс",
	workSectionLabel: "Рабочее время (необязательно)",
	workStartLabel: "Начало рабочего дня",
	workEndLabel: "Конец рабочего дня",
	notifySectionLabel: "Уведомления",
	notifyStartLabel: "Начало рабочего дня",
	notifyStartDesc: "Уведомить, когда коллега начинает работать",
	notifyEndLabel: "Конец рабочего дня",
	notifyEndDesc: "Уведомить, когда коллега заканчивает работать",
	btnCancel: "Отмена",
	btnSave: "Сохранить",
	btnAdd: "+ Добавить",
	errNoName: "Введите название",
	errNoTimezone: "Выберите часовой пояс",
	notifyDisabledHint: " — укажите рабочее время",

	onWork: "● на работе",
	offWork: "○ не работает",
	notifyStartBadge: "🔔▶",
	notifyEndBadge: "🔔■",
	clockListTitle: "Список часов",
	btnEditTooltip: "Редактировать",
	btnDeleteTooltip: "Удалить",
	workDayDesc: "рабочий день",
	hiddenDesc: "скрыт",

	notifTitle: "World Clock Widget",
	notifStartBody: (name: string, time: string) => `🟢 ${name} начинает рабочий день (${time})`,
	notifEndBody: (name: string, time: string) => `🔴 ${name} заканчивает рабочий день (${time})`,

	tzGroupRussia: "🇷🇺 Россия",
	tzGroupEurope: "🌍 Европа",
	tzGroupCISMiddleEast: "🌏 СНГ и Ближний Восток",
	tzGroupAsia: "🌏 Азия",
	tzGroupNorthAmerica: "🌎 Северная Америка",
	tzGroupSouthAmerica: "🌎 Южная Америка",
	tzGroupAustraliaOceania: "🌏 Австралия и Океания",
	tzGroupAfrica: "🌍 Африка",
};

const en: Translations = {
	pluginName: "World Clock",
	ribbonIconTooltip: "World Clock",
	commandOpenWidget: "Open world clock widget",
	viewTitle: "World Clock",
	settingsTabTitle: "World Clock",

	emptyTitle: "No active clocks",
	emptyHint: "Add time zones in the plugin settings",
	settingsEmpty: "The list is empty. Click \"+ Add\" to create the first card.",
	settingsHint: "Card order can be changed by dragging directly in the widget.",

	modalTitleAdd: "Add Clock",
	modalTitleEdit: "Edit Clock",
	nameLabel: "Name",
	nameDesc: "Colleague name or custom label",
	namePlaceholder: "e.g. John (London)",
	timezoneLabel: "Timezone",
	workSectionLabel: "Work hours (optional)",
	workStartLabel: "Work day start",
	workEndLabel: "Work day end",
	notifySectionLabel: "Notifications",
	notifyStartLabel: "Work day start",
	notifyStartDesc: "Notify when colleague starts working",
	notifyEndLabel: "Work day end",
	notifyEndDesc: "Notify when colleague finishes working",
	btnCancel: "Cancel",
	btnSave: "Save",
	btnAdd: "+ Add",
	errNoName: "Enter a name",
	errNoTimezone: "Select a timezone",
	notifyDisabledHint: " — specify work hours",

	onWork: "● at work",
	offWork: "○ off work",
	notifyStartBadge: "🔔▶",
	notifyEndBadge: "🔔■",
	clockListTitle: "Clock List",
	btnEditTooltip: "Edit",
	btnDeleteTooltip: "Delete",
	workDayDesc: "work day",
	hiddenDesc: "hidden",

	notifTitle: "World Clock Widget",
	notifStartBody: (name: string, time: string) => `🟢 ${name} starts work day (${time})`,
	notifEndBody: (name: string, time: string) => `🔴 ${name} ends work day (${time})`,

	tzGroupRussia: "🇷🇺 Russia",
	tzGroupEurope: "🌍 Europe",
	tzGroupCISMiddleEast: "🌏 CIS & Middle East",
	tzGroupAsia: "🌏 Asia",
	tzGroupNorthAmerica: "🌎 North America",
	tzGroupSouthAmerica: "🌎 South America",
	tzGroupAustraliaOceania: "🌏 Australia & Oceania",
	tzGroupAfrica: "🌍 Africa",
};

const translations: Record<Locale, Translations> = { ru, en };

export function t(locale: Locale): Translations {
	return (translations[locale] as Translations | undefined) ?? translations.en;
}

export function getLocale(): Locale {
	if (typeof navigator !== "undefined") {
		const lang = navigator.language.toLowerCase();
		if (lang.startsWith("ru")) {return "ru";}
	}
	return "en";
}
