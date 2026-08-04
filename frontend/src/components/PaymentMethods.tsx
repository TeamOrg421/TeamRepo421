import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  addBankCard,
  getBankCards,
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
  const [paymentCardId, setPaymentCardId] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadCards = async () => {
    try {
      const loadedCards = await getBankCards();
      setCards(loadedCards);
      setPaymentCardId(current => current || loadedCards[0]?.id || '');
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
      setCards(current => [...current, createdCard]);
      setPaymentCardId(createdCard.id);
      setCardForm(emptyCard);
      setMessage('Card added successfully.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add the card.');
    } finally {
      setBusy(false);
    }
  };

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const result = await pay({ cardId: paymentCardId, amount: Number(amount) });
      setMessage(result.message || 'Payment completed.');
      setAmount('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="payment-methods glass-panel">
      <div className="payment-methods-heading">
        <div>
          <h2>Payment methods</h2>
          <p>Card data is sent directly to the bank once; only a masked number is kept here.</p>
        </div>
      </div>

      {cards.length > 0 && (
        <ul className="payment-card-list">
          {cards.map(card => (
            <li key={card.id} className="payment-card-item">
              <span>{card.maskedCardNumber}</span>
              <span>{card.cardHolderName}</span>
              {card.isDefault && <span className="payment-default-label">Default</span>}
            </li>
          ))}
        </ul>
      )}

      <form className="payment-form" onSubmit={submitCard}>
        <h3>Add a card</h3>
        <input
          required
          value={cardForm.cardHolderName}
          onChange={event => setCardForm(current => ({ ...current, cardHolderName: event.target.value }))}
          placeholder="Cardholder name"
          autoComplete="cc-name"
        />
        <input
          required
          value={cardForm.cardNumber}
          onChange={event => setCardForm(current => ({ ...current, cardNumber: event.target.value }))}
          placeholder="Card number"
          inputMode="numeric"
          maxLength={19}
          autoComplete="cc-number"
        />
        <div className="payment-form-row">
          <input
            required
            value={cardForm.expiryDate}
            onChange={event => setCardForm(current => ({ ...current, expiryDate: event.target.value }))}
            placeholder="MM/YY"
            autoComplete="cc-exp"
          />
          <input
            required
            value={cardForm.cvv}
            onChange={event => setCardForm(current => ({ ...current, cvv: event.target.value }))}
            placeholder="CVV"
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

      {cards.length > 0 && (
        <form className="payment-form" onSubmit={submitPayment}>
          <h3>Make a payment(для тесту)</h3>
          <select required value={paymentCardId} onChange={event => setPaymentCardId(event.target.value)}>
            {cards.map(card => <option key={card.id} value={card.id}>{card.maskedCardNumber}</option>)}
          </select>
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            value={amount}
            onChange={event => setAmount(event.target.value)}
            placeholder="Amount"
          />
          <button className="payment-action" type="submit" disabled={busy || !paymentCardId}>
            Pay
          </button>
        </form>
      )}

      {message && <p className="payment-message">{message}</p>}
      {error && <p className="payment-error">{error}</p>}
    </section>
  );
}
