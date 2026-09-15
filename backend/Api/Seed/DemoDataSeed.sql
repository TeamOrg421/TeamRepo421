-- Demo data seed: populates Leaderboard, Manager Dashboard (New Commission / In Progress),
-- Watchlist tabs (Auctions / Ending soon / New cars / Inspected / No reserve) and
-- Seller Dashboard tabs (In Progress / Live Auctions / Comments / Past Listings)
-- for the account ad1379125@gmail.com. Safe to re-run: brand/model lookups are guarded,
-- but listing/user inserts are one-time (run once).

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @TargetUserId UNIQUEIDENTIFIER = (SELECT Id FROM AspNetUsers WHERE Email = 'ad1379125@gmail.com');
IF @TargetUserId IS NULL
BEGIN
    RAISERROR('Target user ad1379125@gmail.com not found.', 16, 1);
    RETURN;
END

------------------------------------------------------------
-- 1. Dummy users: 5 auction winners (leaderboard) + 1 showroom seller (watchlist cars)
------------------------------------------------------------
DECLARE @Winner1 UNIQUEIDENTIFIER, @Winner2 UNIQUEIDENTIFIER, @Winner3 UNIQUEIDENTIFIER,
        @Winner4 UNIQUEIDENTIFIER, @Winner5 UNIQUEIDENTIFIER, @ShowroomSeller UNIQUEIDENTIFIER;

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Email = 'winner1.demo@example.com')
    INSERT INTO AspNetUsers (Id, Name, CreatedAt, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount)
    VALUES (NEWID(), 'Alex Turner', GETUTCDATE(), 'winner1.demo@example.com', 'WINNER1.DEMO@EXAMPLE.COM', 'winner1.demo@example.com', 'WINNER1.DEMO@EXAMPLE.COM', 1, 0, 0, 1, 0);
SET @Winner1 = (SELECT Id FROM AspNetUsers WHERE Email = 'winner1.demo@example.com');

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Email = 'winner2.demo@example.com')
    INSERT INTO AspNetUsers (Id, Name, CreatedAt, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount)
    VALUES (NEWID(), 'Maria Ivanova', GETUTCDATE(), 'winner2.demo@example.com', 'WINNER2.DEMO@EXAMPLE.COM', 'winner2.demo@example.com', 'WINNER2.DEMO@EXAMPLE.COM', 1, 0, 0, 1, 0);
SET @Winner2 = (SELECT Id FROM AspNetUsers WHERE Email = 'winner2.demo@example.com');

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Email = 'winner3.demo@example.com')
    INSERT INTO AspNetUsers (Id, Name, CreatedAt, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount)
    VALUES (NEWID(), 'Chris Park', GETUTCDATE(), 'winner3.demo@example.com', 'WINNER3.DEMO@EXAMPLE.COM', 'winner3.demo@example.com', 'WINNER3.DEMO@EXAMPLE.COM', 1, 0, 0, 1, 0);
SET @Winner3 = (SELECT Id FROM AspNetUsers WHERE Email = 'winner3.demo@example.com');

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Email = 'winner4.demo@example.com')
    INSERT INTO AspNetUsers (Id, Name, CreatedAt, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount)
    VALUES (NEWID(), 'Sofia Rossi', GETUTCDATE(), 'winner4.demo@example.com', 'WINNER4.DEMO@EXAMPLE.COM', 'winner4.demo@example.com', 'WINNER4.DEMO@EXAMPLE.COM', 1, 0, 0, 1, 0);
SET @Winner4 = (SELECT Id FROM AspNetUsers WHERE Email = 'winner4.demo@example.com');

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Email = 'winner5.demo@example.com')
    INSERT INTO AspNetUsers (Id, Name, CreatedAt, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount)
    VALUES (NEWID(), 'Daniel Becker', GETUTCDATE(), 'winner5.demo@example.com', 'WINNER5.DEMO@EXAMPLE.COM', 'winner5.demo@example.com', 'WINNER5.DEMO@EXAMPLE.COM', 1, 0, 0, 1, 0);
SET @Winner5 = (SELECT Id FROM AspNetUsers WHERE Email = 'winner5.demo@example.com');

IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Email = 'showroom.demo@example.com')
    INSERT INTO AspNetUsers (Id, Name, CreatedAt, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount)
    VALUES (NEWID(), 'AutoShowroom Demo', GETUTCDATE(), 'showroom.demo@example.com', 'SHOWROOM.DEMO@EXAMPLE.COM', 'showroom.demo@example.com', 'SHOWROOM.DEMO@EXAMPLE.COM', 1, 0, 0, 1, 0);
SET @ShowroomSeller = (SELECT Id FROM AspNetUsers WHERE Email = 'showroom.demo@example.com');

------------------------------------------------------------
-- 2. Brands & models (created only if missing)
------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'bmw') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'BMW', 'bmw');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'audi') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Audi', 'audi');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'porsche') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Porsche', 'porsche');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'mercedes-benz') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Mercedes-Benz', 'mercedes-benz');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'toyota') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Toyota', 'toyota');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'ford') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Ford', 'ford');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'chevrolet') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Chevrolet', 'chevrolet');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'nissan') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Nissan', 'nissan');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'dodge') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Dodge', 'dodge');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'lexus') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Lexus', 'lexus');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'jaguar') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Jaguar', 'jaguar');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'tesla') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Tesla', 'tesla');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'honda') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Honda', 'honda');
IF NOT EXISTS (SELECT 1 FROM CarBrands WHERE Slug = 'subaru') INSERT INTO CarBrands (Id, Name, Slug) VALUES (NEWID(), 'Subaru', 'subaru');

DECLARE @BmwId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'bmw');
DECLARE @AudiId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'audi');
DECLARE @PorscheId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'porsche');
DECLARE @MercedesId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'mercedes-benz');
DECLARE @ToyotaId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'toyota');
DECLARE @FordId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'ford');
DECLARE @ChevroletId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'chevrolet');
DECLARE @NissanId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'nissan');
DECLARE @DodgeId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'dodge');
DECLARE @LexusId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'lexus');
DECLARE @JaguarId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'jaguar');
DECLARE @TeslaId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'tesla');
DECLARE @HondaId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'honda');
DECLARE @SubaruId UNIQUEIDENTIFIER = (SELECT Id FROM CarBrands WHERE Slug = 'subaru');

IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'm5-competition') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'M5 Competition', 'm5-competition', @BmwId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'rs6-avant') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'RS6 Avant', 'rs6-avant', @AudiId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = '911-turbo-s') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), '911 Turbo S', '911-turbo-s', @PorscheId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'amg-gt') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'AMG GT', 'amg-gt', @MercedesId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'supra') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'Supra', 'supra', @ToyotaId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'mustang-shelby-gt500') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'Mustang Shelby GT500', 'mustang-shelby-gt500', @FordId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'corvette-z06') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'Corvette Z06', 'corvette-z06', @ChevroletId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'gt-r') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'GT-R', 'gt-r', @NissanId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'challenger-hellcat') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'Challenger Hellcat', 'challenger-hellcat', @DodgeId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'lc-500') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'LC 500', 'lc-500', @LexusId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'f-type') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'F-Type', 'f-type', @JaguarId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'model-s-plaid') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'Model S Plaid', 'model-s-plaid', @TeslaId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'nsx') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'NSX', 'nsx', @HondaId);
IF NOT EXISTS (SELECT 1 FROM CarModels WHERE Slug = 'wrx-sti') INSERT INTO CarModels (Id, Name, Slug, BrandId) VALUES (NEWID(), 'WRX STI', 'wrx-sti', @SubaruId);

DECLARE @M5ModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'm5-competition');
DECLARE @Rs6ModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'rs6-avant');
DECLARE @911ModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = '911-turbo-s');
DECLARE @AmgGtModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'amg-gt');
DECLARE @SupraModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'supra');
DECLARE @MustangModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'mustang-shelby-gt500');
DECLARE @CorvetteModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'corvette-z06');
DECLARE @GtrModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'gt-r');
DECLARE @ChallengerModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'challenger-hellcat');
DECLARE @Lc500ModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'lc-500');
DECLARE @FTypeModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'f-type');
DECLARE @ModelSModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'model-s-plaid');
DECLARE @NsxModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'nsx');
DECLARE @WrxModelId UNIQUEIDENTIFIER = (SELECT Id FROM CarModels WHERE Slug = 'wrx-sti');

------------------------------------------------------------
-- 3. Cars + specifications + main image (one per listing, 14 total)
------------------------------------------------------------
DECLARE @Car1 UNIQUEIDENTIFIER = NEWID(), @Car2 UNIQUEIDENTIFIER = NEWID(), @Car3 UNIQUEIDENTIFIER = NEWID(),
        @Car4 UNIQUEIDENTIFIER = NEWID(), @Car5 UNIQUEIDENTIFIER = NEWID(), @Car6 UNIQUEIDENTIFIER = NEWID(),
        @Car7 UNIQUEIDENTIFIER = NEWID(), @Car8 UNIQUEIDENTIFIER = NEWID(), @Car9 UNIQUEIDENTIFIER = NEWID(),
        @Car10 UNIQUEIDENTIFIER = NEWID(), @Car11 UNIQUEIDENTIFIER = NEWID(), @Car12 UNIQUEIDENTIFIER = NEWID(),
        @Car13 UNIQUEIDENTIFIER = NEWID(), @Car14 UNIQUEIDENTIFIER = NEWID();

INSERT INTO Cars (Id, Year, Vin, ModelId, IsAvailable) VALUES
(@Car1, 2023, 'DEMO00000000M5001', @M5ModelId, 1),
(@Car2, 2022, 'DEMO00000000RS6002', @Rs6ModelId, 1),
(@Car3, 2023, 'DEMO00000000911003', @911ModelId, 1),
(@Car4, 2022, 'DEMO00000000AMG004', @AmgGtModelId, 1),
(@Car5, 2021, 'DEMO0000000SUPRA05', @SupraModelId, 1),
(@Car6, 2020, 'DEMO0000000MUST006', @MustangModelId, 1),
(@Car7, 2022, 'DEMO0000000CORV007', @CorvetteModelId, 1),
(@Car8, 2021, 'DEMO00000000GTR008', @GtrModelId, 1),
(@Car9, 2020, 'DEMO0000000CHAL009', @ChallengerModelId, 1),
(@Car10, 2023, 'DEMO0000000LC50010', @Lc500ModelId, 1),
(@Car11, 2022, 'DEMO000000FTYPE011', @FTypeModelId, 1),
(@Car12, 2023, 'DEMO0000000TESL012', @ModelSModelId, 1),
(@Car13, 2021, 'DEMO0000000NSX013', @NsxModelId, 1),
(@Car14, 2022, 'DEMO0000000WRX014', @WrxModelId, 1);

INSERT INTO CarSpecifications (Id, CarId, Mileage, HorsePower, EngineVolume, FuelType, Transmission, DriveType, BodyType, Doors, Seats, Color, IsAccidentFree, OwnersCount, InteriorColor) VALUES
(NEWID(), @Car1, 8500, 617, 4.4, 0, 1, 0, 0, 4, 5, 'Black Sapphire', 1, 1, 'Black'),
(NEWID(), @Car2, 12000, 591, 4.0, 0, 1, 0, 4, 4, 5, 'Nardo Grey', 1, 1, 'Black'),
(NEWID(), @Car3, 4200, 640, 3.8, 0, 1, 0, 1, 2, 4, 'GT Silver', 1, 1, 'Bordeaux Red'),
(NEWID(), @Car4, 9800, 469, 4.0, 0, 1, 2, 1, 2, 4, 'Selenite Grey', 1, 1, 'Black'),
(NEWID(), @Car5, 21000, 382, 3.0, 0, 1, 2, 1, 2, 2, 'Renaissance Red', 1, 2, 'Black'),
(NEWID(), @Car6, 15000, 760, 5.2, 0, 0, 2, 1, 2, 4, 'Twister Orange', 1, 1, 'Black'),
(NEWID(), @Car7, 6100, 670, 5.5, 0, 1, 2, 1, 2, 2, 'Torch Red', 1, 1, 'Black'),
(NEWID(), @Car8, 18000, 565, 3.8, 0, 1, 0, 1, 2, 4, 'Pearl White', 1, 1, 'Black'),
(NEWID(), @Car9, 24000, 707, 6.2, 0, 0, 2, 0, 2, 4, 'Hellraisin', 1, 2, 'Black'),
(NEWID(), @Car10, 3200, 471, 5.0, 0, 1, 2, 1, 2, 4, 'Infrared', 1, 1, 'Red'),
(NEWID(), @Car11, 7600, 444, 5.0, 0, 1, 2, 5, 2, 2, 'British Racing Green', 1, 1, 'Tan'),
(NEWID(), @Car12, 1900, 1020, 0, 2, 1, 0, 0, 4, 5, 'Pearl White', 1, 1, 'Black'),
(NEWID(), @Car13, 9300, 573, 3.5, 3, 2, 2, 1, 2, 2, 'Curva Red', 1, 1, 'Black'),
(NEWID(), @Car14, 31000, 310, 2.5, 0, 0, 0, 1, 4, 5, 'WR Blue', 1, 2, 'Black');

INSERT INTO CarImages (Id, ImageUrl, IsMain, CarId) VALUES
(NEWID(), 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80', 1, @Car1),
(NEWID(), 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 1, @Car2),
(NEWID(), 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 1, @Car3),
(NEWID(), 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80', 1, @Car4),
(NEWID(), 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80', 1, @Car5),
(NEWID(), 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80', 1, @Car6),
(NEWID(), 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80', 1, @Car7),
(NEWID(), 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80', 1, @Car8),
(NEWID(), 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80', 1, @Car9),
(NEWID(), 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80', 1, @Car10),
(NEWID(), 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=1200&q=80', 1, @Car11),
(NEWID(), 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80', 1, @Car12),
(NEWID(), 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80', 1, @Car13),
(NEWID(), 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 1, @Car14);

------------------------------------------------------------
-- 4. Listings (CarListings) - ListingStatus: Pending=1, Active=3, Completed=4
------------------------------------------------------------
DECLARE @L1 UNIQUEIDENTIFIER = NEWID(), @L2 UNIQUEIDENTIFIER = NEWID(), @L3 UNIQUEIDENTIFIER = NEWID(),
        @L4 UNIQUEIDENTIFIER = NEWID(), @L5 UNIQUEIDENTIFIER = NEWID(), @L6 UNIQUEIDENTIFIER = NEWID(),
        @L7 UNIQUEIDENTIFIER = NEWID(), @L8 UNIQUEIDENTIFIER = NEWID(), @L9 UNIQUEIDENTIFIER = NEWID(),
        @L10 UNIQUEIDENTIFIER = NEWID(), @L11 UNIQUEIDENTIFIER = NEWID(), @L12 UNIQUEIDENTIFIER = NEWID(),
        @L13 UNIQUEIDENTIFIER = NEWID(), @L14 UNIQUEIDENTIFIER = NEWID();

-- Pending: Manager "New Commission" + Seller "In Progress" (Duration=1 -> OneWeek)
INSERT INTO CarListings (Id, Title, Description, StartingPrice, CurrentPrice, AuctionStart, AuctionEnd, Status, SellerId, CarId, Location, Duration) VALUES
(@L1, '2023 BMW M5 Competition', 'Pristine M5 Competition with full service history and no accidents.', 75000, 75000, NULL, NULL, 1, @TargetUserId, @Car1, 'Los Angeles, CA', 1),
(@L2, '2022 Audi RS6 Avant', 'Nardo Grey RS6 Avant, one owner, dealer maintained.', 68000, 68000, NULL, NULL, 1, @TargetUserId, @Car2, 'Miami, FL', 1);

-- Active: Manager "In Progress" + Seller "Live Auctions"
INSERT INTO CarListings (Id, Title, Description, StartingPrice, CurrentPrice, AuctionStart, AuctionEnd, Status, SellerId, CarId, Location, Duration) VALUES
(@L3, '2023 Porsche 911 Turbo S', 'Low mileage 911 Turbo S, ceramic brakes, sport chrono.', 145000, 152000, DATEADD(DAY, -1, GETUTCDATE()), DATEADD(DAY, 5, GETUTCDATE()), 3, @TargetUserId, @Car3, 'Austin, TX', 1),
(@L4, '2022 Mercedes-AMG GT', 'AMG GT with carbon package, track ready.', 98000, 101500, DATEADD(DAY, -1, GETUTCDATE()), DATEADD(DAY, 4, GETUTCDATE()), 3, @TargetUserId, @Car4, 'Chicago, IL', 1);

-- Completed: Leaderboard winners + Seller "Past Listings"
INSERT INTO CarListings (Id, Title, Description, StartingPrice, CurrentPrice, AuctionStart, AuctionEnd, Status, SellerId, CarId, Location, Duration) VALUES
(@L5, '2021 Toyota Supra', 'A90 Supra, stage 1 tune, meticulously maintained.', 38000, 47500, DATEADD(DAY, -10, GETUTCDATE()), DATEADD(DAY, -3, GETUTCDATE()), 4, @TargetUserId, @Car5, 'Seattle, WA', 1),
(@L6, '2020 Ford Mustang Shelby GT500', 'Shelby GT500, carbon fiber track pack.', 72000, 84500, DATEADD(DAY, -12, GETUTCDATE()), DATEADD(DAY, -5, GETUTCDATE()), 4, @TargetUserId, @Car6, 'Dallas, TX', 1),
(@L7, '2022 Chevrolet Corvette Z06', 'Corvette Z06, flat-plane crank V8, front lift.', 105000, 118000, DATEADD(DAY, -14, GETUTCDATE()), DATEADD(DAY, -7, GETUTCDATE()), 4, @TargetUserId, @Car7, 'Denver, CO', 1),
(@L8, '2021 Nissan GT-R', 'Nissan GT-R Premium, twin-turbo V6, launch control.', 82000, 89500, DATEADD(DAY, -9, GETUTCDATE()), DATEADD(DAY, -2, GETUTCDATE()), 4, @TargetUserId, @Car8, 'Phoenix, AZ', 1),
(@L9, '2020 Dodge Challenger Hellcat', 'Hellcat Redeye, low miles, supercharged Hemi V8.', 58000, 66500, DATEADD(DAY, -11, GETUTCDATE()), DATEADD(DAY, -4, GETUTCDATE()), 4, @TargetUserId, @Car9, 'Detroit, MI', 1);

-- Active, other seller: Watchlist cars (Auctions / Ending soon / New cars / No reserve tabs)
INSERT INTO CarListings (Id, Title, Description, StartingPrice, CurrentPrice, AuctionStart, AuctionEnd, Status, SellerId, CarId, Location, Duration) VALUES
(@L10, '2023 Lexus LC 500', 'No reserve! LC 500 in Infrared, ending soon.', 0, 62000, DATEADD(DAY, -2, GETUTCDATE()), DATEADD(HOUR, 3, GETUTCDATE()), 3, @ShowroomSeller, @Car10, 'San Diego, CA', 4),
(@L11, '2022 Jaguar F-Type', 'No reserve F-Type R, British Racing Green.', 0, 71000, DATEADD(DAY, -1, GETUTCDATE()), DATEADD(DAY, 3, GETUTCDATE()), 3, @ShowroomSeller, @Car11, 'Boston, MA', 1),
(@L12, '2023 Tesla Model S Plaid', 'Plaid tri-motor, ending soon, sub-2s 0-60.', 89000, 95500, DATEADD(DAY, -3, GETUTCDATE()), DATEADD(HOUR, 6, GETUTCDATE()), 3, @ShowroomSeller, @Car12, 'San Jose, CA', 4),
(@L13, '2021 Honda NSX', 'Just listed NSX, hybrid twin-turbo V6.', 125000, 128000, DATEADD(HOUR, -6, GETUTCDATE()), DATEADD(DAY, 6, GETUTCDATE()), 3, @ShowroomSeller, @Car13, 'Portland, OR', 1),
(@L14, '2022 Subaru WRX STI', 'Clean WRX STI, new listing, rally inspired.', 34000, 35500, DATEADD(HOUR, -2, GETUTCDATE()), DATEADD(DAY, 7, GETUTCDATE()), 3, @ShowroomSeller, @Car14, 'Salt Lake City, UT', 1);

------------------------------------------------------------
-- 5. Auction winners -> 5 new Leaderboard entries
------------------------------------------------------------
INSERT INTO AuctionWinners (Id, WinningBid, FinishedAt, ListingId, WinnerId) VALUES
(NEWID(), 47500, DATEADD(DAY, -3, GETUTCDATE()), @L5, @Winner1),
(NEWID(), 84500, DATEADD(DAY, -5, GETUTCDATE()), @L6, @Winner2),
(NEWID(), 118000, DATEADD(DAY, -7, GETUTCDATE()), @L7, @Winner3),
(NEWID(), 89500, DATEADD(DAY, -2, GETUTCDATE()), @L8, @Winner4),
(NEWID(), 66500, DATEADD(DAY, -4, GETUTCDATE()), @L9, @Winner5);

------------------------------------------------------------
-- 6. Comments by the target user -> Seller Dashboard "Comments" tab
------------------------------------------------------------
INSERT INTO Comments (Id, Text, CreatedAt, ListingId, UserId, Likes) VALUES
(NEWID(), 'Just serviced this Turbo S myself, runs perfectly - happy to answer any questions!', DATEADD(HOUR, -5, GETUTCDATE()), @L3, @TargetUserId, 2),
(NEWID(), 'This LC 500 is stunning in person, no reserve is a steal.', DATEADD(HOUR, -3, GETUTCDATE()), @L10, @TargetUserId, 1),
(NEWID(), 'Tempted to bid on this Plaid before the auction ends!', DATEADD(HOUR, -1, GETUTCDATE()), @L12, @TargetUserId, 0);

------------------------------------------------------------
-- 7. Watchlist (Favorites) for target user -> all 5 Watchlist tabs
------------------------------------------------------------
INSERT INTO Favorites (Id, UserId, ListingId) VALUES
(NEWID(), @TargetUserId, @L10),
(NEWID(), @TargetUserId, @L11),
(NEWID(), @TargetUserId, @L12),
(NEWID(), @TargetUserId, @L13),
(NEWID(), @TargetUserId, @L14);

PRINT 'Demo data seed completed.';
