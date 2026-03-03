# BLADE & STYLE — Публичный сайт барбершопа

Полноценный публичный сайт барбершопа с онлайн-записью.  
Стек: **React** (frontend) + **Node.js/Express** (backend API) + **PostgreSQL** (база данных).

---

## 📁 Структура проекта

```
barbershop/
├── client/          # React-приложение (публичный сайт)
│   ├── public/
│   └── src/
│       ├── components/   # Layout, Navbar, Footer
│       ├── pages/        # HomePage, MastersPage, PricePage, ContactsPage, BookingPage
│       └── utils/api.js  # Запросы к API
├── server/          # Express API + PostgreSQL
│   └── index.js     # Все API-маршруты + инициализация БД
├── .env.example
└── package.json     # Корневой (запуск обоих приложений)
```

---

## 🚀 Установка и запуск

### 1. Требования
- Node.js v18+
- PostgreSQL v14+
- npm v9+

### 2. Клонировать / распаковать проект

```bash
# Перейти в папку проекта
cd barbershop
```

### 3. Установить зависимости

```bash
npm install          # корневые (concurrently)
cd server && npm install
cd ../client && npm install
cd ..
```

### 4. Создать базу данных PostgreSQL

```bash
psql -U postgres
CREATE DATABASE barbershop;
\q
```

### 5. Настроить переменные окружения

```bash
# Создать файл server/.env
cp .env.example server/.env
# Отредактировать DATABASE_URL в server/.env
```

В `server/.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/barbershop
PORT=3001
```

В `client/.env` (создать при необходимости):
```
REACT_APP_API_URL=http://localhost:3001/api
```

### 6. Запуск в режиме разработки

```bash
npm run dev
```

Откроется:
- Сайт: http://localhost:3000
- API: http://localhost:3001

> При первом запуске сервер автоматически создаст все таблицы и заполнит тестовыми данными (мастера, услуги, расписание).

---

## 🌐 Деплой на хостинг

### Вариант A: VPS (рекомендуется)

**1. Собрать клиент:**
```bash
cd client && npm run build
```

**2. Раздавать build через nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/barbershop/client/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

**3. Запустить сервер через PM2:**
```bash
npm install -g pm2
cd server && pm2 start index.js --name "barbershop-api"
pm2 save && pm2 startup
```

### Вариант B: Платформы (Render, Railway, Heroku)

- Backend: задеплоить папку `server/` как Node.js-сервис
- Frontend: задеплоить папку `client/` как Static Site (build command: `npm run build`)
- Установить переменные окружения в настройках платформы

---

## 🔌 API-эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/masters` | Список активных мастеров |
| GET | `/api/services` | Список услуг с ценами |
| GET | `/api/settings` | Настройки салона |
| GET | `/api/slots?master_id=1&date=2024-01-15` | Свободные слоты |
| POST | `/api/appointments` | Создать запись |
| GET | `/api/health` | Проверка доступности сервера |

---

## 📋 Страницы сайта

| URL | Страница |
|-----|----------|
| `/` | Главная — hero, о нас, услуги, CTA |
| `/masters` | Мастера с фото и описаниями |
| `/price` | Прайс-лист (из БД) |
| `/contacts` | Адрес, часы работы, телефон |
| `/booking` | Онлайн-запись (4 шага) |

---

## 🎨 Дизайн

Тёмная luxury-эстетика: чёрный фон + золотые акценты.  
Шрифты: Bebas Neue (заголовки) + Libre Baskerville (serif) + DM Sans (текст).  
Полностью адаптивный (mobile-first).

---

## 🔜 Следующий этап

По ТЗ следует разработать **CRM-часть** (административная панель):
- Авторизация (роли: Администратор, Мастер)
- Календарь записей
- База клиентов
- Управление мастерами и услугами
- Рассылки

---

## 📞 Поддержка

При вопросах по установке — обратитесь к разработчику.
