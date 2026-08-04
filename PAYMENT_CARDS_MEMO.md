# Пам’ятка: картки та оплати

## Контракти й локальна БД

- `backend/Shared.Contracts/CreateBankCardDto.cs`
  - `BankCardDto`: замінив `CardNumber` на `MaskedCardNumber`, тому повний номер не повертається.
  - `PaymentRequestDto`: додав запит для FakeBank — `CardToken` і `Amount`.
  - `PaymentResultDto`: використовується банком для результату списання.

- `backend/DataAccess/Entities/BankCard.cs`
  - Прибрав локальні `CardNumber` і `Cvv`.
  - Додав `BankCardToken` (ідентифікатор картки у FakeBank) та `MaskedCardNumber`.

- `backend/DataAccess/Data/ApplicationDbContext.cs`
  - Додав Fluent-конфігурацію токена, маскованого номера та обмежень довжини.
  - Створив унікальний індекс для `BankCardToken`.

- `backend/DataAccess/Data/Migrations/20260803102214_StoreBankCardToken.cs`
  - Міграція видаляє колонку повного номера картки.
  - Додає `BankCardToken`, `MaskedCardNumber` та індекс токена.

## Основний API

- `backend/BusinessLogic/DTOs/BankCardDtos.cs`
  - `CreateBankCardDto`: залишає дані, потрібні лише одноразово для передачі у банк (`CardNumber`, `Cvv`); `Name` встановлює сервер із Identity.
  - `UpdateBankCardDto`: більше не дозволяє змінювати номер картки.
  - `BankCardDto`: повертає маскований номер без `UserId`.

- `backend/BusinessLogic/DTOs/PaymentDtos.cs`
  - `PaymentRequestDto`: запит фронтенду до основного API — локальний `CardId` і сума.
  - `PaymentResponseDto`: відповідь фронтенду про успішність, транзакцію та баланс.

- `backend/BusinessLogic/Interfaces/IBankApiClient.cs`
  - `AddBankCardAsync`: створює картку у FakeBank.
  - `PayAsync`: передає оплату у FakeBank за `CardToken`.
  - `HasBankCardAsync` прибрано: перевірка картки робиться лише в локальній БД.

- `backend/BusinessLogic/Services/BankApiClient.cs`
  - `AddBankCardAsync`: передає справжні `Cvv` і `Name` до FakeBank; повертає лише маскований номер.
  - `PayAsync`: викликає `POST api/payment/pay` і перетворює банківську відповідь на `PaymentResponseDto`.

- `backend/BusinessLogic/Services/BankCardService.cs`
  - `HasBankCardAsync`: локально перевіряє наявність картки через репозиторій; FakeBank не викликається.

- `backend/Api/Controllers/BankCardController.cs`
  - `CreateBankCard`: бере користувача з JWT/Identity, передає його ім’я як назву картки у FakeBank, а локально зберігає токен і маскований номер.
  - `GetBankCard`: повертає картку лише її власнику.
  - `GetBankCards`: без `userId` повертає картки поточного користувача; чужий `userId` дає `Forbid`.
  - `UpdateBankCard` і `DeleteBankCard`: додано перевірку власника.
  - `TryGetCurrentUserId`: дістає `userId` із `ClaimTypes.NameIdentifier`.

- `backend/Api/Controllers/PaymentController.cs`
  - `Pay`: перевіряє JWT і власника локальної картки, передає її `BankCardToken` до FakeBank та повертає результат.

## FakeBank

- `backend/FakeBank.BusinessLogic/Interfaces/IPaymentService.cs`
  - `PayAsync`: новий контракт семантичної оплати карткою.

- `backend/FakeBank.BusinessLogic/Service/PaymentService.cs`
  - `AddBankCardAsync`: прибирає пробіли/дефіси з номера та перевіряє 16 цифр, формат `MM/YY` і 3-значний CVV до збереження.
  - `ToDto(BankCard)`: повертає тільки `MaskedCardNumber`, не повний номер і не CVV.
  - `MaskCardNumber`: залишає лише останні 4 цифри у вигляді `**** **** **** 1234`.
  - `PayAsync`: перевіряє суму, блокування й баланс, списує кошти та створює транзакцію.

- `backend/FakeBank.Api/Controllers/PaymentController.cs`
  - `Pay`: новий `POST api/payment/pay`, який приймає `PaymentRequestDto` і повертає `PaymentResultDto`.

- `backend/FakeBank.BusinessLogic/Interfaces/IBankCardService.cs`
  - Прибрав `HasBankCardAsync(Guid userId)`: FakeBank не знає користувачів основного API.

- `backend/FakeBank.BusinessLogic/Service/BankCardService.cs`
  - Прибрав нереалізований `HasBankCardAsync`.

## Frontend

- `frontend/src/services/bankCards.ts`
  - `addBankCard`: `POST /api/bank-cards`.
  - `getBankCards`: `GET /api/bank-cards`.
  - `pay`: `POST /api/payments`.
  - `readJson`: читає успішну відповідь або перетворює помилку API на `Error`.

- `frontend/src/components/PaymentMethods.tsx`
  - `loadCards`: завантажує картки поточного користувача.
  - `submitCard`: передає форму додавання картки та очищає одноразові дані після успіху.
  - `submitPayment`: відправляє оплату для вибраної локальної картки.
  - Компонент показує лише масковані номери карток.

- `frontend/src/components/UserProfile.tsx`
  - Додав `PaymentMethods` на сторінку профілю авторизованого користувача.

- `frontend/src/App.css`
  - Додав стилі списку карток, форм додавання й оплати, повідомлень про успіх/помилку.

- `frontend/vite.config.ts`
  - Проксі `/api` спрямовано на основний API (`https://localhost:7110`), а не на FakeBank.
