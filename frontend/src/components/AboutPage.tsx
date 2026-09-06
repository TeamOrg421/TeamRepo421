import React, { useState, useEffect } from 'react';
import './AboutPage.css';

interface AboutPageProps {
  onNavigate?: (page: string) => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How much does it cost to sell a car?',
    answer: 'It is 100% free to submit and list your car on VEYO! Sellers keep 100% of the final sale price. Buyers pay a 5% buyer’s fee on top of the winning bid (minimum of $250, capped at a maximum of $7,500).'
  },
  {
    id: 'faq-2',
    question: "How do you choose which cars you're looking for?",
    answer: 'We focus on modern enthusiast vehicles—predominantly cars, trucks, and SUVs from the 1980s, 1990s, 2000s, and today. From iconic supercars and sports coupes to quirky wagons and rare enthusiast trims, if it is exciting and fun to drive, it has a home on VEYO.'
  },
  {
    id: 'faq-3',
    question: 'How do I submit my car for sale?',
    answer: 'Simply click "Sell your car" in the top navigation. Enter your vehicle’s VIN, mileage, condition summary, and upload several clear exterior and interior photos. Our curation specialists will review your submission and respond within one business day.'
  },
  {
    id: 'faq-4',
    question: 'What is a Reserve Auction vs. a No Reserve Auction?',
    answer: 'A Reserve auction has a secret minimum price agreed between the seller and VEYO. If the bidding does not reach this threshold, the car is not sold. A No Reserve auction has no minimum price—the highest bidder wins regardless of the final amount. No Reserve auctions often generate the most intense bidding activity and interest.'
  },
  {
    id: 'faq-5',
    question: 'What information do I need to provide in order to sell my car?',
    answer: 'You will need your vehicle identification number (VIN), photos of the car (exterior, interior, engine, wheels, and flaws), title status, proof of ownership, service records or maintenance summary, and a list of any modifications or known quirks.'
  }
];

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState<string>('about-us');
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({});

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllFaq = () => {
    const allOpen = FAQ_DATA.every((f) => openFaq[f.id]);
    const newState: Record<string, boolean> = {};
    FAQ_DATA.forEach((f) => {
      newState[f.id] = !allOpen;
    });
    setOpenFaq(newState);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const sectionIds = ['about-us', 'buying-a-car', 'selling-a-car', 'finalizing-the-sale', 'faq'];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="about-page">
      {/* Top Hero Banner */}
      <section className="about-hero-section">
        <div className="about-hero-container">
          <div className="about-hero-visual">
            <img
              src="/hero-blob.png"
              alt=""
              className="about-hero-blob-img"
            />
            <img
              src="/ferrari-car.png"
              alt="Blue Ferrari"
              className="about-hero-car-img"
              loading="eager"
            />
          </div>

          <div className="about-hero-content">
            <h1 className="about-hero-title">VEYO Car Auctions</h1>
            <p className="about-hero-subtitle">
              Turn your dream car into someone else&apos;s dream ride! Whether it&apos;s rare, custom, or
              just plain awesome — VEYO is the place to auction it.
            </p>
          </div>
        </div>
      </section>

      {/* 3 Key Feature Cards */}
      <section className="about-feature-cards-section">
        <div className="about-feature-cards-grid">
          {/* Card 1 */}
          <div className="about-feature-card">
            <div className="about-card-badge-wrap">
              <img src="/icon-dollar.png" alt="Low Fees" className="about-card-badge-img" />
            </div>
            <h3 className="about-card-title">Low Fees, Full Gains</h3>
            <p className="about-card-text">
              Sellers list for free and keep 100% of the sale price. Buyers pay only a 5% commission (max $7,500). Simple, fair, and transparent.
            </p>
          </div>

          {/* Card 2 */}
          <div className="about-feature-card">
            <div className="about-card-badge-wrap">
              <img src="/icon-handshake.png" alt="Know Your Car" className="about-card-badge-img" />
            </div>
            <h3 className="about-card-title">Know Your Car, Buy With Confidence</h3>
            <p className="about-card-text">
              Every listing comes with a full vehicle history report — no hidden surprises, no extra cost.
            </p>
          </div>

          {/* Card 3 */}
          <div className="about-feature-card">
            <div className="about-card-badge-wrap">
              <img src="/icon-verified.png" alt="Fast, Easy, Exciting" className="about-card-badge-img" />
            </div>
            <h3 className="about-card-title">Fast, Easy, Exciting</h3>
            <p className="about-card-text">
              Our platform is built to make buying and selling enthusiast cars online smooth, fun, and fast. Your car deserves the spotlight — and we make it shine.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area with Sticky Sidebar */}
      <div className="about-content-wrapper">
        <aside className="about-sticky-sidebar">
          <nav className="about-sidebar-nav">
            <button
              type="button"
              className={`about-nav-link ${activeSection === 'about-us' ? 'active' : ''}`}
              onClick={() => scrollToSection('about-us')}
            >
              About us
            </button>

            <div className="about-nav-group">
              <span className="about-nav-group-title">How it works</span>
              <button
                type="button"
                className={`about-nav-sublink ${activeSection === 'buying-a-car' ? 'active' : ''}`}
                onClick={() => scrollToSection('buying-a-car')}
              >
                Buying a Car
              </button>
              <button
                type="button"
                className={`about-nav-sublink ${activeSection === 'selling-a-car' ? 'active' : ''}`}
                onClick={() => scrollToSection('selling-a-car')}
              >
                Selling a Car
              </button>
              <button
                type="button"
                className={`about-nav-sublink ${activeSection === 'finalizing-the-sale' ? 'active' : ''}`}
                onClick={() => scrollToSection('finalizing-the-sale')}
              >
                Finalizing the Sale
              </button>
            </div>

            <button
              type="button"
              className={`about-nav-link ${activeSection === 'faq' ? 'active' : ''}`}
              onClick={() => scrollToSection('faq')}
            >
              FAQ
            </button>
          </nav>
        </aside>

        <main className="about-main-body">
          {/* Section: About VEYO */}
          <section id="about-us" className="about-section">
            <h2 className="about-section-heading">About VEYO</h2>
            <div className="about-section-text">
              <p>
                Over the last few years, many car enthusiasts have started turning their attention to recent vehicles –
                cars from the 1980s, 1990s, and beyond. Automotive enthusiasts realized there isn&apos;t yet a dedicated
                modern place tailored to buying and selling their favorite cars, but there should be – so we created
                <strong> VEYO</strong>, a platform driven by genuine passion for cars, quirks, and features.
              </p>
              <p>
                VEYO is the best online auction marketplace to buy and sell cool enthusiast cars. To us, &quot;cool&quot; ranges
                from the obvious (a Ferrari F355 or a Lamborghini Gallardo) to the esoteric (a pristine Dodge Dakota Convertible
                or a Mercury Capri XR2) to the traditional fun cars that enthusiasts love (a Mazda MX-5 Miata or a Porsche 911).
                Basically everything that&apos;s exciting, fun, interesting, or quirky is welcome here.
              </p>
              <p>
                Although there are many places to buy and sell a special car, VEYO offers significant advantages over other websites.
                Here are just a few of our benefits:
              </p>

              <ul className="about-bullet-list">
                <li>
                  <strong>Focused on Enthusiasts:</strong> Buyers and sellers come here first for exciting cars.
                </li>
                <li>
                  <strong>Low Fees: Sellers list for free.</strong> Buyers pay just <strong>5%</strong> (min $250, max $7,500).
                </li>
                <li>
                  <strong>Free Vehicle Reports:</strong> Every car gets a detailed history report at no cost.
                </li>
                <li>
                  <strong>Quick &amp; Easy Listings:</strong> Get your car online fast — we value your time.
                </li>
                <li>
                  <strong>User-Friendly Platform:</strong> Simple search, sorting, and clear auctions.
                </li>
                <li>
                  <strong>Secure Transactions:</strong> VEYO SafePay ensures smooth, safe, and fast payments.
                </li>
              </ul>
            </div>
          </section>

          <div className="about-section-divider" />

          {/* Section: How It Works - Header */}
          <section id="how-it-works" className="about-section-title-wrap">
            <h2 className="about-main-title">How It Works</h2>
          </section>

          {/* Section: Buying a Car */}
          <section id="buying-a-car" className="about-section">
            <h3 className="about-subheading">Buying a Car</h3>
            <p className="about-intro-p">
              Once you&apos;ve found a car you&apos;re interested in, here are the steps you should take to bid confidently and,
              with any luck, win the auction!
            </p>

            <div className="about-step-block">
              <h4 className="about-step-title">1. Register to Bid</h4>
              <p>
                To contact the seller directly and place bids, you must first register with a valid credit card and phone number.
                Winning bidders pay VEYO a 5% buyer&apos;s fee on top of the winning bid amount (minimum of $250, maximum of $7,500).
              </p>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">2. Perform Due Diligence</h4>
              <p>
                While we&apos;ve tried to make buying a car online as safe and easy as possible, it&apos;s ultimately your responsibility
                to perform your own due diligence and make sure that the car you&apos;re considering is right for you – prior to placing a bid.
              </p>
              <ul className="about-bullet-list">
                <li>Review the listing thoroughly, including known flaws, the vehicle history report, the vehicle inspection report (if applicable), recent maintenance, photos, etc.</li>
                <li>Ask the seller – via comments, Seller Q&amp;A, or the &quot;Contact&quot; feature – any questions that you may have about the vehicle.</li>
                <li>Arrange to inspect the vehicle in person, or work with the seller to schedule a detailed pre-purchase inspection (&quot;PPI&quot;) at a reputable shop in their area (at your cost).</li>
              </ul>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">3. Arrange Financing and Logistics</h4>
              <p>
                To ensure a smooth transaction, you should have the following organized prior to placing a bid.
              </p>
              <ul className="about-bullet-list">
                <li>To facilitate your purchase, we&apos;ve teamed up with top automotive financing partners to make financing easy and fast for users with good credit. You can apply for a loan directly from each auction!</li>
                <li>As a reminder, if you plan to finance this purchase, work with your lender to get your financing approved ahead of time – and keep in mind that some lenders may require specific vehicle information.</li>
                <li>Discuss transportation and storage timelines (if applicable) with the seller, and if you&apos;ll be shipping the vehicle, get a quick and easy shipping quote before bidding.</li>
              </ul>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">4. Bid</h4>
              <p>We&apos;ve made bidding easy!</p>
              <ul className="about-bullet-list">
                <li>When you bid, we place a hold on your credit card for the buyer&apos;s fee – if you win, your card will be charged and you will pay the seller directly for the vehicle, otherwise, the hold will be released at the auction&apos;s end.</li>
                <li>Bids are binding, so only bid if you fully intend to purchase the car and you have performed the requisite due diligence, because you might end up as the high bidder and there are no refunds.</li>
                <li>To ensure the bidding process is fair for everyone, bids placed within the final minute of the auction will reset the auction&apos;s time remaining back to 1 minute – giving others the opportunity to bid (anti-sniping protection).</li>
              </ul>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">5. Win the Auction</h4>
              <p>
                To buy a car on VEYO, you must win the auction by ultimately being the highest bidder – and, if the auction has a &quot;Reserve,&quot;
                by placing a bid that meets or exceeds the seller&apos;s hidden &quot;Reserve&quot; price. If the auction has &quot;No Reserve,&quot;
                then the highest bidder wins it regardless of the amount they bid.
              </p>
              <p>
                After the auction closes, you&apos;ll have the option to use <strong>VEYO SafePay</strong> to complete your purchase quickly and securely, 100% online.
                You&apos;ll also receive the seller&apos;s contact information (and vice-versa) in order to finalize the details and logistics of the transaction.
                Buyers are expected to pay for the vehicle in-full within a week of the auction closing.
              </p>
            </div>
          </section>

          <div className="about-section-divider" />

          {/* Section: Selling a Car */}
          <section id="selling-a-car" className="about-section">
            <h3 className="about-subheading">Selling a Car</h3>
            <p className="about-intro-p">
              VEYO is the best place to sell your modern enthusiast car – and we&apos;ve made the process easy.
            </p>

            <div className="about-step-block">
              <h4 className="about-step-title">1. Submit Your Car</h4>
              <p>
                It&apos;s free to submit your car. We simply ask you for a few details – including the VIN, some photos, and a brief description of the car.
                You can also choose whether you want to set a reserve price, or if you want your vehicle to be sold with no reserve. A reserve price is a
                minimum value you&apos;ll accept in order to sell your car – and while a reserve auction may seem like an appealing choice, we&apos;ve found that
                vehicles offered with no reserve get more bids, more interest, and more attention.
              </p>
              <p>
                If you choose a reserve auction, we&apos;ll ask you to suggest a reserve price – but, based on market conditions, we may ask for a lower one
                before accepting your car. Keep in mind that all of our auctions start from $0, regardless of whether or not they have a reserve.
              </p>
              <p>
                Our experienced auction team will review your submission and may ask you some follow-up questions. We will do our best to give you an answer
                within a business day. Not every car is right for VEYO, but we always appreciate you taking the time to submit your car to us!
              </p>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">2. Prepare Your Listing</h4>
              <p>
                Once accepted, we help format and review your listing to make sure it includes comprehensive photos, accurate vehicle history, and key features that highlight its strongest selling points.
              </p>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">3. Schedule and Launch</h4>
              <p>
                We schedule your auction launch for high-traffic windows to guarantee the highest visibility and engagement from genuine buyers across the country.
              </p>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">4. Participate in the Auction</h4>
              <p>
                Timely and positive seller participation in the auction – responding to comments and questions, providing additional pictures or videos as needed, etc –
                is crucial to a successful auction. Good seller participation will result in additional interest, more bids, and a higher final sale price.
              </p>
              <p>
                Interested bidders may contact you directly via email using the &quot;Contact Seller&quot; feature, allowing them to schedule test drives, pre-purchase
                inspections (at their cost), and ask additional questions.
              </p>
              <p>
                Enjoy the final minutes – many of our auctions end with thrilling bidding wars, so get ready!
              </p>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">5. Auction End</h4>
              <p>
                After the auction closes, you&apos;ll have the option to use <strong>VEYO SafePay</strong> to complete your sale quickly and securely, 100% online.
                You&apos;ll also receive the buyer&apos;s contact information (and vice-versa) in order to finalize the details and logistics of the transaction.
              </p>
              <p>
                If your auction had a reserve and it was not met, we&apos;ll reach out to you and the highest bidder to see if we can help make a deal!
              </p>
            </div>
          </section>

          <div className="about-section-divider" />

          {/* Section: Finalizing the Sale */}
          <section id="finalizing-the-sale" className="about-section">
            <h3 className="about-subheading">Finalizing the Sale</h3>
            <p className="about-intro-p">
              Immediately after the auction closes we connect the buyer and seller so they can complete their sale. They can choose to use <strong>VEYO SafePay</strong> to
              handle payment, documentation, and title transfer quickly and easily, or they can use our custom checklist to ensure a smooth transaction.
              Here are our recommendations and tips for a successful post-auction sale – and remember, we&apos;re here to help!
            </p>

            <div className="about-step-block">
              <h4 className="about-step-title">1. Make Contact</h4>
              <p>
                Reach out to the other party to introduce yourself as soon as the auction ends, and remember to stay polite and positive to ensure the process goes smoothly.
              </p>
              <p>
                We recommend that the seller provides proof of ownership to the buyer – usually, that&apos;s a photocopy or picture of the title and registration.
              </p>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">2. Payment &amp; Documentation</h4>
              <p>
                Buyers are expected to pay for the vehicle in-full within a week of the auction closing.
              </p>
              <p>
                If there&apos;s an outstanding loan on the vehicle, <strong>VEYO SafePay</strong> is a great option to ensure that the loan is satisfied and the title
                is transferred to the buyer. Otherwise, the buyer and seller should discuss how it will be paid off and the specific next steps, so that the buyer
                can complete the transaction safely.
              </p>
              <p>
                If the seller does not have the funds, the buyer may be able to pay the outstanding amount owed directly to the lender and then pay the remainder of the purchase price to the seller.
              </p>
              <p>
                An accurate Bill of Sale should be created, including the terms of the transaction, to be signed by both parties; we recommend checking with your state DMV for Bill of Sale templates and requirements.
              </p>
              <p>
                <strong>VEYO SafePay</strong> will securely transfer funds from the buyer to the seller. Alternatively, we recommend wire transfers, cashier&apos;s checks, or USDC for payment,
                but there are many possible options – including meeting at the buyer&apos;s/seller&apos;s bank to draft up a cashier&apos;s check, withdrawing the funds directly, or completing an electronic money transfer.
              </p>
              <p>
                Arrange for the car to be picked up and finalize the transaction. If the buyer plans to ship the vehicle, they can book shipping directly through the winner&apos;s page or by contacting our shipping team at <span className="about-highlight-link">shipping@veyo.com</span>.
                The vehicle and title should only be released once the seller has the full payment in hand. If the transaction is happening remotely, the seller should mail the signed-over title to the buyer via courier service with a tracking number once payment is in hand.
              </p>
            </div>

            <div className="about-step-block">
              <h4 className="about-step-title">3. Share your Success Story</h4>
              <p>
                Email the <strong>VEYO</strong> team a photo of the handoff to share your success story – we&apos;d love to hear about it!
              </p>
            </div>
          </section>

          <div className="about-section-divider" />

          {/* Section: Frequently asked questions */}
          <section id="faq" className="about-section">
            <div className="about-faq-header">
              <h2 className="about-section-heading">Frequently asked questions</h2>
              <button type="button" className="about-btn-all-questions" onClick={expandAllFaq}>
                All questions
              </button>
            </div>

            <div className="about-faq-list">
              {FAQ_DATA.map((item) => {
                const isOpen = !!openFaq[item.id];
                return (
                  <div key={item.id} className={`about-faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="about-faq-trigger"
                      onClick={() => toggleFaq(item.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="about-faq-question">{item.question}</span>
                      <svg
                        className={`about-faq-chevron ${isOpen ? 'rotate' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="about-faq-content">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bottom CTA Action Bar */}
          <section className="about-cta-card">
            <div className="about-cta-content">
              <h3>Ready to join the action?</h3>
              <p>Explore thousands of enthusiast cars or list your special ride today with 0% seller fees.</p>
            </div>
            <div className="about-cta-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigate?.('home')}
              >
                Browse Auctions
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onNavigate?.('sellCar')}
              >
                Submit Your Car
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AboutPage;
