# 3D конфигуратор поездов

Монорепо состоит из двух частей:
- `configurator-main` - библиотека `@univer/configurator`
- `example-main` - пример приложения, которое использует библиотеку

## Требования

- Node.js LTS (рекомендуется 20+)
- npm 10+

Проверка версий:

```bash
node -v
npm -v
```

## Установка и подготовка

Запускать из корня репозитория:

```bash
cd configurator-main
npm i
npm run build
cd ../example-main
npm i
```

## Запуск в режиме разработки

```bash
cd example-main
npm run dev
```

## Production-сборка

```bash
cd example-main
npm run build
npm run preview
```

Альтернатива: раздать папку `dist` через любой статический сервер (например, ```python -m http.server 3000 -d dist``` или ```npx --yes serve -s dist```).

## Troubleshooting

### 1) `module not found` / пакет не находится

Причина: зависимости не установлены в одной из папок.

Решение:

```bash
cd configurator-main
npm install
npm run build
cd ../example-main
npm install
```

### 2) Ошибка импорта `@univer/configurator`

Причина: библиотека не собрана.

Решение:

```bash
cd configurator-main
npm run build
```

### 3) Конфликты зависимостей после обновлений

Причина: поврежденный кэш/lock-файл/`node_modules`.

Решение:

```bash
npx --yes rimraf "configurator-main/node_modules" "configurator-main/package-lock.json" "example-main/node_modules" "example-main/package-lock.json"
cd configurator-main
npm install
cd ../example-main
npm install
```

### 4) `EADDRINUSE` (порт занят)

Причина: порт dev/preview уже используется.

Решение:

```bash
cd example-main
npm run dev -- --port 5174
```
