import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'EN' | 'UA';
type TranslationKey = keyof typeof translations.EN;

const translations = {
  EN: {
    auctions: 'Auctions',
    sellCar: 'Sell your car',
    about: "What's VEYO?",
    leaderboard: 'Leaderboard',
    search: 'Search for car or model',
    notifications: 'Notifications',
    noNotifications: 'No notifications yet.',
    signInNotifications: 'Sign in to see notifications.',
    profile: 'Profile',
    adminPanel: 'Admin Panel',
    managerDashboard: 'Manager Dashboard',
    chats: 'Chats',
    watchList: 'Watch List',
    sellerDashboard: 'Seller Dashboard',
    settings: 'Settings',
    signInRegister: 'Sign In / Register',
    signOut: 'Sign Out',
    featuredAuction: 'FEATURED AUCTION',
    discoverCar: 'Discover your next car',
    browseLive: 'Browse live vehicle auctions from verified sellers.',
    auctionsTitle: 'Auctions',
    resultsFor: 'Results for',
    endingSoon: 'Ending soon',
    newlyListed: 'Newly listed',
    lowestMileage: 'Lowest mileage',
    highestBid: 'Highest bid',
    year: 'Year',
    transmission: 'Transmission',
    bodyType: 'Body type',
    clearFilters: 'Clear filters',
    noAuctions: 'No auctions found',
    tryAnother: 'Try another search or clear the selected filters.',
    howItWorks: 'HOW IT WORKS',
    sellers: 'SELLERS',
    helpfulLinks: 'HELPFUL LINKS',
    safePay: 'SafePay',
    buyingCar: 'Buying a Car',
    sellingCar: 'Selling a Car',
    finalizingSale: 'Finalizing the Sale',
    faqs: 'FAQs',
    submitCar: 'Submit Your Car',
    dashboard: 'Dashboard',
    certifiedSellers: 'Certified Sellers',
    photoGuide: 'Photo Guide',
    bookPhotoShoot: 'Book a Photo Shoot',
    inspections: 'Inspections',
    by: 'by',
    youHoldHighestBid: 'You hold highest bid',
    noBio: 'This user has not added a bio yet.',
    loadingProfile: 'Loading profile...', userNotFound: 'User not found.', backToLeaderboard: 'Back to leaderboard',
    communityMember: 'Community member', unnamedUser: 'Unnamed user', joined: 'Joined', listings: 'Listings',
    activeNow: 'Active now', completed: 'Completed', bids: 'Bids', auctionWins: 'Auction wins', comments: 'Comments', garage: 'Garage',
    loadingVehicle: 'Loading vehicle...', loadingAuctionDetails: 'Please wait while we load the auction details.',
    vehicleNotFound: 'Vehicle Not Found', carNotFoundDetails: 'The requested car could not be located in our auctions database.',
    backToHome: 'Back to Home', watching: 'Watching', watch: 'Watch', share: 'Share', linkCopied: 'Link copied to clipboard!',
    views: 'Views', bidsCount: 'Bids count', previousPhoto: 'Previous photo', nextPhoto: 'Next photo',
    auctionAwaitingApproval: 'Auction not started yet · awaiting admin approval', listingRejected: 'Listing rejected',
    auctionCanceled: 'Auction canceled', youWonAuction: 'You Won this Auction!', auctionEnded: 'Auction Ended',
    soldFor: 'Sold for', noBids: 'No Bids', placeBid: 'Place Bid', brand: 'Brand', model: 'Model', mileage: 'Mileage',
    titleStatus: 'Title Status', clean: 'Clean', location: 'Location', seller: 'Seller', engine: 'Engine', drivetrain: 'Drivetrain',
    transmissionLabel: 'Transmission', bodyStyle: 'Body Style', exteriorColor: 'Exterior Color', interiorColor: 'Interior Color', sellerType: 'Seller Type',
    sellerChats: 'Seller chats', chatsWithManagers: 'Chats with managers', signInToContactManager: 'Sign in to contact the VEYO manager.',
    noConversationsDetails: 'No conversations yet. A chat opens when a manager requests information about your listing.',
    conversationAbout: 'Conversation about', startConversation: 'Start the conversation by asking for the missing details.',
    writeMessage: 'Write a message…', send: 'Send', you: 'You', selectConversation: 'Select a conversation to view messages.',
    topAuctionWinners: 'Top Auction Winners', leaderboardDescription: 'Ranking of top users by total winning bids volume on Veyo.',
    leaderboardDemo: 'No completed auctions with registered winners in the database yet. Showing leaderboard preview data below.',
    loadingLeaderboard: 'Loading leaderboard...', win: 'win', wins: 'wins', noVehicleHistory: 'No vehicle history',
    leaderboardEmpty: 'Leaderboard is empty', noFinishedAuctions: 'No auctions have finished with a winner yet.',
    signIn: 'Sign In', signInManageListings: 'Sign in to manage your listings.', timeLeft: 'Time left', currentBid: 'Current bid',
    ended: 'Ended', willBePublishedOn: 'Will be published on', listingNeedsChanges: 'Listing needs changes',
    noAdditionalInfo: 'No additional information needed.', loadingListings: 'Loading your listings...', noPhoto: 'No photo',
    seeComment: 'See comment', noCommentsYet: 'No comments yet.', noLiveAuctions: 'No live auctions right now.',
    noPastListings: 'No past listings yet.', noListingsProgress: 'No listings in progress.',
    recently: 'Recently', edit: 'Edit', copied: 'Copied!', editBio: 'Edit bio', cards: 'Cards',
    registeredBidder: 'Registered Bidder', followers: 'Followers', following: 'Following', bidHistory: 'Bid History',
    bidOn: 'Bid on', car: 'car', cars: 'cars', bidTo: 'bid to', showMore: 'Show more', noBidsPlaced: 'No bids placed yet',
    biddingHistoryEmpty: 'When you bid on live auctions, your bidding history will appear here.', auctionComments: 'Auction Comments',
    comment: 'comment', commentsLower: 'comments', commentsHistoryEmpty: 'Comments you post on vehicle listings will be displayed here.',
    paymentCards: 'Payment cards',
  },
  UA: {
    auctions: 'Аукціони',
    sellCar: 'Продати авто',
    about: 'Що таке VEYO?',
    leaderboard: 'Лідерборд',
    search: 'Пошук авто або моделі',
    notifications: 'Сповіщення',
    noNotifications: 'Сповіщень поки немає.',
    signInNotifications: 'Увійдіть, щоб переглянути сповіщення.',
    profile: 'Профіль',
    adminPanel: 'Панель адміністратора',
    managerDashboard: 'Панель менеджера',
    chats: 'Чати',
    watchList: 'Обране',
    sellerDashboard: 'Панель продавця',
    settings: 'Налаштування',
    signInRegister: 'Увійти / Зареєструватися',
    signOut: 'Вийти',
    featuredAuction: 'РЕКОМЕНДОВАНИЙ АУКЦІОН',
    discoverCar: 'Знайдіть своє наступне авто',
    browseLive: 'Переглядайте активні аукціони від перевірених продавців.',
    auctionsTitle: 'Аукціони',
    resultsFor: 'Результати для',
    endingSoon: 'Завершуються скоро',
    newlyListed: 'Нові оголошення',
    lowestMileage: 'Найменший пробіг',
    highestBid: 'Найвища ставка',
    year: 'Рік',
    transmission: 'Коробка передач',
    bodyType: 'Тип кузова',
    clearFilters: 'Очистити фільтри',
    noAuctions: 'Аукціонів не знайдено',
    tryAnother: 'Спробуйте інший пошук або очистіть фільтри.',
    howItWorks: 'ЯК ЦЕ ПРАЦЮЄ',
    sellers: 'ПРОДАВЦЯМ',
    helpfulLinks: 'КОРИСНІ ПОСИЛАННЯ',
    safePay: 'Безпечна оплата',
    buyingCar: 'Купівля авто',
    sellingCar: 'Продаж авто',
    finalizingSale: 'Завершення продажу',
    faqs: 'Поширені питання',
    submitCar: 'Додати авто',
    dashboard: 'Панель',
    certifiedSellers: 'Перевірені продавці',
    photoGuide: 'Поради щодо фото',
    bookPhotoShoot: 'Замовити фотосесію',
    inspections: 'Перевірки',
    by: 'від',
    youHoldHighestBid: 'Ваша ставка найвища',
    noBio: 'Цей користувач ще не додав опис.',
    loadingProfile: 'Завантаження профілю...', userNotFound: 'Користувача не знайдено.', backToLeaderboard: 'До лідерборда',
    communityMember: 'Учасник спільноти', unnamedUser: 'Користувач без імені', joined: 'Приєднався', listings: 'Оголошення',
    activeNow: 'Активні зараз', completed: 'Завершені', bids: 'Ставки', auctionWins: 'Перемоги в аукціонах', comments: 'Коментарі', garage: 'Гараж',
    loadingVehicle: 'Завантаження авто...', loadingAuctionDetails: 'Зачекайте, завантажуємо деталі аукціону.',
    vehicleNotFound: 'Авто не знайдено', carNotFoundDetails: 'Запитане авто не знайдено в базі аукціонів.',
    backToHome: 'На головну', watching: 'В обраному', watch: 'Стежити', share: 'Поділитися', linkCopied: 'Посилання скопійовано!',
    views: 'Перегляди', bidsCount: 'Кількість ставок', previousPhoto: 'Попереднє фото', nextPhoto: 'Наступне фото',
    auctionAwaitingApproval: 'Аукціон ще не розпочався · очікує підтвердження адміністратора', listingRejected: 'Оголошення відхилено',
    auctionCanceled: 'Аукціон скасовано', youWonAuction: 'Ви виграли цей аукціон!', auctionEnded: 'Аукціон завершено',
    soldFor: 'Продано за', noBids: 'Ставок немає', placeBid: 'Зробити ставку', brand: 'Марка', model: 'Модель', mileage: 'Пробіг',
    titleStatus: 'Статус документів', clean: 'Чисті', location: 'Місцезнаходження', seller: 'Продавець', engine: 'Двигун', drivetrain: 'Привід',
    transmissionLabel: 'Коробка передач', bodyStyle: 'Тип кузова', exteriorColor: 'Зовнішній колір', interiorColor: 'Колір салону', sellerType: 'Тип продавця',
    sellerChats: 'Чати продавця', chatsWithManagers: 'Чати з менеджерами', signInToContactManager: 'Увійдіть, щоб зв’язатися з менеджером VEYO.',
    noConversationsDetails: 'Розмов поки немає. Чат відкриється, коли менеджер запросить інформацію про ваше оголошення.',
    conversationAbout: 'Розмова про', startConversation: 'Почніть розмову, запитавши необхідні деталі.',
    writeMessage: 'Напишіть повідомлення…', send: 'Надіслати', you: 'Ви', selectConversation: 'Виберіть розмову, щоб переглянути повідомлення.',
    topAuctionWinners: 'Топ переможців аукціонів', leaderboardDescription: 'Рейтинг користувачів за загальною сумою переможних ставок на Veyo.',
    leaderboardDemo: 'У базі ще немає завершених аукціонів із переможцями. Нижче показано демонстраційні дані.',
    loadingLeaderboard: 'Завантаження лідерборда...', win: 'перемога', wins: 'перемог', noVehicleHistory: 'Історії авто немає',
    leaderboardEmpty: 'Лідерборд порожній', noFinishedAuctions: 'Ще немає аукціонів із визначеним переможцем.',
    signIn: 'Увійти', signInManageListings: 'Увійдіть, щоб керувати своїми оголошеннями.', timeLeft: 'Залишилось часу', currentBid: 'Поточна ставка',
    ended: 'Завершено', willBePublishedOn: 'Буде опубліковано', listingNeedsChanges: 'Оголошення потребує змін',
    noAdditionalInfo: 'Додаткова інформація не потрібна.', loadingListings: 'Завантаження оголошень...', noPhoto: 'Немає фото',
    seeComment: 'Переглянути коментар', noCommentsYet: 'Коментарів поки немає.', noLiveAuctions: 'Активних аукціонів зараз немає.',
    noPastListings: 'Минулого оголошення ще немає.', noListingsProgress: 'Оголошень у процесі немає.',
    recently: 'Нещодавно', edit: 'Редагувати', copied: 'Скопійовано!', editBio: 'Редагувати опис', cards: 'Картки',
    registeredBidder: 'Зареєстрований учасник', followers: 'Підписники', following: 'Підписки', bidHistory: 'Історія ставок',
    bidOn: 'Ставок на', car: 'авто', cars: 'авто', bidTo: 'ставка до', showMore: 'Показати ще', noBidsPlaced: 'Ставок ще немає',
    biddingHistoryEmpty: 'Історія ставок з’явиться тут після участі в активних аукціонах.', auctionComments: 'Коментарі до аукціонів',
    comment: 'коментар', commentsLower: 'коментарів', commentsHistoryEmpty: 'Ваші коментарі до оголошень відображатимуться тут.',
    paymentCards: 'Платіжні картки',
  },
} as const;

const interfaceTranslations: Record<string, string> = {
  'Back': 'Назад', 'Back to Home': 'На головну', 'Save': 'Зберегти', 'Cancel': 'Скасувати',
  'Close': 'Закрити', 'Delete': 'Видалити', 'Edit': 'Редагувати', 'Add': 'Додати',
  'Search': 'Пошук', 'Loading...': 'Завантаження...', 'Loading profile...': 'Завантаження профілю...',
  'Loading leaderboard...': 'Завантаження лідерборда...', 'Please wait...': 'Зачекайте...',
  'Sign In': 'Увійти', 'Register': 'Зареєструватися', 'Create Account': 'Створити акаунт',
  'Password': 'Пароль', 'Confirm password': 'Підтвердіть пароль', 'Email': 'Електронна пошта',
  'Name': "Ім'я", 'Phone number': 'Номер телефону', 'Current password': 'Поточний пароль',
  'New password': 'Новий пароль', 'Forgot password?': 'Забули пароль?',
  'Submit': 'Надіслати', 'Next': 'Далі', 'Previous': 'Назад', 'Clear filters': 'Очистити фільтри',
  'No auctions found': 'Аукціонів не знайдено', 'No comments yet.': 'Коментарів поки немає.',
  'No notifications yet.': 'Сповіщень поки немає.', 'No cards yet.': 'Карток поки немає.',
  'No conversations yet.': 'Розмов поки немає.', 'No listings yet.': 'Оголошень поки немає.',
  'Browse Auctions': 'Переглянути аукціони', 'View details': 'Переглянути деталі',
  'See details': 'Переглянути деталі', 'Details': 'Деталі', 'Description': 'Опис',
  'Location': 'Місцезнаходження', 'Price': 'Ціна', 'Starting price': 'Початкова ціна',
  'Current price': 'Поточна ціна', 'Current bid': 'Поточна ставка', 'Highest bid': 'Найвища ставка',
  'Place Bid': 'Зробити ставку', 'Make a bid': 'Зробити ставку', 'Bid amount': 'Сума ставки',
  'Minimum bid increment is $250. All bids in USD.': 'Мінімальний крок ставки $250. Усі ставки в USD.',
  'Auction Ended': 'Аукціон завершено', 'Auction not started yet': 'Аукціон ще не розпочався',
  'Winning bid': 'Переможна ставка', 'Bids': 'Ставки', 'Comments': 'Коментарі', 'Followers': 'Підписники',
  'Following': 'Підписки', 'Joined': 'Приєднався', 'Garage': 'Гараж', 'Community member': 'Учасник спільноти',
  'Listings': 'Оголошення', 'Active now': 'Активні зараз', 'Completed': 'Завершені',
  'Auction wins': 'Перемоги в аукціонах', 'Watch list': 'Обране', 'Watching': 'В обраному',
  'Add to favorites': 'Додати в обране', 'Remove from Watchlist': 'Видалити з обраного',
  'Live Auctions': 'Активні аукціони', 'Past Listings': 'Минулі оголошення', 'In Progress': 'У процесі',
  'New commission': 'Нові заявки', 'Approve': 'Підтвердити', 'Reject': 'Відхилити',
  'Edit listing': 'Редагувати оголошення', 'Request information': 'Запросити інформацію',
  'View Detail information': 'Переглянути деталі', 'Payment methods & Cards': 'Способи оплати та картки',
  'Your cards': 'Ваші картки', 'Add a new card': 'Додати нову картку', 'Add card': 'Додати картку',
  'Top up balance': 'Поповнити баланс', 'Deposit': 'Поповнити', 'Withdraw': 'Зняти кошти',
  'Payment completed.': 'Платіж виконано.', 'Payment failed.': 'Платіж не виконано.',
  'Balance': 'Баланс', 'Default': 'Основна', 'Settings': 'Налаштування', 'Profile': 'Профіль',
  'Share': 'Поділитися', 'Copied!': 'Скопійовано!', 'Edit bio': 'Редагувати опис', 'Cards': 'Картки',
  'Watchlist': 'Обране', 'Ending soon': 'Завершуються скоро', 'New cars': 'Нові авто',
  'Inspected': 'Перевірені', 'No reserve': 'Без резерву',
  'Sign in to view your Watchlist': 'Увійдіть, щоб переглянути обране',
  'Save your favorite cars and track active auctions in real time.': 'Зберігайте улюблені авто та стежте за активними аукціонами в реальному часі.',
  'User menu': 'Меню користувача', 'Notifications': 'Сповіщення', 'Previous photo': 'Попереднє фото',
  'Next photo': 'Наступне фото', 'No vehicle history': 'Історії авто немає', 'Unknown': 'Невідомо',
  'Your Watchlist is empty': 'Ваш список обраного порожній',
  'Explore active auctions and click the heart icon on any car to track its bidding progress.': 'Переглядайте активні аукціони та натискайте на сердечко, щоб стежити за ставками.',
  'No watched cars matching the filter.': 'Немає обраних авто, що відповідають фільтру.',
  'Chats with managers': 'Чати з менеджерами', 'Seller chats': 'Чати продавця', 'Chats': 'Чати',
  'Sign in to contact the VEYO manager.': 'Увійдіть, щоб зв’язатися з менеджером VEYO.',
  'No conversations yet. A chat opens when a manager requests information about your listing.': 'Розмов поки немає. Чат відкриється, коли менеджер запросить інформацію про ваше оголошення.',
  'Conversation about': 'Розмова про', 'Start the conversation by asking for the missing details.': 'Почніть розмову, запитавши необхідні деталі.',
  'Select a conversation to view messages.': 'Виберіть розмову, щоб переглянути повідомлення.',
  'Write a message…': 'Напишіть повідомлення…', 'Send': 'Надіслати', 'You': 'Ви',
  'Dashboard': 'Панель керування', 'Seller Dashboard': 'Панель продавця',
  'Live auction': 'Активний аукціон', 'Time left': 'Залишилось часу', 'Sold for': 'Продано за',
  'Ended': 'Завершено', 'No additional information needed.': 'Додаткова інформація не потрібна.',
  'Listing needs changes': 'Оголошення потребує змін', 'No live auctions right now.': 'Активних аукціонів зараз немає.',
  'No past listings yet.': 'Минулого оголошення ще немає.', 'No listings in progress.': 'Оголошень у процесі немає.',
  'Open chat': 'Відкрити чат', 'See comment': 'Переглянути коментар', 'Sell a car': 'Продати авто',
  'Approving…': 'Підтвердження…',
  'No auctions are waiting for review.': 'Немає аукціонів, що очікують перевірки.', 'No auctions are currently running.': 'Активних аукціонів зараз немає.',
  'Loading submissions...': 'Завантаження заявок...', 'Loading active auctions...': 'Завантаження активних аукціонів...',
  'Top Auction Winners': 'Топ переможців аукціонів', 'Leaderboard': 'Лідерборд',
  'Ranking of top users by total winning bids volume on Veyo.': 'Рейтинг користувачів за загальною сумою переможних ставок на Veyo.',
  'No completed auctions with registered winners in the database yet. Showing leaderboard preview data below.': 'У базі ще немає завершених аукціонів із переможцями. Нижче показано демонстраційні дані.',
  'Leaderboard is empty': 'Лідерборд порожній',
  'No auctions have finished with a winner yet.': 'Ще немає аукціонів із визначеним переможцем.',
  'Loading vehicle...': 'Завантаження авто...', 'Please wait while we load the auction details.': 'Зачекайте, завантажуємо деталі аукціону.',
  'Vehicle Not Found': 'Авто не знайдено', 'The requested car could not be located in our auctions database.': 'Запитане авто не знайдено в базі аукціонів.',
  'Watch': 'Стежити', 'Views': 'Перегляди', 'Bids count': 'Кількість ставок',
  'You Won this Auction!': 'Ви виграли цей аукціон!', 'You hold highest bid': 'Ваша ставка найвища',
  'Brand': 'Марка', 'Model': 'Модель', 'Mileage': 'Пробіг', 'VIN': 'VIN', 'Title Status': 'Статус документів',
  'Clean': 'Чисті', 'Seller': 'Продавець', 'Engine': 'Двигун', 'Drivetrain': 'Привід', 'Transmission': 'Коробка передач',
  'Body Style': 'Тип кузова', 'Exterior Color': 'Зовнішній колір', 'Interior Color': 'Колір салону', 'Seller Type': 'Тип продавця',
  'Current highest bid': 'Поточна найвища ставка', 'Bid history': 'Історія ставок', 'bid': 'ставка', 'bids': 'ставок',
  'Other auctions': 'Інші аукціони', 'No bids have been placed yet.': 'Ставок ще не зроблено.', 'No bids yet. Be the first to place one.': 'Ставок ще немає. Будьте першим.',
  'Leave a Comment below': 'Залиште коментар нижче', 'Sign in to leave a comment': 'Увійдіть, щоб залишити коментар',
  'Send comment': 'Надіслати коментар', 'Bid': 'Ставка', 'Reply': 'Відповісти',
  'No comments in this section yet.': 'У цьому розділі ще немає коментарів.',
  'About VEYO': 'Про VEYO', 'How It Works': 'Як це працює', 'Buying a Car': 'Купівля авто', 'Selling a Car': 'Продаж авто',
  'Finalizing the Sale': 'Завершення продажу', 'Low Fees, Full Gains': 'Низькі комісії, більше вигоди',
  'Know Your Car, Buy With Confidence': 'Знайте своє авто та купуйте впевнено', 'Fast, Easy, Exciting': 'Швидко, просто, захопливо',
  'Account': 'Акаунт', 'Account & Security': 'Акаунт і безпека', 'Appearance': 'Вигляд', 'Account details': 'Дані акаунта',
  'Choose the theme you prefer to use on this device.': 'Виберіть тему для цього пристрою.', 'Dark': 'Темна', 'Light': 'Світла',
  'Save account details': 'Зберегти дані акаунта', 'Saving…': 'Збереження…', 'Manage your profile, contact information and login security.': 'Керуйте профілем, контактами та безпекою входу.',
  'Manage your linked bank cards, check balances, and top up funds for auctions.': 'Керуйте банківськими картками, перевіряйте баланс і поповнюйте кошти для аукціонів.',
  'Select card:': 'Виберіть картку:', 'Quick amount preset:': 'Швидка сума:', 'Amount ($):': 'Сума ($):',
  'Test payment deduction': 'Тестове списання', 'Pay / Deduct': 'Оплатити / списати',
  'Welcome back': 'З поверненням', 'Sign Up': 'Зареєструватися', 'Remember me': 'Запам’ятати мене', 'or': 'або',
  'Create password': 'Створіть пароль', 'Forgot Password?': 'Забули пароль?',
  'VEYO Car Auctions': 'Автомобільні аукціони VEYO', 'Frequently asked questions': 'Поширені питання',
  'Ready to join the action?': 'Готові долучитися?', 'Check your email': 'Перевірте пошту',
  'Create new password': 'Створіть новий пароль', 'Your password has been changed': 'Ваш пароль змінено',
};

const translateDom = (language: Language) => {
  const dictionary = language === 'UA' ? interfaceTranslations : Object.fromEntries(Object.entries(interfaceTranslations).map(([english, ukrainian]) => [ukrainian, english]));
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) textNodes.push(node as Text);
  textNodes.forEach((textNode) => {
    const value = textNode.nodeValue?.trim();
    if (!value || textNode.parentElement?.closest('script,style')) return;
    let replacement = dictionary[value];
    if (language === 'UA') {
      replacement = replacement
        ?? value.replace(/^Total bids:\s*/i, 'Загальна сума ставок: ')
        .replace(/^Joined\s+/i, 'Приєднався ')
        .replace(/^Current highest bid$/i, 'Поточна найвища ставка');
    }
    if (replacement) textNode.nodeValue = textNode.nodeValue!.replace(value, replacement);
  });

  document.querySelectorAll<HTMLElement>('[placeholder], [title], [aria-label]').forEach((element) => {
    (['placeholder', 'title', 'aria-label'] as const).forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value && dictionary[value]) element.setAttribute(attribute, dictionary[value]);
    });
  });
};

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('language') === 'UA' ? 'UA' : 'EN');
  const toggleLanguage = () => setLanguage(current => {
    const next = current === 'EN' ? 'UA' : 'EN';
    localStorage.setItem('language', next);
    return next;
  });
  const t = (key: TranslationKey) => translations[language][key];

  useEffect(() => {
    translateDom(language);
    const observer = new MutationObserver(() => translateDom(language));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return <LanguageContext.Provider value={{ language, toggleLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
