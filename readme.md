# WB Tariffs Service

Сервис для регулярного получения тарифов Wildberries и обновления Google таблиц.

## Требования

- Docker
- Docker Compose

## Настройка

1. Склонируйте репозиторий
2. Создайте файл `.env` на основе `.env.example`
3. Заполните необходимые переменные окружения:

```env
WB_API_TOKEN=your_wb_api_token
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key
SPREADSHEET_IDS=spreadsheet_id_1,spreadsheet_id_2
```

4. Запустите приложение:

```bash
docker compose up
```

## Переменные окружения

- WB_API_TOKEN - Токен для доступа к API Wildberries
- GOOGLE_SERVICE_ACCOUNT_EMAIL - Email сервисного аккаунта Google
- GOOGLE_PRIVATE_KEY - Приватный ключ сервисного аккаунта
- SPREADSHEET_IDS - ID Google таблиц через запятую

## Успешный запуск

В логах вы должны увидеть:

```text
app       | Starting application...
app       | Waiting for PostgreSQL to be ready...
app       | Successfully connected to PostgreSQL
app       | Running migrations...
app       | Running seeds...
app       | All migrations and seeds have been run
app       | WB token format appears valid
app       | Running tariff job immediately...
app       | Fetching tariffs for date: 20XX-XX-XX
app       | Using WB token: eyJhbGciOi...
app       | API Response status: 200
app       | Successfully fetched X tariffs
app       | Sample: ...
app       | Successfully saved X tariffs for date: 20XX-XX-XX
app       | Immediate tariff job completed successfully
app       | Tariff job started. Will run every hour at minute 0.
app       | Google Sheets job started. Will run every 30 minutes.
app       | Application started successfully
```

## Очистка и перезапуск

```bash
docker compose down
docker volume rm btlz-wb-test_postgres-vol
docker compose up --build
```

## Функциональность

- Ежечасное получение тарифов с WB API
- Сохранение тарифов в PostgreSQL
- Обновление Google таблиц каждые 30 минут
- Данные сортируются по возрастанию коэффициента
- Автоматическое создание фильтров в таблицах

## Структура базы данных

Таблица wb_tariffs содержит:

- Данные тарифов за каждый день
- Уникальный индекс по комбинации даты и параметров тарифа
- Автоматическое обновление записей за текущий день

## Google Таблицы

Данные обновляются в листе stocks_coefs с:

- Заголовками столбцов
- Автоматическими фильтрами
- Сортировкой по тарифу