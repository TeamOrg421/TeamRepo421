# 🚗 Veyo (Cars & Bids) — Онлайн-аукціон автомобілів

Сучасна веб-платформа для продажу та купівлі автомобілів через формат **онлайн-аукціонів у реальному часі** з інтеграцією банківського мікросервісу для перевірки платіжних карток.

---

## 🛠 Технологічний стек

### **Backend:**
- **.NET 8 (ASP.NET Core Web API)**
- **Entity Framework Core 8** (Code-First, MS SQL Server)
- **ASP.NET Core Identity & JWT** (із підтримкою Google OAuth 2.0)
- **ASP.NET Core SignalR** (Real-time ставки та сповіщення)
- **Hosted Background Services** (`AuctionFinalizerBackgroundService` для автозавершення лотів)
- **Azure Blob Storage / Azurite** (хмарне збереження зображень)
- **AutoMapper & Swashbuckle (Swagger UI)**

### **Frontend:**
- **React 19 + TypeScript**
- **Vite** (швидка збірка)
- **@microsoft/signalr** (клієнтський WebSocket зв'язок)
- **@react-oauth/google** (Google автентифікація)
- **Custom CSS Design System** (адаптивний UI, темні/світлі акценти)

### **Додаткові сервіси:**
- **FakeBank API / FakeBank Frontend** — банківський мікросервіс для перевірки карток, блокування коштів та обробки платежів.

---

## 🚀 Основний функціонал

1. **Автентифікація та профілі:** Реєстрація, вхід через Email/Password або Google OAuth, керування профілем, прив'язка банківських карток.
2. **Каталог та пошук:** Фільтрація авто за марками, моделями, роком випуску, станом та ціною, збереження в обране (Watchlist).
3. **Торги в реальному часі (Live Bidding):** Миттєва подача ставок без перезавантаження сторінки через SignalR, живий таймер аукціону.
4. **Подача авто на аукціон (Sell Car):** Багатокрокова форма подачі лоту із завантаженням фото в Azure Blob Storage.
5. **Панелі управління:**
   - **Seller Dashboard** — перегляд власних виставлених авто.
   - **Manager / Admin Dashboard** — модерація нових лотів перед публікацією.
   - **Leaderboard** — рейтинг активних користувачів платформи.
6. **Фонові процеси:** Автоматична фіксація закінчення аукціону, визначення переможця та сповіщення підключених клієнтів.

---

## 💻 Запуск проєкту локально

### 1. Бекенд (`backend`):
```bash
cd backend/Api
dotnet restore
dotnet run
```
*API буде доступне за адресою:* `http://localhost:5254` (або `https://localhost:7008` для Swagger).

### 2. Фронтенд (`frontend`):
```bash
cd frontend
npm install
npm run dev
```
*Клієнт буде доступний за адресою:* `http://localhost:5173`.
