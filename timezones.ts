import type { Locale } from "./i18n";

export interface TzZone {
	readonly value: string;
	readonly labelRu: string;
	readonly labelEn: string;
}

export interface TzGroup {
	readonly groupRu: string;
	readonly groupEn: string;
	readonly zones: readonly TzZone[];
}

export const DEFAULT_TIMEZONE = "Europe/Moscow";

export const TIMEZONES: readonly TzGroup[] = [
	{
		groupRu: "🇷🇺 Россия",
		groupEn: "🇷🇺 Russia",
		zones: [
			{ value: "Europe/Kaliningrad", labelRu: "Калининград", labelEn: "Kaliningrad" },
			{ value: "Europe/Moscow", labelRu: "Москва / СПб", labelEn: "Moscow / St.Petersburg" },
			{ value: "Europe/Samara", labelRu: "Самара / Удмуртия", labelEn: "Samara / Udmurtia" },
			{ value: "Asia/Yekaterinburg", labelRu: "Екатеринбург", labelEn: "Yekaterinburg" },
			{ value: "Asia/Omsk", labelRu: "Омск", labelEn: "Omsk" },
			{ value: "Asia/Krasnoyarsk", labelRu: "Красноярск", labelEn: "Krasnoyarsk" },
			{ value: "Asia/Irkutsk", labelRu: "Иркутск", labelEn: "Irkutsk" },
			{ value: "Asia/Yakutsk", labelRu: "Якутск", labelEn: "Yakutsk" },
			{ value: "Asia/Vladivostok", labelRu: "Владивосток", labelEn: "Vladivostok" },
			{ value: "Asia/Magadan", labelRu: "Магадан", labelEn: "Magadan" },
			{ value: "Asia/Kamchatka", labelRu: "Камчатка", labelEn: "Kamchatka" },
		],
	},
	{
		groupRu: "🌍 Европа",
		groupEn: "🌍 Europe",
		zones: [
			{ value: "UTC", labelRu: "UTC / Рейкьявик", labelEn: "UTC / Reykjavik" },
			{ value: "Europe/London", labelRu: "Лондон", labelEn: "London" },
			{ value: "Europe/Amsterdam", labelRu: "Амстердам", labelEn: "Amsterdam" },
			{ value: "Europe/Berlin", labelRu: "Берлин", labelEn: "Berlin" },
			{ value: "Europe/Paris", labelRu: "Париж", labelEn: "Paris" },
			{ value: "Europe/Warsaw", labelRu: "Варшава", labelEn: "Warsaw" },
			{ value: "Europe/Kyiv", labelRu: "Киев", labelEn: "Kyiv" },
			{ value: "Europe/Helsinki", labelRu: "Хельсинки", labelEn: "Helsinki" },
			{ value: "Europe/Bucharest", labelRu: "Бухарест", labelEn: "Bucharest" },
			{ value: "Europe/Athens", labelRu: "Афины", labelEn: "Athens" },
			{ value: "Europe/Istanbul", labelRu: "Стамбул", labelEn: "Istanbul" },
		],
	},
	{
		groupRu: "🌏 СНГ и Ближний Восток",
		groupEn: "🌏 CIS & Middle East",
		zones: [
			{ value: "Asia/Baku", labelRu: "Баку", labelEn: "Baku" },
			{ value: "Asia/Tbilisi", labelRu: "Тбилиси", labelEn: "Tbilisi" },
			{ value: "Asia/Yerevan", labelRu: "Ереван", labelEn: "Yerevan" },
			{ value: "Asia/Almaty", labelRu: "Алматы", labelEn: "Almaty" },
			{ value: "Asia/Tashkent", labelRu: "Ташкент", labelEn: "Tashkent" },
			{ value: "Asia/Bishkek", labelRu: "Бишкек", labelEn: "Bishkek" },
			{ value: "Asia/Riyadh", labelRu: "Эр-Рияд", labelEn: "Riyadh" },
			{ value: "Asia/Tehran", labelRu: "Тегеран", labelEn: "Tehran" },
			{ value: "Asia/Dubai", labelRu: "Дубай", labelEn: "Dubai" },
		],
	},
	{
		groupRu: "🌏 Азия",
		groupEn: "🌏 Asia",
		zones: [
			{ value: "Asia/Karachi", labelRu: "Карачи", labelEn: "Karachi" },
			{ value: "Asia/Kolkata", labelRu: "Индия", labelEn: "India" },
			{ value: "Asia/Dhaka", labelRu: "Дакка", labelEn: "Dhaka" },
			{ value: "Asia/Bangkok", labelRu: "Бангкок", labelEn: "Bangkok" },
			{ value: "Asia/Jakarta", labelRu: "Джакарта", labelEn: "Jakarta" },
			{ value: "Asia/Shanghai", labelRu: "Пекин / Шанхай", labelEn: "Beijing / Shanghai" },
			{ value: "Asia/Singapore", labelRu: "Сингапур", labelEn: "Singapore" },
			{ value: "Asia/Hong_Kong", labelRu: "Гонконг", labelEn: "Hong Kong" },
			{ value: "Asia/Seoul", labelRu: "Сеул", labelEn: "Seoul" },
			{ value: "Asia/Tokyo", labelRu: "Токио", labelEn: "Tokyo" },
		],
	},
	{
		groupRu: "🌎 Северная Америка",
		groupEn: "🌎 North America",
		zones: [
			{ value: "America/New_York", labelRu: "Нью-Йорк", labelEn: "New York" },
			{ value: "America/Chicago", labelRu: "Чикаго", labelEn: "Chicago" },
			{ value: "America/Denver", labelRu: "Денвер", labelEn: "Denver" },
			{ value: "America/Los_Angeles", labelRu: "Лос-Анджелес", labelEn: "Los Angeles" },
			{ value: "America/Anchorage", labelRu: "Анкоридж", labelEn: "Anchorage" },
			{ value: "Pacific/Honolulu", labelRu: "Гонолулу", labelEn: "Honolulu" },
		],
	},
	{
		groupRu: "🌎 Южная Америка",
		groupEn: "🌎 South America",
		zones: [
			{ value: "America/Sao_Paulo", labelRu: "Сан-Паулу", labelEn: "Sao Paulo" },
			{ value: "America/Buenos_Aires", labelRu: "Буэнос-Айрес", labelEn: "Buenos Aires" },
			{ value: "America/Bogota", labelRu: "Богота", labelEn: "Bogota" },
		],
	},
	{
		groupRu: "🌏 Австралия и Океания",
		groupEn: "🌏 Australia & Oceania",
		zones: [
			{ value: "Australia/Perth", labelRu: "Перт", labelEn: "Perth" },
			{ value: "Australia/Darwin", labelRu: "Дарвин", labelEn: "Darwin" },
			{ value: "Australia/Adelaide", labelRu: "Аделаида", labelEn: "Adelaide" },
			{ value: "Australia/Brisbane", labelRu: "Брисбен", labelEn: "Brisbane" },
			{ value: "Australia/Sydney", labelRu: "Сидней", labelEn: "Sydney" },
			{ value: "Pacific/Auckland", labelRu: "Окленд", labelEn: "Auckland" },
		],
	},
	{
		groupRu: "🌍 Африка",
		groupEn: "🌍 Africa",
		zones: [
			{ value: "Africa/Cairo", labelRu: "Каир", labelEn: "Cairo" },
			{ value: "Africa/Johannesburg", labelRu: "Йоханнесбург", labelEn: "Johannesburg" },
			{ value: "Africa/Lagos", labelRu: "Лагос", labelEn: "Lagos" },
			{ value: "Africa/Casablanca", labelRu: "Касабланка", labelEn: "Casablanca" },
		],
	},
];

export function tzGroupLabel(group: TzGroup, locale: Locale): string {
	return locale === "ru" ? group.groupRu : group.groupEn;
}

export function tzZoneLabel(zone: TzZone, locale: Locale): string {
	return locale === "ru" ? zone.labelRu : zone.labelEn;
}

export function findTzZone(value: string): TzZone | undefined {
	for (const group of TIMEZONES) {
		for (const zone of group.zones) {
			if (zone.value === value) {
				return zone;
			}
		}
	}
	return undefined;
}
