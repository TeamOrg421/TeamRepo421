import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  addBankCard,
  getBankCards,
  topUpBankCard,
  pay,
} from '../services/bankCards';
import type { BankCardDto, CreateBankCardDto } from '../services/bankCards';

const emptyCard: CreateBankCardDto = {
  cardNumber: '',
  cvv: '',
  cardHolderName: '',
  expiryDate: '',
  billingAddress: '',
  isDefault: false,
};

export default function PaymentMethods() {
  const [cards, setCards] = useState<BankCardDto[]>([]);
  const [cardForm, setCardForm] = useState<CreateBankCardDto>(emptyCard);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('10000');
  const [payAmount, setPayAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadCards = async () => {
    try {
      const loadedCards = await getBankCards();
      setCards(loadedCards);
      setSelectedCardId(current => (loadedCards.some(c => c.id === current) ? current : loadedCards[0]?.id || ''));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load bank cards.');
    }
  };

  useEffect(() => {
    void loadCards();
  }, []);

  const submitCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const createdCard = await addBankCard(cardForm);
      await loadCards();
      setSelectedCardId(createdCard.id);
      setCardForm(emptyCard);
      setMessage('Card added successfully with $1,000,000 test balance.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add the card.');
    } finally {
      setBusy(false);
    }
  };

  const submitTopUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountNum = Number(topUpAmount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const result = await topUpBankCard({ cardId: selectedCardId, amount: amountNum });
      setMessage(result.message || 'Card topped up successfully.');
      await loadCards();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Top up failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const result = await pay({ cardId: selectedCardId, amount: amountNum });
      setMessage(result.message || 'Payment completed.');
      setPayAmount('');
      await loadCards();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  const quickTopUpPresets = [1000, 10000, 50000, 100000];

  return (
    <section className="payment-methods glass-panel">
      <div className="payment-methods-heading">
        <div>
          <h2>Payment methods & Cards</h2>
          <p>Manage your linked bank cards, check balances, and top up funds for auctions.</p>
        </div>
      </div>

      {cards.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Your cards</h3>
          <ul className="payment-card-list">
            {cards.map(card => (
              <li
                key={card.id}
                className="payment-card-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: card.id === selectedCardId ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  background: card.id === selectedCardId ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                  marginBottom: '0.5rem',
                }}
                onClick={() => setSelectedCardId(card.id)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '1px' }}>
                    {card.maskedCardNumber}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '2px' }}>
                    {card.cardHolderName} • Exp: {card.expiryDate}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>
                    {card.balance !== undefined && card.balance !== null
                      ? `$${Number(card.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </div>
                  {card.isDefault && (
                    <span className="payment-default-label" style={{ fontSize: '0.75rem' }}>
                      Default
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TOP UP SECTION */}
      {cards.length > 0 && (
        <form className="payment-form" onSubmit={submitTopUp} style={{ marginBottom: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <h3>💳 Top up balance (Поповнити картку)</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.75rem' }}>
            Add test funds to your selected card to place bids on auctions.
          </p>

          <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Select card:</label>
          <select
            required
            value={selectedCardId}
            onChange={event => setSelectedCardId(event.target.value)}
            style={{ marginBottom: '0.75rem' }}
          >
            {cards.map(card => (
              <option key={card.id} value={card.id}>
                {card.maskedCardNumber} ({card.cardHolderName}) — Balance: ${Number(card.balance ?? 0).toLocaleString()}
              </option>
            ))}
          </select>

          <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Quick amount preset:</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {quickTopUpPresets.map(preset => (
              <button
                key={preset}
                type="button"
                className="payment-action"
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  background: topUpAmount === String(preset) ? '#2563eb' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
                onClick={() => setTopUpAmount(String(preset))}
              >
                +${preset.toLocaleString()}
              </button>
            ))}
          </div>

          <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Amount ($):</label>
          <input
            required
            min="1"
            step="1"
            type="number"
            value={topUpAmount}
            onChange={event => setTopUpAmount(event.target.value)}
            placeholder="Amount to deposit"
          />

          <button className="payment-action" type="submit" disabled={busy || !selectedCardId} style={{ background: '#10b981' }}>
            {busy ? 'Processing...' : `Deposit $${Number(topUpAmount || 0).toLocaleString()} into Card`}
          </button>
        </form>
      )}

      {/* ADD CARD SECTION */}
      <form className="payment-form" onSubmit={submitCard}>
        <h3>Add a new card (Додати картку)</h3>
        <input
          required
          value={cardForm.cardHolderName}
          onChange={event => setCardForm(current => ({ ...current, cardHolderName: event.target.value }))}
          placeholder="Cardholder name (e.g. IVAN IVANOV)"
          autoComplete="cc-name"
        />
        <input
          required
          value={cardForm.cardNumber}
          onChange={event => setCardForm(current => ({ ...current, cardNumber: event.target.value }))}
          placeholder="Card number (16 digits, e.g. 4111222233334444)"
          inputMode="numeric"
          maxLength={19}
          autoComplete="cc-number"
        />
        <div className="payment-form-row">
          <input
            required
            value={cardForm.expiryDate}
            onChange={event => setCardForm(current => ({ ...current, expiryDate: event.target.value }))}
            placeholder="MM/YY (e.g. 12/28)"
            autoComplete="cc-exp"
          />
          <input
            required
            value={cardForm.cvv}
            onChange={event => setCardForm(current => ({ ...current, cvv: event.target.value }))}
            placeholder="CVV (e.g. 123)"
            inputMode="numeric"
            maxLength={3}
            autoComplete="cc-csc"
          />
        </div>
        <input
          value={cardForm.billingAddress}
          onChange={event => setCardForm(current => ({ ...current, billingAddress: event.target.value }))}
          placeholder="Billing address (optional)"
          autoComplete="street-address"
        />
        <label className="payment-checkbox">
          <input
            type="checkbox"
            checked={cardForm.isDefault}
            onChange={event => setCardForm(current => ({ ...current, isDefault: event.target.checked }))}
          />
          Set as default
        </label>
        <button className="payment-action" type="submit" disabled={busy}>
          Add card
        </button>
      </form>

      {/* TEST PAYMENT (WITHDRAW) SECTION */}
      {cards.length > 0 && (
        <form className="payment-form" onSubmit={submitPayment} style={{ marginTop: '1.5rem', opacity: 0.85 }}>
          <h3>Test payment deduction (Тестове списання)</h3>
          <select required value={selectedCardId} onChange={event => setSelectedCardId(event.target.value)}>
            {cards.map(card => <option key={card.id} value={card.id}>{card.maskedCardNumber} (Balance: ${Number(card.balance ?? 0).toLocaleString()})</option>)}
          </select>
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            value={payAmount}
            onChange={event => setPayAmount(event.target.value)}
            placeholder="Payment amount"
          />
          <button className="payment-action" type="submit" disabled={busy || !selectedCardId}>
            Pay / Deduct
          </button>
        </form>
      )}

      {message && <p className="payment-message" style={{ marginTop: '1rem', color: '#10b981', fontWeight: 500 }}>{message}</p>}
      {error && <p className="payment-error" style={{ marginTop: '1rem', color: '#ef4444', fontWeight: 500 }}>{error}</p>}
    </section>
  );
}
