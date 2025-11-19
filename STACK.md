# Полный стек технологий и настройки деплоя AutoVed

Этот документ содержит полную информацию о технологическом стеке проекта AutoVed, настройках деплоя, Docker, базы данных, хранилища файлов и всех необходимых конфигурациях для воссоздания аналогичной инфраструктуры.

## 📋 Содержание

1. [Технологический стек](#технологический-стек)
2. [Переменные окружения](#переменные-окружения)
3. [Настройки базы данных](#настройки-базы-данных)
4. [Настройки хранилища файлов (S3)](#настройки-хранилища-файлов-s3)
5. [Настройки Telegram](#настройки-telegram)
6. [Docker конфигурация](#docker-конфигурация)
7. [Next.js конфигурация](#nextjs-конфигурация)
8. [TypeScript конфигурация](#typescript-конфигурация)
9. [Структура базы данных](#структура-базы-данных)
10. [API маршруты](#api-маршруты)
11. [Скрипты и команды](#скрипты-и-команды)
12. [Процесс деплоя](#процесс-деплоя)

---

## Технологический стек

### Frontend

- **Framework**: Next.js 15.5.0 (App Router)
- **Язык**: TypeScript 5.x (строгий режим)
- **UI библиотека**: React 19.1.0, React DOM 19.1.0
- **Стилизация**: Tailwind CSS v4 (@tailwindcss/postcss)
- **Анимации**: GSAP 3.13.0
- **Валидация форм**: Zod 4.1.3

### Backend

- **База данных**: MySQL 8.0+ (через mysql2 3.14.4)
- **Хранилище файлов**: AWS S3 (через @aws-sdk/client-s3 3.883.0)
- **Telegram интеграция**: Telegraf 4.16.3
- **Email**: Nodemailer 7.0.6 (опционально)
- **CORS**: cors 2.8.5

### Инструменты разработки

- **Менеджер пакетов**: pnpm
- **Линтинг**: ESLint 9.x с eslint-config-next 15.5.0
- **Контейнеризация**: Docker, Docker Compose
- **Node.js**: 20.x (Alpine Linux в Docker)

### Дополнительные зависимости

- **dotenv**: 17.2.2 (для переменных окружения)
- **form-data**: 4.0.4 (для работы с формами)
- **multer**: 2.0.2 (для загрузки файлов)

---

## Переменные окружения

### Обязательные переменные

Создайте файл `.env.local` или `.env` со следующими переменными:

```env
# ============================================
# Окружение
# ============================================
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com

# ============================================
# База данных MySQL
# ============================================
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=autoved

# ============================================
# AWS S3 (или S3-совместимое хранилище)
# ============================================
S3_ENDPOINT=https://s3.twcstorage.ru
S3_BUCKET_NAME=your_bucket_name
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_REGION=ru-1

# ============================================
# Telegram Bot для уведомлений
# ============================================
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# ============================================
# Telegram Parser Bot (опционально)
# ============================================
PARSER_TELEGRAM_BOT_TOKEN=your_parser_bot_token
PARSER_TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
PARSER_TELEGRAM_TARGET_CHAT_ID=your_target_chat_id
PARSER_TELEGRAM_WEBHOOK_URL=https://your-domain.com
```

### Описание переменных

#### База данных
- `DB_HOST` - хост MySQL сервера (например: `localhost`, `127.0.0.1`, или IP адрес)
- `DB_PORT` - порт MySQL (по умолчанию: `3306`)
- `DB_USER` - пользователь MySQL
- `DB_PASSWORD` - пароль пользователя MySQL
- `DB_NAME` - название базы данных

#### S3 хранилище
- `S3_ENDPOINT` - endpoint S3-совместимого хранилища (например: `https://s3.twcstorage.ru` для Timeweb Cloud)
- `S3_BUCKET_NAME` - название bucket'а
- `S3_ACCESS_KEY` - Access Key ID
- `S3_SECRET_KEY` - Secret Access Key
- `S3_REGION` - регион хранилища (например: `ru-1`)

#### Telegram
- `TELEGRAM_BOT_TOKEN` - токен основного бота для уведомлений (получить через @BotFather)
- `TELEGRAM_CHAT_ID` - ID чата/канала для отправки уведомлений
- `PARSER_TELEGRAM_BOT_TOKEN` - токен бота-парсера (опционально)
- `PARSER_TELEGRAM_WEBHOOK_SECRET` - секретный ключ для webhook
- `PARSER_TELEGRAM_TARGET_CHAT_ID` - ID чата для мониторинга сообщений
- `PARSER_TELEGRAM_WEBHOOK_URL` - URL вашего сервера для webhook

---

## Настройки базы данных

### Подключение к MySQL

Файл: `src/lib/db.ts`

```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
```

### Параметры пула соединений

- `waitForConnections: true` - ждать освобождения соединения
- `connectionLimit: 10` - максимальное количество соединений в пуле
- `queueLimit: 0` - без ограничений на очередь запросов

### Инициализация базы данных

База данных инициализируется через API endpoint:

```bash
POST /api/admin/init
```

Или напрямую через SQL:

```bash
mysql -u your_user -p your_database < src/lib/init-db.sql
```

---

## Настройки хранилища файлов (S3)

### Конфигурация S3 клиента

Файл: `src/lib/s3.ts`

```typescript
import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-1',
  endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // Обязательно для S3-совместимых сервисов
});
```

### Важные настройки

- `forcePathStyle: true` - обязательно для S3-совместимых хранилищ (Timeweb Cloud, MinIO и т.д.)
- `ACL: 'public-read'` - файлы загружаются с публичным доступом
- Путь к файлам: `autoved/${Date.now()}-${fileName}`

### Функции S3

1. **uploadFileToS3** - загрузка файла на сервер
2. **deleteFileFromS3** - удаление файла
3. **generatePresignedUploadUrl** - генерация presigned URL для прямой загрузки с клиента

### Ограничения загрузки

- Максимальный размер файла: 10MB
- Разрешенные типы: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`

---

## Настройки Telegram

### Основной бот для уведомлений

Файл: `src/lib/telegram.ts`

```typescript
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
```

### Настройка бота

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Добавьте бота в группу или канал
4. Получите Chat ID:
   - Отправьте сообщение боту
   - Используйте [@userinfobot](https://t.me/userinfobot) или проверьте логи

### Парсер бот (опционально)

Файл: `src/lib/telegramBot.ts`

Используется для мониторинга сообщений в Telegram каналах и автоматического парсинга объявлений об автомобилях.

### Настройка webhook для парсера

```bash
node scripts/setup-telegram-webhook.js
```

Или вручную через API:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/telegram/webhook",
    "secret_token": "your_webhook_secret"
  }'
```

---

## Docker конфигурация

### Dockerfile

```dockerfile
# Используем Node.js 20 Alpine для меньшего размера образа
FROM node:20-alpine AS base

# Установка зависимостей
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Установка pnpm
RUN npm install -g pnpm

# Копирование package файлов
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Сборка приложения
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Сборка
RUN pnpm build

# Production образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Права доступа для prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Копирование standalone сборки
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  autoved-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_BUCKET_NAME=${S3_BUCKET_NAME}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - S3_REGION=${S3_REGION}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
      - PARSER_TELEGRAM_BOT_TOKEN=${PARSER_TELEGRAM_BOT_TOKEN}
      - PARSER_TELEGRAM_WEBHOOK_SECRET=${PARSER_TELEGRAM_WEBHOOK_SECRET}
      - PARSER_TELEGRAM_TARGET_CHAT_ID=${PARSER_TELEGRAM_TARGET_CHAT_ID}
      - PARSER_TELEGRAM_WEBHOOK_URL=${PARSER_TELEGRAM_WEBHOOK_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
```

### Docker команды

```bash
# Сборка образа
docker build -t autoved .

# Запуск контейнера
docker run -p 3000:3000 --env-file .env.local autoved

# Запуск с Docker Compose
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

---

## Next.js конфигурация

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack для разработки
  turbopack: {
    root: __dirname,
  },
  
  // Standalone output для Docker
  output: 'standalone',
  
  // Отключена оптимизация изображений для совместимости
  images: {
    unoptimized: true,
  },
  
  // Trailing slash для URL
  trailingSlash: true,
};

export default nextConfig;
```

### Важные настройки

- `output: 'standalone'` - создает оптимизированную сборку для Docker
- `images.unoptimized: true` - отключает оптимизацию изображений Next.js (используется внешний S3)
- `trailingSlash: true` - добавляет слэш в конце URL

---

## TypeScript конфигурация

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Особенности

- Строгий режим TypeScript (`strict: true`)
- Path aliases (`@/*` для `./src/*`)
- Поддержка JSX для React
- Инкрементальная компиляция

---

## Структура базы данных

### Таблицы

#### 1. hero_slides
Слайды для главной страницы

```sql
CREATE TABLE IF NOT EXISTS hero_slides (
  id VARCHAR(255) PRIMARY KEY,
  background_image TEXT NOT NULL,
  car_name VARCHAR(255) NOT NULL,
  car_specs VARCHAR(255) NOT NULL,
  car_year VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. hero_settings
Настройки секции Hero

```sql
CREATE TABLE IF NOT EXISTS hero_settings (
  id INT PRIMARY KEY DEFAULT 1,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. promo_settings
Настройки промо-секции

```sql
CREATE TABLE IF NOT EXISTS promo_settings (
  id INT PRIMARY KEY DEFAULT 1,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 4. video_reviews
Видео-обзоры автомобилей

```sql
CREATE TABLE IF NOT EXISTS video_reviews (
  id VARCHAR(255) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  car_model VARCHAR(255) NOT NULL,
  cover_image TEXT NOT NULL,
  vk_embed_url TEXT NOT NULL,
  action VARCHAR(255) DEFAULT 'Смотреть',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 5. faq_items
Вопросы и ответы

```sql
CREATE TABLE IF NOT EXISTS faq_items (
  id VARCHAR(255) PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 6. car_cards
Карточки автомобилей

```sql
CREATE TABLE IF NOT EXISTS car_cards (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  engine VARCHAR(255) NOT NULL,
  drive VARCHAR(50) NOT NULL,
  modification VARCHAR(255) NOT NULL,
  distance VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  external_link TEXT NOT NULL,
  price VARCHAR(255) NOT NULL,
  year VARCHAR(255) NOT NULL,
  location VARCHAR(10) NOT NULL,
  is_new BOOLEAN DEFAULT FALSE,
  date VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 7. cars_settings
Настройки секции карточек

```sql
CREATE TABLE IF NOT EXISTS cars_settings (
  id INT PRIMARY KEY DEFAULT 1,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## API маршруты

### Админ API

#### GET /api/admin/data
Получение всех данных для админ-панели

**Ответ:**
```json
{
  "hero": {
    "title": "...",
    "subtitle": "...",
    "slides": [...]
  },
  "promo": {
    "title": "...",
    "subtitle": "..."
  },
  "videoReviews": [...],
  "faq": [...],
  "cards": {
    "title": "...",
    "subtitle": "...",
    "cards": [...]
  }
}
```

#### POST /api/admin/data
Сохранение изменений в секциях

**Тело запроса:**
```json
{
  "section": "hero" | "promo" | "videoReviews" | "faq" | "cards",
  "data": { ... }
}
```

#### POST /api/admin/init
Инициализация базы данных (создание таблиц и вставка дефолтных данных)

### Пользовательские API

#### POST /api/send-email
Отправка контактной формы с Telegram уведомлениями

**Тело запроса:**
```json
{
  "name": "string",
  "phone": "string",
  "country": "string",
  "budget": "string",
  "message": "string (optional)"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Заявка отправлена успешно!",
  "messageId": 12345,
  "telegramSent": true
}
```

#### POST /api/upload
Загрузка изображений в S3

**FormData:**
- `file`: File

**Ответ:**
```json
{
  "success": true,
  "url": "https://s3.../autoved/...",
  "filename": "image.jpg",
  "size": 12345,
  "type": "image/jpeg"
}
```

#### GET /api/upload
Генерация presigned URL для прямой загрузки

**Query параметры:**
- `filename`: string
- `contentType`: string (optional, default: "image/jpeg")

**Ответ:**
```json
{
  "uploadUrl": "https://s3.../presigned-url",
  "fileUrl": "https://s3.../autoved/..."
}
```

### Telegram API

#### POST /api/telegram/webhook
Webhook для получения сообщений от Telegram

#### POST /api/telegram/parse-message
Парсинг сообщений из Telegram каналов

---

## Скрипты и команды

### package.json scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack --port 3000",
    "build": "next build",
    "export": "next build && next export",
    "start": "next start --port 3000",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "setup-telegram": "node scripts/setup-telegram-webhook.js"
  }
}
```

### Команды разработки

```bash
# Установка зависимостей
pnpm install

# Запуск dev сервера
pnpm dev

# Сборка для production
pnpm build

# Запуск production сервера
pnpm start

# Статический экспорт
pnpm export

# Линтинг
pnpm lint
pnpm lint:fix

# Проверка типов
pnpm type-check
```

### Docker команды

```bash
# Сборка образа
docker build -t autoved .

# Запуск контейнера
docker run -p 3000:3000 --env-file .env.local autoved

# Docker Compose
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Настройка Telegram webhook

```bash
# Настройка webhook для парсер бота
pnpm setup-telegram
# или
node scripts/setup-telegram-webhook.js
```

---

## Процесс деплоя

### 1. Подготовка сервера

#### Требования к серверу
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Docker и Docker Compose установлены
- MySQL 8.0+ (или внешний MySQL сервер)
- Минимум 2GB RAM, 20GB диска

#### Установка Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Настройка базы данных

#### Создание базы данных

```bash
mysql -u root -p

CREATE DATABASE autoved CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'autoved_user'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON autoved.* TO 'autoved_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

#### Инициализация схемы

```bash
mysql -u autoved_user -p autoved < src/lib/init-db.sql
```

### 3. Настройка S3 хранилища

#### Создание bucket

1. Войдите в панель управления вашего S3-совместимого хранилища
2. Создайте новый bucket (например: `autoved-files`)
3. Настройте публичный доступ для чтения (если нужно)
4. Получите Access Key и Secret Key

#### Настройка CORS (если нужно)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 4. Настройка Telegram ботов

#### Основной бот для уведомлений

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен
3. Добавьте бота в группу/канал
4. Получите Chat ID

#### Парсер бот (опционально)

1. Создайте второго бота
2. Добавьте в канал с объявлениями
3. Получите Chat ID канала
4. Настройте webhook после деплоя

### 5. Подготовка проекта

#### Клонирование и настройка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/autoved.git
cd autoved

# Установка зависимостей
pnpm install

# Создание .env.local
cp .env.example .env.local
nano .env.local  # Заполните все переменные
```

### 6. Сборка и деплой

#### Вариант 1: Docker Compose (рекомендуется)

```bash
# Сборка и запуск
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

#### Вариант 2: Ручная сборка Docker

```bash
# Сборка образа
docker build -t autoved:latest .

# Запуск контейнера
docker run -d \
  --name autoved-app \
  -p 3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  autoved:latest
```

#### Вариант 3: Без Docker (Node.js напрямую)

```bash
# Сборка
pnpm build

# Запуск с PM2 (рекомендуется)
npm install -g pm2
pm2 start npm --name "autoved" -- start
pm2 save
pm2 startup
```

### 7. Настройка Nginx (опционально)

#### Конфигурация Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### SSL сертификат (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 8. Настройка Telegram webhook

После деплоя настройте webhook для парсер бота:

```bash
# На сервере
cd /path/to/autoved
node scripts/setup-telegram-webhook.js
```

### 9. Проверка работоспособности

```bash
# Проверка API
curl http://localhost:3000/api/admin/data

# Проверка инициализации БД
curl -X POST http://localhost:3000/api/admin/init

# Проверка переменных окружения (безопасно)
curl http://localhost:3000/api/test-env
```

### 10. Мониторинг и логи

#### Docker логи

```bash
docker-compose logs -f autoved-app
```

#### PM2 логи (если используется)

```bash
pm2 logs autoved
```

#### Nginx логи

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Дополнительные настройки

### Оптимизация производительности

1. **Кэширование**: Настройте Redis для кэширования (опционально)
2. **CDN**: Используйте CDN для статических файлов
3. **Сжатие**: Включите gzip/brotli в Nginx
4. **Мониторинг**: Настройте мониторинг (Prometheus, Grafana)

### Безопасность

1. **Firewall**: Настройте UFW или iptables
2. **SSL**: Обязательно используйте HTTPS
3. **Переменные окружения**: Никогда не коммитьте `.env.local`
4. **База данных**: Используйте сильные пароли
5. **S3**: Ограничьте права доступа к bucket

### Резервное копирование

#### База данных

```bash
# Создание бэкапа
mysqldump -u autoved_user -p autoved > backup_$(date +%Y%m%d).sql

# Восстановление
mysql -u autoved_user -p autoved < backup_20240101.sql
```

#### Автоматический бэкап (cron)

```bash
# Добавить в crontab
0 2 * * * mysqldump -u autoved_user -p'password' autoved > /backups/autoved_$(date +\%Y\%m\%d).sql
```

---

## Полезные ссылки

- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [AWS S3 SDK](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Telegraf Documentation](https://telegraf.js.org/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

## Поддержка

При возникновении проблем:

1. Проверьте логи приложения
2. Проверьте переменные окружения
3. Убедитесь, что все сервисы запущены
4. Проверьте подключение к БД и S3
5. Проверьте настройки Telegram ботов

---

**Последнее обновление**: 2024

