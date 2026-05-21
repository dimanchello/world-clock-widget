# AGENTS.md — World Clock Widget

## Команды

```bash
npm run dev          # Сборка в режиме watch (dev)
npm run build        # TypeScript проверка + продакшен-сборка в dist/
npm run test         # Запуск unit-тестов (vitest)
npm run test:watch   # Тесты в режиме watch
```

## Структура проекта

| Файл | Назначение |
|------|-----------|
| `main.ts` | Точка входа плагина Obsidian (классы Modal, View, SettingsTab, Plugin) |
| `helpers.ts` | Чистые утилитарные функции (парсинг времени, форматирование, расчёт смещений) |
| `i18n.ts` | Система локализации (русский/английский) |
| `styles.css` | Стили виджета |
| `manifest.json` | Метаданные плагина Obsidian |
| `esbuild.config.mjs` | Конфигурация сборщика |
| `vitest.config.ts` | Конфигурация тестового фреймворка |
| `__tests__/` | Unit-тесты |
| `dist/` | Выходная папка сборки (main.js) |

## Архитектура

### Локализация
- Язык определяется автоматически через `navigator.language`
- Поддерживаются: `ru` (русский), `en` (английский)
- Все строки UI хранятся в `i18n.ts` в объектах `Translations`
- Функция `t(locale)` возвращает объект переводов
- Функция `getLocale()` определяет текущий язык

### Чистые функции (helpers.ts)
Вынесены отдельно для тестируемости без зависимости от Obsidian:
- `generateId()` — генерация уникальных ID
- `parseHHMMToMinutes(value)` — парсинг "HH:MM" в минуты
- `currentMinutes(timezone)` — текущие минуты в часовом поясе
- `formatTime(date, timezone, locale)` — форматирование времени
- `formatDate(date, timezone, locale)` — форматирование даты
- `computeUtcOffset(timezone)` — расчёт UTC-смещения
- `isWorking(clock)` — проверка, находится ли в рабочее время
- `dayKeyInTimezone(timezone)` — дата "YYYY-MM-DD" в часовом поясе
- `crossedTargetMinute(prev, now, target, dayChanged)` — проверка пересечения целевой минуты

### Тесты
- Фреймворк: Vitest
- Все чистые функции покрыты тестами в `__tests__/helpers.test.ts`
- Тесты проверяют: корректный ввод, граничные случаи, ошибочные данные

## Соглашения

- Код на TypeScript, строгий режим (`strictNullChecks: true`)
- Сборка: esbuild, формат CJS, target ES2018
- Без комментариев в коде (кроме JSDoc для экспортируемых функций)
- Без эмодзи в коде (кроме данных локализации и UI-элементов)
