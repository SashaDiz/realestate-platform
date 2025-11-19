# Миграция проекта на новый стек

## Что было изменено

### Архитектура
- ✅ Удален отдельный Express backend
- ✅ Бэкенд переведен на Next.js API Routes (безсерверные функции)
- ✅ База данных изменена с MongoDB на MySQL
- ✅ Хранилище файлов изменено с локального на AWS S3

### Технологический стек

#### Backend (теперь в Next.js)
- **База данных**: MySQL 8.0+ (через mysql2)
- **Хранилище файлов**: AWS S3 (через @aws-sdk/client-s3)
- **Аутентификация**: JWT (jsonwebtoken) + bcryptjs
- **API**: Next.js API Routes

#### Frontend
- **Framework**: Next.js 15.3.5 (App Router)
- **Стилизация**: Tailwind CSS v4
- **Остальное**: без изменений

### Структура проекта

#### Удалено
- `/backend` - весь старый Express backend
- `Dockerfile.backend` - Dockerfile для старого backend
- `mongo-init.js` - скрипт инициализации MongoDB

#### Добавлено
- `/frontend/src/app/api` - Next.js API routes
  - `/api/properties` - CRUD операции для недвижимости
  - `/api/auth` - аутентификация
  - `/api/upload` - загрузка файлов в S3
  - `/api/admin/init` - инициализация БД
- `/frontend/src/lib/db.ts` - подключение к MySQL
- `/frontend/src/lib/s3.ts` - клиент S3
- `/frontend/src/lib/auth.ts` - утилиты аутентификации
- `/frontend/src/lib/init-db.sql` - SQL скрипт инициализации БД

### Переменные окружения

#### Удалены
- `MONGODB_URI`
- `MONGO_INITDB_ROOT_USERNAME`
- `MONGO_INITDB_ROOT_PASSWORD`
- `MONGO_INITDB_DATABASE`

#### Добавлены
- `DB_HOST` - хост MySQL
- `DB_PORT` - порт MySQL (по умолчанию 3306)
- `DB_USER` - пользователь MySQL
- `DB_PASSWORD` - пароль MySQL
- `DB_NAME` - название базы данных
- `S3_ENDPOINT` - endpoint S3 хранилища
- `S3_BUCKET_NAME` - название bucket
- `S3_ACCESS_KEY` - Access Key для S3
- `S3_SECRET_KEY` - Secret Key для S3
- `S3_REGION` - регион S3

### Docker конфигурация

#### Изменения в docker-compose.yml
- Удален сервис `mongodb`
- Удален сервис `backend`
- Обновлен сервис `frontend` с новыми переменными окружения
- Обновлен `nginx.conf` для работы только с frontend

#### Изменения в Dockerfile.frontend
- Обновлен на Node.js 20 Alpine
- Используется standalone output для оптимизации
- Структура соответствует STACK.md

### API Endpoints

Все API endpoints остались теми же, но теперь обрабатываются Next.js API Routes:

- `GET /api/properties` - список недвижимости с фильтрацией
- `GET /api/properties/:id` - получение объекта недвижимости
- `POST /api/properties` - создание объекта (требует авторизации)
- `PUT /api/properties/:id` - обновление объекта (требует авторизации)
- `DELETE /api/properties/:id` - удаление объекта (требует авторизации)
- `PATCH /api/properties/:id/featured` - переключение featured статуса
- `POST /api/properties/:id/submit` - инкремент счетчика отправок
- `GET /api/properties/stats/types` - статистика по типам
- `POST /api/auth/login` - вход администратора
- `POST /api/auth/logout` - выход
- `GET /api/auth/check` - проверка авторизации
- `POST /api/upload` - загрузка файла в S3
- `GET /api/upload` - получение presigned URL
- `POST /api/admin/init` - инициализация базы данных

### Миграция данных

Если у вас есть данные в MongoDB, их нужно мигрировать в MySQL:

1. Экспортируйте данные из MongoDB
2. Преобразуйте формат данных в соответствии с новой схемой MySQL
3. Импортируйте данные в MySQL

### Инициализация базы данных

После настройки переменных окружения выполните:

```bash
POST /api/admin/init
```

Это создаст необходимые таблицы в MySQL.

### Запуск проекта

1. Установите зависимости:
```bash
cd frontend
npm install
```

2. Настройте переменные окружения (создайте `.env` на основе `.env.example`)

3. Запустите через Docker Compose:
```bash
docker-compose up -d --build
```

Или локально:
```bash
cd frontend
npm run dev
```

### Важные замечания

1. **Координаты**: В MySQL координаты хранятся как отдельные поля `latitude` и `longitude`, а не как массив
2. **Изображения**: Изображения хранятся как JSON массив строк (URL из S3)
3. **investmentReturn**: Теперь хранится как число (DECIMAL), а не строка
4. **ID**: Используются UUID вместо MongoDB ObjectId

### Совместимость

- Все API endpoints сохранили совместимость с фронтендом
- Структура данных Property осталась той же (кроме внутреннего представления)
- Аутентификация работает через cookies и JWT токены

