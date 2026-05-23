# AGENTS.md — World Clock Widget

## Команды

```bash
npm run dev          # Сборка в режиме watch (dev)
npm run build        # Линтер + TypeScript проверка + тесты + продакшен-сборка в dist/
npm run lint         # ESLint (strict-type-checked + stylistic), 0 warnings
npm run lint:fix     # ESLint с автоисправлением
npm run typecheck    # TypeScript проверка типов (tsc --noEmit)
npm run test         # Запуск unit-тестов (vitest)
npm run test:watch   # Тесты в режиме watch
npm run check        # Полная проверка: lint → typecheck → test
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
| `.eslintrc.json` | Конфигурация ESLint со строжайшими правилами |
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

### View (WorldClockView)
- Отображает виджет в боковой панели Obsidian
- Обновляет время и дату каждую секунду (`setInterval`)
- Drag & drop для изменения порядка карточек
- Показывает статус «на работе / не работает» на основе `isWorking()`

### Modal (ClockEditModal)
- Создание и редактирование часовой карточки
- Выбор часового пояса из иерархических групп
- Настройка рабочего времени и уведомлений о начале/конце дня
- Toggle уведомлений блокируется, если не указано рабочее время

### Settings Tab (WorldClockSettingsTab)
- Список всех часов с управлением (toggle, edit, delete)
- Кнопка «+ Добавить» для создания новой карточки
- Описание каждой карточки: часовой пояс, рабочие часы, уведомления

### Уведомления
- Проверка каждые 15 секунд через `setInterval`
- Системные уведомления (HTML5 Notification API) с fallback на `Notice`
- Дедублирование: одно уведомление в день на событие
- Отслеживание пересечения целевой минуты с учётом смены дня

## Линтер и статанализ

Проект использует **ESLint** с пакетом `@typescript-eslint` и строжайшими наборами правил:

- `@typescript-eslint/strict-type-checked` — максимально строгая проверка типов
- `@typescript-eslint/stylistic-type-checked` — стилистические правила на основе типов

Дополнительные правила:
- `no-console`, `no-alert`, `eqeqeq` — запрет опасных конструкций
- `curly` — обязательные блоки `{}` для всех `if`
- `no-var`, `prefer-const` — современный стиль
- `prefer-readonly` — иммутабельность полей
- `explicit-function-return-type` — явные возвращаемые типы
- `consistent-type-imports` — разделение типовых импортов (`import type`)
- `no-unsafe-assignment`, `no-unsafe-member-access` — безопасность типов
- `switch-exhaustiveness-check` — полнота `switch`
- `no-misused-promises` — правильная обработка Promise

Конфигурация в `.eslintrc.json`.

## Workflow: каждая доработка

Любое изменение кода должно проходить **все три этапа** перед коммитом:

```
1. npm run lint      — ESLint (0 errors, 0 warnings)
2. npm run typecheck — TypeScript (0 errors)
3. npm run test      — Vitest (100% тестов проходят)
```

Либо одной командой:

```
npm run check
```

Перед продакшен-сборкой:

```
npm run build        # check + esbuild production
```

## Сборка
- Формат: CommonJS (`format: "cjs"`)
- Цель: ES2018
- Бандлер: esbuild
- Tree-shaking включён

## Тесты
- Фреймворк: Vitest
- Все чистые функции покрыты тестами в `__tests__/helpers.test.ts`
- Тесты проверяют: корректный ввод, граничные случаи, ошибочные данные
- 36 тестов, все проходят

## Соглашения

- Код на TypeScript, строгий режим (`strictNullChecks: true`)
- Сборка: esbuild, формат CJS, target ES2018
- Без комментариев в коде (кроме JSDoc для экспортируемых функций)
- Без эмодзи в коде (кроме данных локализации и UI-элементов)
- Явные возвращаемые типы у всех функций и методов
- `import type` для типовых импортов
- Обязательные `{}` для всех `if`, `for`, `while`
