export interface Bid {
  bidder: string;
  amount: number;
  time: string;
}

export interface Comment {
  id: number;
  user: string;
  text: string;
  time: string;
  isSeller?: boolean;
  likes: number;
}

export interface CarDetail {
  id: number;
  title: string;
  year: number;
  make: string;
  model: string;
  mileage: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  bodyStyle: string;
  exteriorColor: string;
  interiorColor: string;
  vin: string;
  location: string;
  seller: string;
  currentBid: number;
  bidCount: number;
  timeRemaining: string;
  endsAt: string;
  images: string[];
  highlights: string[];
  equipment: string[];
  modifications: string[];
  flaws: string[];
  description: string;
  bids: Bid[];
  comments: Comment[];
}

export const MOCK_CARS: Record<number, CarDetail> = {
  1: {
    id: 1,
    title: '2023 Porsche 911 GT3 Manthey Racing Package',
    year: 2023,
    make: 'Porsche',
    model: '911 GT3 Manthey',
    mileage: '6,200 Miles',
    engine: '4.0L Naturally Aspirated Flat-6',
    transmission: '6-Speed Manual',
    drivetrain: 'Rear-Wheel Drive (RWD)',
    bodyStyle: 'Coupe',
    exteriorColor: 'Carrera White Metallic',
    interiorColor: 'Black Leather & Race-Tex with GT Silver Stitching',
    vin: 'WP0AC2A98NS25983X',
    location: 'Portland, OR 97220',
    seller: 'apex_motorsports',
    currentBid: 267000,
    bidCount: 22,
    timeRemaining: '1 Day',
    endsAt: 'July 8, 2026, 4:00 PM',
    images: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611566141971-120d43f3c47a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80'
    ],
    highlights: [
      'Manthey Racing performance package installed by certified Porsche dealer ($57,000 value).',
      'Naturally-aspirated 4.0-liter flat-6 engine producing 502 horsepower and 346 lb-ft of torque.',
      'Sought-after 6-speed manual transmission.',
      'Carbon-fiber full bucket seats and carbon-ceramic brakes (PCCB).',
      'Front-axle lift system and carbon-fiber roof panel.'
    ],
    equipment: [
      'Chrono Package with preparation for lap trigger.',
      'Bose Surround Sound System.',
      'LED Matrix Design headlights in black with PDLS+.',
      'Extended range fuel tank (23.7 gal).',
      'Ambient lighting package.'
    ],
    modifications: [
      'Full Manthey Racing aero kit (rear wing, front splitter, canards, rear diffuser).',
      'Manthey 4-way adjustable coilover suspension.',
      'XPEL paint protection film (PPF) applied to the entire vehicle.'
    ],
    flaws: [
      'Minor scuff on the underside of the front splitter (not visible from above).',
      'Small rock chip on the driver-side mirror housing.'
    ],
    description: 'This 2023 Porsche 911 GT3 is a highly desirable track-focused sports car, upgraded with the legendary Manthey Racing Package. Driven just over 6,000 miles since new, it presents in exceptional condition. Delivered new to California, it has been meticulously maintained by official Porsche centers. The Manthey upgrades elevate the GT3’s track dynamics to near-race levels without compromising its street legality.',
    bids: [
      { bidder: 'trackday_king', amount: 267000, time: '2 hours ago' },
      { bidder: 'porsche_collector_911', amount: 265000, time: '5 hours ago' },
      { bidder: 'trackday_king', amount: 262000, time: '8 hours ago' },
      { bidder: 'fast_lap_joe', amount: 250000, time: '1 day ago' }
    ],
    comments: [
      { id: 1, user: 'porsche_fanatic', text: 'An absolute weapon of a car. The Manthey kit takes this to GT3 RS levels of performance on track.', time: '4 hours ago', likes: 12 },
      { id: 2, user: 'apex_motorsports', text: 'Welcome to the auction! I am the seller. Let me know if you have any questions about the Manthey installation. We have the full invoice and certificate.', time: '3 hours ago', isSeller: true, likes: 8 },
      { id: 3, user: 'fast_lap_joe', text: 'Does it come with the stock suspension components as well?', time: '2 hours ago', likes: 2 },
      { id: 4, user: 'apex_motorsports', text: 'Yes, all original stock suspension parts, wing, and front splitter are included in the sale and can be packed inside or shipped separately.', time: '1 hour ago', isSeller: true, likes: 5 }
    ]
  },
  2: {
    id: 2,
    title: '2009 Lotus Exige S 260 Sport',
    year: 2009,
    make: 'Lotus',
    model: 'Exige S 260',
    mileage: '14,300 Miles',
    engine: '1.8L Supercharged Inline-4',
    transmission: '6-Speed Manual',
    drivetrain: 'Rear-Wheel Drive (RWD)',
    bodyStyle: 'Coupe / Targa',
    exteriorColor: 'Ardent Red',
    interiorColor: 'Black Alcantara Sport Seats',
    vin: 'SCCPC11149HC78401',
    location: 'Boston, MA 02061',
    seller: 'boston_exotics',
    currentBid: 75500,
    bidCount: 14,
    timeRemaining: '1 Day',
    endsAt: 'July 8, 2026, 4:30 PM',
    images: [
      'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1617469767053-d3b508a0d84e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80'
    ],
    highlights: [
      'Rare Sport 260 model (1 of approximately 50 imported to North America for 2009).',
      'Supercharged 1.8L inline-4 engine producing 257 horsepower.',
      'Saves approximately 50 lbs over the standard Exige S using carbon-fiber components.',
      'Ohlins adjustable coilovers and adjustable front anti-roll bar from the factory.'
    ],
    equipment: [
      'Touring Pack (Alcantara seats, leather door panels, additional sound insulation).',
      'AP Racing front brake calipers.',
      'Launch control and variable traction control.'
    ],
    modifications: [
      'Larini Club Sport exhaust system (adds incredible exhaust note).',
      'Custom carbon fiber side air intakes.'
    ],
    flaws: [
      'Typical road rash on the front nose panel and behind rear wheels.',
      'Slight wear on the driver-side seat bolster.'
    ],
    description: 'This 2009 Lotus Exige S 260 Sport is a rare and highly focused enthusiast car, showing just 14,300 miles. Finished in striking Ardent Red over black Alcantara, it represents the absolute pinnacle of the lightweight, analog sports car era. Hand-built in Hethel, UK, the S 260 package sheds weight and adds power, delivering an incomparable, raw driving experience.',
    bids: [
      { bidder: 'lotus_racer', amount: 75500, time: '1 hour ago' },
      { bidder: 'lightweight_purist', amount: 74000, time: '4 hours ago' },
      { bidder: 'lotus_racer', amount: 70000, time: '8 hours ago' }
    ],
    comments: [
      { id: 1, user: 'elise_driver', text: 'You do not see 2009 Sport 260 models very often! One of the holy grails of modern Lotus.', time: '5 hours ago', likes: 15 }
    ]
  },
  3: {
    id: 3,
    title: '2016 BMW M4 GTS',
    year: 2016,
    make: 'BMW',
    model: 'M4 GTS',
    mileage: '8,400 Miles',
    engine: '3.0L Twin-Turbocharged Inline-6 with Water Injection',
    transmission: '7-Speed Dual-Clutch (DCT)',
    drivetrain: 'Rear-Wheel Drive (RWD)',
    bodyStyle: 'Coupe',
    exteriorColor: 'Frozen Dark Grey Metallic',
    interiorColor: 'Black Alcantara/Leather with Acid Orange Accents',
    vin: 'WBS3R9C52GK739103',
    location: 'Milford, MA 01757',
    seller: 'gts_enthusiast',
    currentBid: 61000,
    bidCount: 9,
    timeRemaining: '1 Day',
    endsAt: 'July 8, 2026, 5:00 PM',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=800&q=80'
    ],
    highlights: [
      '1 of only 828 units produced worldwide (300 imported to the US).',
      'Water injection system increases power to 493 horsepower and 443 lb-ft of torque.',
      'Factory Acid Orange roll cage and rear seat delete.',
      'Adjustable 3-way M coilover suspension and carbon-ceramic brakes.'
    ],
    equipment: [
      'OLED taillights (GTS-exclusive).',
      'M Carbon bucket seats (not available on US specs, retrofitted with OEM parts).',
      'Acid Orange front splitter and adjustable rear wing.'
    ],
    modifications: [
      'BMW M Performance titanium exhaust tips.',
      'Akrapovic downpipes (original included).'
    ],
    flaws: [
      'Very minor scraping under the adjustable front splitter.',
      'Light scuff on the Acid Orange passenger wheel rim.'
    ],
    description: 'This 2016 BMW M4 GTS is a collector-grade, track-honed version of the standard M4, finished in gorgeous Frozen Dark Grey Metallic. Built by BMW M division to celebrate 30 years of the M3/M4 heritage, it is equipped with a revolutionary water-injection system that cools intake temperatures, unleashing massive turbo power. Showing 8,400 miles, this car is fully sorted and ready for track or show.',
    bids: [
      { bidder: 'bimmer_head', amount: 61000, time: '3 hours ago' },
      { bidder: 'munich_monsters', amount: 59000, time: '1 day ago' }
    ],
    comments: [
      { id: 1, user: 'm3_fan', text: 'Those OLED taillights are worth a fortune alone. Beautiful spec.', time: '10 hours ago', likes: 7 }
    ]
  },
  4: {
    id: 4,
    title: '2001 Panoz Esperante',
    year: 2001,
    make: 'Panoz',
    model: 'Esperante',
    mileage: '9,100 Miles',
    engine: '4.6L DOHC Modular V8',
    transmission: '5-Speed Manual',
    drivetrain: 'Rear-Wheel Drive (RWD)',
    bodyStyle: 'Convertible',
    exteriorColor: 'Titanium Silver Metallic',
    interiorColor: 'Black Hand-Stitched Leather',
    vin: '1P9ET28V61A002341',
    location: 'Auburn, GA 30011',
    seller: 'panoz_archive',
    currentBid: 17500,
    bidCount: 5,
    timeRemaining: '1 Day',
    endsAt: 'July 8, 2026, 5:30 PM',
    images: [
      'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80'
    ],
    highlights: [
      'Hand-built American exotic with superplastic-formed aluminum body panels.',
      'Powered by a Ford Mustang SVT Cobra-sourced 4.6L 32V DOHC V8 engine.',
      'Extremely low mileage: just 9,100 original miles.',
      'Unique center-mounted instrument cluster and modular luxury interior.'
    ],
    equipment: [
      'Black soft top in excellent operating condition.',
      '17-inch BBS modular alloy wheels.',
      'Mach 460 premium audio system.'
    ],
    modifications: [
      'Upgraded exhaust mufflers for a throatier V8 rumble.'
    ],
    flaws: [
      'Tires are older and should be replaced before any spirited driving.',
      'Slight leather shrinkage on the top of the dashboard.'
    ],
    description: 'This 2001 Panoz Esperante represents a rare slice of American boutique automotive history. Handcrafted in Hoschton, Georgia, the Esperante combines exotic styling and lightweight aluminum construction with the bulletproof, easily serviceable mechanicals of the SVT Cobra V8. Presenting in beautiful condition with under 10k miles, this convertible is perfect for a collector or weekend cruiser.',
    bids: [
      { bidder: 'panoz_collector', amount: 17500, time: '6 hours ago' },
      { bidder: 'svt_snake', amount: 16000, time: '1 day ago' }
    ],
    comments: [
      { id: 1, user: 'american_muscle', text: 'Such an underrated exotic. Easy to maintain with that Cobra motor, but turns heads everywhere!', time: '12 hours ago', likes: 10 }
    ]
  },
  5: {
    id: 5,
    title: '2019 Mercedes-AMG GT R',
    year: 2019,
    make: 'Mercedes-Benz',
    model: 'AMG GT R',
    mileage: '4,100 Miles',
    engine: '4.0L Twin-Turbocharged V8',
    transmission: '7-Speed Dual-Clutch (DCT)',
    drivetrain: 'Rear-Wheel Drive (RWD)',
    bodyStyle: 'Coupe',
    exteriorColor: 'AMG Green Hell Magno',
    interiorColor: 'Black Nappa Leather & Dinamica Alcantara with Yellow Stitching',
    vin: 'WDDFK7HA1KA039281',
    location: 'Los Angeles, CA 90001',
    seller: 'la_luxury_rides',
    currentBid: 142000,
    bidCount: 16,
    timeRemaining: '2 Days',
    endsAt: 'July 9, 2026, 4:00 PM',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
    ],
    highlights: [
      'Finished in iconic AMG Green Hell Magno matte paint ($9,900 option).',
      'Handcrafted 4.0-liter dry-sump twin-turbo V8 generating 577 horsepower.',
      'Active rear-wheel steering and 9-mode motorsport traction control.',
      'Carbon fiber roof, fenders, and active underbody aero components.'
    ],
    equipment: [
      'AMG Carbon Fiber Package I and II.',
      'Burmester High-End 3D Surround Sound System.',
      'Yellow brake calipers wrapping AMG carbon-ceramic brakes.'
    ],
    modifications: [
      'PPF matte wrap over the factory paint.',
      'Evok3 performance exhaust system (retains stock valve functionality).'
    ],
    flaws: [
      'None. The vehicle is in showroom condition.'
    ],
    description: 'Developed directly on the Nurburgring Nordschleife, the "Beast of the Green Hell" AMG GT R is a track-weapon that doubles as an incredible grand tourer. This single-owner, low-mileage example is finished in the highly sought-after Green Hell Magno matte finish, accented with carbon fiber trim and bright yellow interior details. Complete with documentation and window sticker.',
    bids: [
      { bidder: 'beast_mode', amount: 142000, time: '1 day ago' },
      { bidder: 'benz_club_pres', amount: 139000, time: '2 days ago' }
    ],
    comments: [
      { id: 1, user: 'gtr_guy', text: 'The Green Hell Magno is the absolute best color for the GT R. Insane presence on the road.', time: '1 day ago', likes: 14 }
    ]
  },
  6: {
    id: 6,
    title: '2020 Audi R8 V10 Performance',
    year: 2020,
    make: 'Audi',
    model: 'R8 V10 Performance',
    mileage: '11,200 Miles',
    engine: '5.2L Naturally Aspirated V10',
    transmission: '7-Speed S-Tronic Dual-Clutch',
    drivetrain: 'Quattro All-Wheel Drive (AWD)',
    bodyStyle: 'Coupe',
    exteriorColor: 'Kemora Gray Metallic',
    interiorColor: 'Express Red Nappa Leather with Diamond Stitching',
    vin: 'WUACTAF14LA005432',
    location: 'Miami, FL 33101',
    seller: 'magic_city_motors',
    currentBid: 189500,
    bidCount: 20,
    timeRemaining: '3 Days',
    endsAt: 'July 10, 2026, 4:00 PM',
    images: [
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1614200179396-2bab57ef3301?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'
    ],
    highlights: [
      'Performance model featuring 602 horsepower from the factory.',
      'Stunning Kemora Gray over Express Red color combination.',
      'Carbon-fiber exterior package (front spoiler, side blades, rear diffuser, and wing).',
      'Laser headlights with dynamic indicators.'
    ],
    equipment: [
      'Bang & Olufsen Sound System.',
      'Audi Virtual Cockpit with sport mode layout.',
      'Dynamic Steering and Sport exhaust system.'
    ],
    modifications: [
      'H&R lowering springs (1-inch drop, original springs included).',
      '20-inch Brixton Forged custom wheels.'
    ],
    flaws: [
      'Extremely light curb rash on the rear passenger wheel.',
      'Small scratch on the lower carbon-fiber side blade.'
    ],
    description: 'This 2020 Audi R8 V10 Performance represents one of the final iterations of the naturally-aspirated V10 supercar. Sharing its engine and chassis with the Lamborghini Huracan, the R8 Performance model produces 602 hp and delivers power via Audi’s legendary Quattro AWD system. This vehicle has been thoroughly inspected and serviced, showing a clean history.',
    bids: [
      { bidder: 'quattro_r8', amount: 189500, time: '2 hours ago' },
      { bidder: 'v10_howl', amount: 188000, time: '5 hours ago' }
    ],
    comments: [
      { id: 1, user: 'lambo_killer', text: 'That naturally aspirated V10 exhaust note is irreplaceable. Get it while they still exist!', time: '1 day ago', likes: 11 }
    ]
  },
  7: {
    id: 7,
    title: '2018 Ford GT',
    year: 2018,
    make: 'Ford',
    model: 'GT',
    mileage: '1,200 Miles',
    engine: '3.5L Twin-Turbocharged EcoBoost V6',
    transmission: '7-Speed Dual-Clutch (DCT)',
    drivetrain: 'Rear-Wheel Drive (RWD)',
    bodyStyle: 'Coupe',
    exteriorColor: 'Liquid Carbon Gloss',
    interiorColor: 'Dark Energy Carbon Fiber & Alcantara',
    vin: '1FA6P0FU7J5800432',
    location: 'Chicago, IL 60601',
    seller: 'windy_city_hypercars',
    currentBid: 1050000,
    bidCount: 31,
    timeRemaining: '4 Days',
    endsAt: 'July 11, 2026, 4:00 PM',
    images: [
      'https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1526726576990-1eac976104c3?auto=format&fit=crop&w=800&q=80'
    ],
    highlights: [
      'Ultra-exclusive Liquid Carbon Edition (highly limited production).',
      '647 horsepower twin-turbo EcoBoost V6 matching Le Mans race car mechanics.',
      'Active hydraulic suspension that lowers the car by 2 inches in Track mode.',
      'Titanium exhaust system from Akrapovic fitted from the factory.'
    ],
    equipment: [
      '20-inch single-piece gloss carbon-fiber wheels.',
      'Titanium wheel lugs.',
      'Sparco carbon-fiber racing seats.'
    ],
    modifications: [
      'Paint protection film (PPF) applied over all exposed carbon panels.'
    ],
    flaws: [
      'None. The vehicle is in collector condition, kept in a climate-controlled facility.'
    ],
    description: 'The second-generation Ford GT is a street-legal race car, built to celebrate Ford’s historic 1966 Le Mans victory. This Liquid Carbon model features a completely exposed carbon-fiber body structure with a gloss clear coat, demanding incredible precision in carbon weaving. Exhibiting just 1,200 miles, this supercar represents a rare investment opportunity.',
    bids: [
      { bidder: 'hyper_guy', amount: 1050000, time: '3 hours ago' },
      { bidder: 'blue_oval_boss', amount: 1030000, time: '1 day ago' }
    ],
    comments: [
      { id: 1, user: 'lemans_66', text: 'Absolute peak of American engineering. Seeing the exposed carbon weave in person is mind-blowing.', time: '2 days ago', likes: 25 }
    ]
  },
  8: {
    id: 8,
    title: '1969 Chevrolet Camaro Z/28',
    year: 1969,
    make: 'Chevrolet',
    model: 'Camaro Z/28',
    mileage: '54,300 Miles',
    engine: '302ci Turbo-Fire V8 (DZ 302)',
    transmission: '4-Speed Muncie Manual',
    drivetrain: 'Rear-Wheel Drive (RWD)',
    bodyStyle: 'Coupe',
    exteriorColor: 'Hugger Orange with Black Stripes',
    interiorColor: 'Black Houndstooth Vinyl & Fabric',
    vin: '124379N593821',
    location: 'Detroit, MI 48201',
    seller: 'motor_city_muscle',
    currentBid: 92000,
    bidCount: 18,
    timeRemaining: '2 Days',
    endsAt: 'July 9, 2026, 4:30 PM',
    images: [
      'https://images.unsplash.com/photo-1612462227192-3c220f1885b5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
    ],
    highlights: [
      'Numbers-matching DZ 302 cubic-inch high-performance V8 engine.',
      'Sought-after Muncie 4-speed manual transmission with Hurst shifter.',
      '12-bolt rear end with Positraction and 3.73 gears.',
      'Finished in iconic Hugger Orange paint with black racing stripes.'
    ],
    equipment: [
      'Special Ducted Hood (Cowl Induction).',
      'Front and rear spoilers.',
      'Rally Sport (RS) hideaway headlight package.'
    ],
    modifications: [
      'Upgraded retro-look digital radio with Bluetooth functionality.',
      'Flowmaster dual exhaust system.'
    ],
    flaws: [
      'Very minor paint chip on the edge of the passenger door.',
      'Light cracking on the dashboard pad near the speaker grill.'
    ],
    description: 'This 1969 Chevrolet Camaro Z/28 is an American muscle icon. Built specifically to qualify the Camaro for the SCCA Trans-Am racing series, the Z/28 package features the legendary high-revving DZ 302 cubic inch V8. Fully restored to original specifications, this numbers-matching Camaro looks, drives, and sounds incredible.',
    bids: [
      { bidder: 'muscle_head', amount: 92000, time: '4 hours ago' },
      { bidder: 'classic_hunter', amount: 90000, time: '8 hours ago' }
    ],
    comments: [
      { id: 1, user: 'z28_fanatic', text: 'Numbers matching DZ 302! This is a serious collector piece. Hugger Orange is the perfect color.', time: '10 hours ago', likes: 19 }
    ]
  },
  9: {
    id: 9,
    title: '2026 Porsche 911 Carrera GTS Coupe',
    year: 2026,
    make: 'Porsche',
    model: '911 Carrera GTS',
    mileage: '400 Miles',
    engine: '3.6L T-Hybrid Single-Turbocharged Flat-6',
    transmission: '8-Speed PDK Automatic',
    drivetrain: 'Rear-Wheel Drive (RWD)',
    bodyStyle: 'Coupe',
    exteriorColor: 'Jet Black Metallic',
    interiorColor: 'GTS Interior Package with Carmine Red Accents',
    vin: 'WP0AB2A99TS100234',
    location: 'San Francisco, CA 94107',
    seller: 'bay_area_leasing',
    currentBid: 200000,
    bidCount: 45,
    timeRemaining: '5 Days',
    endsAt: 'July 12, 2026, 4:00 PM',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611566141971-120d43f3c47a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80'
    ],
    highlights: [
      'All-new 992.2 generation featuring the revolutionary T-Hybrid powertrain.',
      'Combines a new 3.6-liter flat-6 engine with an electric turbocharger and transmission motor.',
      'Total output of 532 horsepower and 449 lb-ft of torque.',
      'Rear-axle steering now standard on the GTS model.',
      'Fully digital instrument cluster (new for 992.2).'
    ],
    equipment: [
      'Sport Design Package in Gloss Black.',
      'Burmester 3D High-End Surround Sound System.',
      'Porsche Ceramic Composite Brakes (PCCB) with black calipers.',
      'HD-Matrix Design LED headlights.'
    ],
    modifications: [
      'Full body paint protection film (PPF).',
      'Ceramic coating on wheels and brake calipers.'
    ],
    flaws: [
      'None. Delivery mileage, pristine condition.'
    ],
    description: 'This is one of the very first 992.2-generation Porsche 911 Carrera GTS models in North America. Featuring the highly anticipated T-Hybrid drivetrain, this hybrid system does not focus on fuel economy but rather absolute torque response and power delivery. The electric motor integrated in the PDK and the electric exhaust turbocharger work in perfect harmony to eliminate turbo lag, offering performance that rivals the GT3 and Turbo models.',
    bids: [
      { bidder: 'porsche_collector_911', amount: 200000, time: '30 minutes ago' },
      { bidder: 'silicon_valley_tech', amount: 198000, time: '2 hours ago' },
      { bidder: 'porsche_collector_911', amount: 195000, time: '5 hours ago' }
    ],
    comments: [
      { id: 1, user: 'hybrid_skeptic', text: 'I was skeptical about a hybrid 911, but the reviews of this T-Hybrid have been incredible. Incredible throttle response.', time: '4 hours ago', likes: 16 },
      { id: 2, user: 'bay_area_leasing', text: 'Welcome to our auction! We are happy to coordinate shipping anywhere in the continental US. Please use the contact seller button or ask questions here.', time: '3 hours ago', isSeller: true, likes: 9 }
    ]
  }
};
