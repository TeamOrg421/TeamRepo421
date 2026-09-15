import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API_URL = '/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransactionType =
  | 'Deposit'
  | 'Withdraw'
  | 'Transfer'
  | 'DepositReversal'
  | 'WithdrawReversal'
  | 'TransferReversal';

type TransactionStatus = 'Success' | 'Failed';

interface BankCardDto {
  id: string;
  name: string;
  maskedCardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  balance: number;
  isBlocked: boolean;
  bankCardToken: string;
  email: string;
}

interface BankTransactionDto {
  id: string;
  cardId: string;
  secondCardId?: string | null;
  amount: number;
  type: TransactionType | number;
  status: TransactionStatus | number;
  createdAt: string;
  relatedTransactionId?: string | null;
  description?: string | null;
}

interface CreateBankCardForm {
  name: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
  balance: number;
}

const DEFAULT_CARD_FORM: CreateBankCardForm = {
  name: '',
  cardNumber: '',
  cardHolderName: '',
  expiryDate: '',
  cvv: '',
  balance: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_ORDER: TransactionType[] = [
  'Deposit',
  'Withdraw',
  'Transfer',
  'DepositReversal',
  'WithdrawReversal',
  'TransferReversal',
];

const normalizeType = (t: TransactionType | number): string => {
  if (typeof t === 'number') return TYPE_ORDER[t] || 'Unknown';
  return t;
};

const normalizeStatus = (s: TransactionStatus | number): TransactionStatus =>
  typeof s === 'number' ? (s === 0 ? 'Success' : 'Failed') : s;

const formatMoney = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

const shortId = (id?: string | null): string => (id ? `${id.substring(0, 8)}…` : '—');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminBank: React.FC = () => {
  // Ledger
  const [transactions, setTransactions] = useState<BankTransactionDto[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerSort, setLedgerSort] = useState<'newest' | 'oldest' | 'amount-desc' | 'amount-asc'>('newest');
  const [cardSearch, setCardSearch] = useState('');
  const [cardStatus, setCardStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [cardSort, setCardSort] = useState<'newest' | 'name-asc' | 'balance-desc' | 'balance-asc'>('newest');

  // Cards List (Paginated)
  const [allCards, setAllCards] = useState<BankCardDto[]>([]);
  const [cardsLoading, setCardsLoading] = useState<boolean>(true);
  const [cardsPage, setCardsPage] = useState<number>(1);
  const [detailedCard, setDetailedCard] = useState<BankCardDto | null>(null);

  // Customer lookup
  const [lookupEmail, setLookupEmail] = useState<string>('');
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [customerCards, setCustomerCards] = useState<BankCardDto[] | null>(null);
  const [selectedCard, setSelectedCard] = useState<BankCardDto | null>(null);

  // Balance-by-token widget
  const [tokenQuery, setTokenQuery] = useState<string>('');
  const [tokenResult, setTokenResult] = useState<{ cardId: string; balance: number } | null>(null);
  const [tokenLoading, setTokenLoading] = useState<boolean>(false);

  // Modals
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);
  const [cardForm, setCardForm] = useState<CreateBankCardForm>(DEFAULT_CARD_FORM);

  const [actionModal, setActionModal] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [actionAmount, setActionAmount] = useState<number>(0);
  const [transferToCardId, setTransferToCardId] = useState<string>('');

  const [reversingTx, setReversingTx] = useState<BankTransactionDto | null>(null);
  const [detailedTx, setDetailedTx] = useState<BankTransactionDto | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ---- Data loading ----------------------------------------------------

  const fetchLedger = useCallback(async (targetPage: number) => {
    setLedgerLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), sort: ledgerSort });
      if (ledgerSearch.trim()) params.set('search', ledgerSearch.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`${API_URL}/payment?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        showToast('❌ Не вдалося завантажити транзакції');
      }
    } catch (error) {
      console.error('Ledger load error:', error);
      showToast('❌ Помилка зєднання з сервером');
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerSearch, ledgerSort, statusFilter, typeFilter]);

  const fetchAllCards = useCallback(async (targetPage: number) => {
    setCardsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), sort: cardSort });
      if (cardSearch.trim()) params.set('search', cardSearch.trim());
      if (cardStatus !== 'all') params.set('status', cardStatus);
      const res = await fetch(`${API_URL}/payment/GetCards?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAllCards(Array.isArray(data) ? data : []);
      } else {
        showToast('❌ Не вдалося завантажити список карток');
      }
    } catch (error) {
      console.error('Cards load error:', error);
      showToast('❌ Помилка зєднання з сервером');
    } finally {
      setCardsLoading(false);
    }
  }, [cardSearch, cardSort, cardStatus]);

  useEffect(() => {
    fetchLedger(page);
  }, [page, fetchLedger]);

  useEffect(() => {
    fetchAllCards(cardsPage);
  }, [cardsPage, fetchAllCards]);

  useEffect(() => { setPage(1); }, [ledgerSearch, ledgerSort, statusFilter, typeFilter]);
  useEffect(() => { setCardsPage(1); }, [cardSearch, cardSort, cardStatus]);

  const refreshCustomerCards = async (email: string) => {
    try {
      const res = await fetch(`${API_URL}/payment/login?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        const cards: BankCardDto[] = Array.isArray(data) ? data : [];
        setCustomerCards(cards);
        if (selectedCard) {
          setSelectedCard(cards.find((c) => c.id === selectedCard.id) ?? null);
        }
        return cards;
      }
    } catch (error) {
      console.error('Refresh cards error:', error);
    }
    return null;
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) {
      showToast('⚠️ Введіть email власника картки');
      return;
    }
    setLookupLoading(true);
    setSelectedCard(null);
    try {
      const res = await fetch(`${API_URL}/payment/login?email=${encodeURIComponent(lookupEmail.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const cards: BankCardDto[] = Array.isArray(data) ? data : [];
        setCustomerCards(cards);
        if (cards.length === 0) showToast('Картки для цього email не знайдені');
      } else {
        const err = await res.text();
        showToast(`❌ Помилка: ${err || res.statusText}`);
        setCustomerCards(null);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      showToast('❌ Помилка зєднання з сервером');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleTokenLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenQuery.trim()) {
      showToast('⚠️ Введіть токен картки');
      return;
    }
    setTokenLoading(true);
    setTokenResult(null);
    try {
      const res = await fetch(`${API_URL}/payment/card/${tokenQuery.trim()}/balance`);
      if (res.ok) {
        const data = await res.json();
        setTokenResult({ cardId: data.cardId, balance: data.balance });
      } else {
        showToast('❌ Картку за цим токеном не знайдено');
      }
    } catch (error) {
      console.error('Token lookup error:', error);
      showToast('❌ Помилка зєднання з сервером');
    } finally {
      setTokenLoading(false);
    }
  };

  // ---- Card creation -----------------------------------------------------

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.cardHolderName.trim() || !cardForm.cardNumber.trim()) {
      showToast('⚠️ Всі обовʼязкові поля мають бути заповнені');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/payment/add-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cardForm.name || cardForm.cardHolderName,
          cardNumber: cardForm.cardNumber,
          cardHolderName: cardForm.cardHolderName,
          expiryDate: cardForm.expiryDate,
          cvv: cardForm.cvv,
          balance: Number(cardForm.balance) || 0,
        }),
      });
      if (res.ok) {
        showToast(`🎉 Картку успішно випущено для ${cardForm.cardHolderName}`);
        setIsCardModalOpen(false);
        setCardForm(DEFAULT_CARD_FORM);
        await fetchAllCards(cardsPage);
        if (lookupEmail.trim()) {
          await refreshCustomerCards(lookupEmail.trim());
        }
      } else {
        const err = await res.text();
        showToast(`❌ Помилка випуску: ${err || res.statusText}`);
      }
    } catch (error) {
      console.error('Add card error:', error);
      showToast('❌ Помилка зєднання з сервером');
    }
  };

  // ---- Deposit / Withdraw / Transfer --------------------------------------

  const openAction = (kind: 'deposit' | 'withdraw' | 'transfer', card: BankCardDto) => {
    setSelectedCard(card);
    setActionModal(kind);
    setActionAmount(0);
    setTransferToCardId('');
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !actionModal) return;
    if (actionAmount <= 0) {
      showToast('⚠️ Сума має бути більшою за нуль');
      return;
    }

    try {
      let res: Response;
      if (actionModal === 'deposit') {
        res = await fetch(`${API_URL}/payment/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: selectedCard.id, amount: Number(actionAmount) }),
        });
      } else if (actionModal === 'withdraw') {
        res = await fetch(`${API_URL}/payment/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: selectedCard.id, amount: Number(actionAmount) }),
        });
      } else {
        if (!transferToCardId.trim()) {
          showToast('⚠️ Вкажіть ID картки отримувача');
          return;
        }
        res = await fetch(`${API_URL}/payment/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromCardId: selectedCard.id,
            toCardId: transferToCardId.trim(),
            amount: Number(actionAmount),
          }),
        });
      }

      if (res.ok) {
        showToast(`✅ Операцію ${actionModal} успішно виконано`);
        setActionModal(null);
        if (lookupEmail.trim()) await refreshCustomerCards(lookupEmail.trim());
        await fetchLedger(page);
        await fetchAllCards(cardsPage);
      } else {
        const err = await res.text();
        showToast(`❌ ${err || res.statusText}`);
      }
    } catch (error) {
      console.error('Transaction error:', error);
      showToast('❌ Помилка зєднання з сервером');
    }
  };

  // ---- Reverse -------------------------------------------------------------

  const handleConfirmReverse = async () => {
    if (!reversingTx) return;
    try {
      const res = await fetch(`${API_URL}/payment/${reversingTx.id}/reverse`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('↩️ Транзакцію скасовано');
        setReversingTx(null);
        await fetchLedger(page);
        await fetchAllCards(cardsPage);
        if (lookupEmail.trim()) await refreshCustomerCards(lookupEmail.trim());
      } else {
        const err = await res.text();
        showToast(`❌ Помилка скасування: ${err || res.statusText}`);
      }
    } catch (error) {
      console.error('Reverse error:', error);
      showToast('❌ Помилка зєднання з сервером');
    }
  };

  // ---- Copy Helper -------------------------------------------------------
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('📋 Скопійовано в буфер обміну!');
  };

  // ---- Stats & Filtering ---------------------------------------------------

  const successCount = transactions.filter((t) => normalizeStatus(t.status) === 'Success').length;
  const failedCount = transactions.filter((t) => normalizeStatus(t.status) === 'Failed').length;
  const totalVolume = transactions
    .filter((t) => normalizeStatus(t.status) === 'Success')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const filteredTransactions = useMemo(() => {
    const query = ledgerSearch.trim().toLowerCase();
    return transactions
      .filter((t) => {
        const matchesTypeKey = typeFilter === 'all' || normalizeType(t.type) === typeFilter;
        const matchesStatus = statusFilter === 'all' || normalizeStatus(t.status) === statusFilter;
        const searchable = [t.id, t.cardId, t.secondCardId, t.description, normalizeType(t.type)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return matchesTypeKey && matchesStatus && (!query || searchable.includes(query));
      })
      .sort((a, b) => {
        if (ledgerSort === 'amount-desc') return b.amount - a.amount;
        if (ledgerSort === 'amount-asc') return a.amount - b.amount;
        const dateDifference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return ledgerSort === 'newest' ? dateDifference : -dateDifference;
      });
  }, [ledgerSearch, ledgerSort, statusFilter, transactions, typeFilter]);

  return (
    <div className="fb-container">
      <style>{`
        :root {
          --bg-main: #222222;
          --bg-card: #222222;
          --accent-primary: #4a4a4a;
          --accent-primary-hover: #5a5a5a;
          --accent-green: #10b981;
          --accent-red: #ef4444;
          --accent-amber: #f59e0b;
          --text-main: #f8fafc;
          --text-muted: #94a3b8;
          --border: rgba(255, 255, 255, 0.08);
          --radius: 16px;
        }

        .fb-container {
          min-height: 100vh;
          width: 100%;
          max-width: 1920px;
          margin: 0;
          background: #222222;
          color: var(--text-main);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 1.5rem 25.438px 3rem;
          box-sizing: border-box;
        }

        .fb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .fb-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          background: #1e293b;
          border: 1px solid var(--accent-primary);
          color: #fff;
          padding: 12px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          z-index: 1000;
        }

        .fb-title {
          font-size: 2.25rem;
          font-weight: 800;
          margin: 0;
        }

        .fb-title span {
          color: #b7e52a;
        }

        .fb-subtitle {
          color: var(--text-muted);
          margin-top: 0.5rem;
          font-size: 0.95rem;
        }

        .fb-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .fb-stat-card {
          background: #222222;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .fb-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
        }

        .fb-stat-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .fb-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 0.2rem;
        }

        .fb-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .fb-panel {
          background: #222;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .fb-panel-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .fb-form-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .fb-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 0.75rem 1rem;
          color: #fff;
          outline: none;
        }

        .fb-input:focus {
          border-color: var(--accent-primary);
        }

        .fb-btn {
          background: #4a4a4a;
          color: #ffffff;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 0.75rem 1.25rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .fb-btn:hover {
          background: #5a5a5a;
        }

        .fb-btn-secondary {
          background: transparent;
          color: #e7e7e7;
          border: 1px solid #717171;
        }

        .fb-btn-secondary:hover {
          background: #272727;
          border-color: #a0a0a0;
        }

        .fb-card-item {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 1.25rem;
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .fb-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .fb-card-number {
          font-family: monospace;
          font-size: 1.1rem;
        }

        .fb-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .fb-badge-active { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }
        .fb-badge-blocked { background: rgba(239, 68, 68, 0.15); color: var(--accent-red); }

        .fb-card-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .fb-btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.8rem;
          border-radius: 8px;
        }

        .fb-table-container {
          overflow-x: auto;
        }

        .fb-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .fb-table th, .fb-table td {
          padding: 0.8rem;
          border-bottom: 1px solid #3b3b3b;
        }

        .fb-table th {
          color: var(--text-muted);
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .fb-ledger-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .fb-ledger-pagination {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .fb-ledger-tabs {
          display: flex;
          gap: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1rem;
          overflow-x: auto;
        }

        .fb-ledger-tabs button {
          background: none;
          border: 0;
          border-bottom: 2px solid transparent;
          color: #9ca3af;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0.65rem 0;
          white-space: nowrap;
        }

        .fb-ledger-tabs button:hover,
        .fb-ledger-tabs button.active {
          color: #ffffff;
        }

        .fb-ledger-tabs button.active {
          border-bottom-color: #ffffff;
          font-weight: 700;
        }

        .fb-ledger-controls {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) minmax(130px, 180px) minmax(180px, 220px);
          gap: 0.65rem;
          margin-bottom: 1rem;
        }

        .fb-select {
          background: #1a1a1a;
          border: 1px solid #414141;
          border-radius: 4px;
          color: #f3f3f3;
          min-width: 0;
          padding: 0.75rem 0.8rem;
        }

        .fb-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .fb-detail-label {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .fb-detail-value {
          font-weight: 600;
          font-family: monospace;
          word-break: break-all;
          text-align: right;
        }

        .fb-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
        }

        .fb-modal {
          background: #171f33;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          width: 100%;
          max-width: 500px;
          padding: 2rem;
        }

        .fb-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .fb-modal-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
      `}</style>

      {/* Toast */}
      {toastMessage && <div className="fb-toast">{toastMessage}</div>}

      {/* Header */}
      <header className="fb-header">
        <div>
          <h1 className="fb-title">
            Fake<span>Bank</span> Control Center
          </h1>
          <p className="fb-subtitle">Панель адміністрування картками, переказами та аудитом</p>
        </div>
        <button className="fb-btn" onClick={() => setIsCardModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Випустити картку
        </button>
      </header>

      {/* Stats */}
      <div className="fb-stats-grid">
        <div className="fb-stat-card">
          <div className="fb-stat-icon" style={{ color: '#818cf8' }}>💳</div>
          <div>
            <div className="fb-stat-label">Транзакцій на сторінці</div>
            <div className="fb-stat-value">{ledgerLoading ? '…' : transactions.length}</div>
          </div>
        </div>
        <div className="fb-stat-card">
          <div className="fb-stat-icon" style={{ color: '#10b981' }}>✔</div>
          <div>
            <div className="fb-stat-label">Успішно</div>
            <div className="fb-stat-value" style={{ color: 'var(--accent-green)' }}>
              {ledgerLoading ? '…' : successCount}
            </div>
          </div>
        </div>
        <div className="fb-stat-card">
          <div className="fb-stat-icon" style={{ color: '#f59e0b' }}>⚠️</div>
          <div>
            <div className="fb-stat-label">Помилкові</div>
            <div className="fb-stat-value" style={{ color: 'var(--accent-amber)' }}>
              {ledgerLoading ? '…' : failedCount}
            </div>
          </div>
        </div>
        <div className="fb-stat-card">
          <div className="fb-stat-icon" style={{ color: '#c084fc' }}>💵</div>
          <div>
            <div className="fb-stat-label">Загальний обсяг</div>
            <div className="fb-stat-value">{ledgerLoading ? '…' : formatMoney(totalVolume)}</div>
          </div>
        </div>
      </div>

      {/* Grid: Search & Widgets */}
      <div className="fb-grid">
        {/* Customer lookup */}
        <div className="fb-panel">
          <div className="fb-panel-title">Пошук клієнта за email</div>
          <form className="fb-form-group" onSubmit={handleLookup}>
            <input
              type="text"
              className="fb-input"
              placeholder="Email власника картки..."
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
            />
            <button type="submit" className="fb-btn" disabled={lookupLoading}>
              {lookupLoading ? '...' : 'Шукати'}
            </button>
          </form>

          {customerCards !== null && (
            <div>
              {customerCards.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Картки не знайдені.</p>
              ) : (
                customerCards.map((card) => (
                  <div key={card.id} className="fb-card-item">
                    <div className="fb-card-top">
                      <span className="fb-card-number">{card.maskedCardNumber}</span>
                      <span
                        className={`fb-badge ${card.isBlocked ? 'fb-badge-blocked' : 'fb-badge-active'}`}
                      >
                        {card.isBlocked ? 'Заблокована' : 'Активна'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{card.cardHolderName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Дійсна до: {card.expiryDate}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                      {formatMoney(card.balance)}
                    </div>

                    <div className="fb-card-actions">
                      <button
                        className="fb-btn fb-btn-secondary fb-btn-sm"
                        onClick={() => openAction('deposit', card)}
                      >
                        Deposit
                      </button>
                      <button
                        className="fb-btn fb-btn-secondary fb-btn-sm"
                        onClick={() => openAction('withdraw', card)}
                      >
                        Withdraw
                      </button>
                      <button
                        className="fb-btn fb-btn-secondary fb-btn-sm"
                        onClick={() => openAction('transfer', card)}
                      >
                        Transfer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Token Balance Widget */}
        <div className="fb-panel">
          <div className="fb-panel-title">Перевірка балансу за токеном</div>
          <form className="fb-form-group" onSubmit={handleTokenLookup}>
            <input
              type="text"
              className="fb-input"
              placeholder="Введіть токен картки..."
              value={tokenQuery}
              onChange={(e) => setTokenQuery(e.target.value)}
            />
            <button type="submit" className="fb-btn" disabled={tokenLoading}>
              {tokenLoading ? '...' : 'Перевірити'}
            </button>
          </form>

          {tokenResult && (
            <div className="fb-card-item" style={{ marginTop: '1rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Card ID: {shortId(tokenResult.cardId)}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {formatMoney(tokenResult.balance)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="fb-panel">
        <div className="fb-ledger-header">
          <div className="fb-panel-title" style={{ margin: 0 }}>Журнал транзакцій</div>
          <div className="fb-ledger-pagination">
            <button
              className="fb-btn fb-btn-secondary fb-btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Назад
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
              Стор. {page}
            </span>
            <button
              className="fb-btn fb-btn-secondary fb-btn-sm"
              onClick={() => setPage((p) => p + 1)}
            >
              Вперед →
            </button>
          </div>
        </div>

        <div className="fb-ledger-tabs" role="tablist" aria-label="Фільтр транзакцій">
          {(['all', 'Success', 'Failed'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={statusFilter === value || (value === 'all' && statusFilter === 'all') ? 'active' : ''}
              onClick={() => setStatusFilter(value === 'all' ? 'all' : value)}
            >
              {value === 'all' ? 'Усі' : value === 'Success' ? 'Успішні' : 'Помилкові'}
            </button>
          ))}
        </div>

        <div className="fb-ledger-controls">
          <input
            className="fb-input"
            type="search"
            placeholder="Пошук за ID, карткою або описом..."
            value={ledgerSearch}
            onChange={(event) => setLedgerSearch(event.target.value)}
          />
          <select className="fb-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | TransactionType)}>
            <option value="all">Усі типи</option>
            {TYPE_ORDER.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select className="fb-select" value={ledgerSort} onChange={(event) => setLedgerSort(event.target.value as typeof ledgerSort)}>
            <option value="newest">Найновіші</option>
            <option value="oldest">Найстаріші</option>
            <option value="amount-desc">Сума: більша першою</option>
            <option value="amount-asc">Сума: менша першою</option>
          </select>
        </div>

        <div className="fb-table-container">
          <table className="fb-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Тип</th>
                <th>Деталі</th>
                <th>Картки</th>
                <th>Сума</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Дія</th>
              </tr>
            </thead>
            <tbody>
              {ledgerLoading ? (
                <tr>
                    <td colSpan={8} style={{ textAlign: 'center' }}>
                    Завантаження даних...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Транзакцій не знайдено
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const status = normalizeStatus(tx.status);
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: 'monospace' }}>{shortId(tx.id)}</td>
                      <td>{normalizeType(tx.type)}</td>
                      <td>{tx.description || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {shortId(tx.cardId)}{tx.secondCardId ? ` → ${shortId(tx.secondCardId)}` : ''}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatMoney(tx.amount)}</td>
                      <td>
                        <span
                          className={`fb-badge ${status === 'Success' ? 'fb-badge-active' : 'fb-badge-blocked'}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatDate(tx.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            className="fb-btn fb-btn-secondary fb-btn-sm"
                            onClick={() => setDetailedTx(tx)}
                          >
                            Детальніше
                          </button>
                          {status === 'Success' && (
                            <button
                              className="fb-btn fb-btn-secondary fb-btn-sm"
                              style={{ color: 'var(--accent-red)' }}
                              onClick={() => setReversingTx(tx)}
                            >
                              Reverse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards Table (NEW) */}
      <div className="fb-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div className="fb-panel-title" style={{ margin: 0 }}>
            Список карток
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="fb-btn fb-btn-secondary fb-btn-sm"
              disabled={cardsPage <= 1}
              onClick={() => setCardsPage((p) => p - 1)}
            >
              ← Назад
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
              Стор. {cardsPage}
            </span>
            <button
              className="fb-btn fb-btn-secondary fb-btn-sm"
              onClick={() => setCardsPage((p) => p + 1)}
            >
              Вперед →
            </button>
          </div>
        </div>

        <div className="fb-ledger-controls">
          <input
            className="fb-input"
            type="search"
            placeholder="Пошук за власником, email або карткою..."
            value={cardSearch}
            onChange={(event) => setCardSearch(event.target.value)}
          />
          <select className="fb-select" value={cardStatus} onChange={(event) => setCardStatus(event.target.value as typeof cardStatus)}>
            <option value="all">Усі картки</option>
            <option value="active">Активні</option>
            <option value="blocked">Заблоковані</option>
          </select>
          <select className="fb-select" value={cardSort} onChange={(event) => setCardSort(event.target.value as typeof cardSort)}>
            <option value="newest">Найновіші</option>
            <option value="name-asc">Власник: A–Я</option>
            <option value="balance-desc">Баланс: більший першою</option>
            <option value="balance-asc">Баланс: менший першою</option>
          </select>
        </div>

        <div className="fb-table-container">
          <table className="fb-table">
            <thead>
              <tr>
                <th>Номер картки</th>
                <th>Власник</th>
                <th>Назва</th>
                <th>Email</th>
                <th>Баланс</th>
                <th>Статус</th>
                <th>Дія</th>
              </tr>
            </thead>
            <tbody>
              {cardsLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>
                    Завантаження карток...
                  </td>
                </tr>
              ) : allCards.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Картки не знайдено
                  </td>
                </tr>
              ) : (
                allCards.map((card) => (
                  <tr key={card.id}>
                    <td style={{ fontFamily: 'monospace' }}>{card.maskedCardNumber}</td>
                    <td style={{ fontWeight: 600 }}>{card.cardHolderName}</td>
                    <td>{card.name || '—'}</td>
                    <td>{card.email || '—'}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                      {formatMoney(card.balance)}
                    </td>
                    <td>
                      <span
                        className={`fb-badge ${card.isBlocked ? 'fb-badge-blocked' : 'fb-badge-active'}`}
                      >
                        {card.isBlocked ? 'Заблокована' : 'Активна'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="fb-btn fb-btn-secondary fb-btn-sm"
                        onClick={() => setDetailedCard(card)}
                      >
                        Детальніше
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Card Details (NEW) */}
      {detailedCard && (
        <div className="fb-modal-overlay">
          <div className="fb-modal">
            <div className="fb-modal-header">
              <h3 style={{ margin: 0 }}>Деталі картки</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                onClick={() => setDetailedCard(null)}
              >
                ✕
              </button>
            </div>
            <div>
              <div className="fb-detail-row">
                <span className="fb-detail-label">ID картки:</span>
                <span className="fb-detail-value">{detailedCard.id}</span>
              </div>
              <div className="fb-detail-row">
                <span className="fb-detail-label">Власник:</span>
                <span className="fb-detail-value">{detailedCard.cardHolderName}</span>
              </div>
              <div className="fb-detail-row">
                <span className="fb-detail-label">Назва:</span>
                <span className="fb-detail-value">{detailedCard.name || '—'}</span>
              </div>
              <div className="fb-detail-row">
                <span className="fb-detail-label">Email:</span>
                <span className="fb-detail-value">{detailedCard.email || '—'}</span>
              </div>
              <div className="fb-detail-row">
                <span className="fb-detail-label">Номер картки:</span>
                <span className="fb-detail-value">{detailedCard.maskedCardNumber}</span>
              </div>
              <div className="fb-detail-row">
                <span className="fb-detail-label">Термін дії:</span>
                <span className="fb-detail-value">{detailedCard.expiryDate}</span>
              </div>
              <div className="fb-detail-row">
                <span className="fb-detail-label">Баланс:</span>
                <span className="fb-detail-value" style={{ color: 'var(--accent-green)' }}>
                  {formatMoney(detailedCard.balance)}
                </span>
              </div>
              <div className="fb-detail-row">
                <span className="fb-detail-label">Статус:</span>
                <span
                  className={`fb-badge ${detailedCard.isBlocked ? 'fb-badge-blocked' : 'fb-badge-active'}`}
                >
                  {detailedCard.isBlocked ? 'Заблокована' : 'Активна'}
                </span>
              </div>
              <div className="fb-detail-row" style={{ flexDirection: 'column', gap: '0.4rem', border: 'none', marginTop: '0.5rem' }}>
                <span className="fb-detail-label">Токен картки (BankCardToken):</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(() => {
                    const isInvalidToken =
                      !detailedCard.bankCardToken ||
                      detailedCard.bankCardToken === '00000000-0000-0000-0000-000000000000';

                    return (
                      <>
                        <input
                          type="text"
                          readOnly
                          disabled={isInvalidToken}
                          value={isInvalidToken ? 'Токен не дійсний' : detailedCard.bankCardToken}
                          className="fb-input"
                          style={{
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            color: isInvalidToken ? 'var(--accent-red)' : '#fff',
                            opacity: isInvalidToken ? 0.6 : 1,
                            cursor: isInvalidToken ? 'not-allowed' : 'text',
                          }}
                        />
                        <button
                          className="fb-btn fb-btn-secondary fb-btn-sm"
                          disabled={isInvalidToken}
                          onClick={() => !isInvalidToken && copyToClipboard(detailedCard.bankCardToken)}
                          style={{
                            opacity: isInvalidToken ? 0.5 : 1,
                            cursor: isInvalidToken ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Копіювати
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <button
              className="fb-btn fb-btn-secondary"
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={() => setDetailedCard(null)}
            >
              Закрити
            </button>
          </div>
        </div>
      )}

      {/* Modal: Issue Card */}
      {isCardModalOpen && (
        <div className="fb-modal-overlay">
          <div className="fb-modal">
            <div className="fb-modal-header">
              <h3 style={{ margin: 0 }}>Випуск нової картки</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                onClick={() => setIsCardModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form className="fb-modal-form" onSubmit={handleCreateCard}>
              <input
                type="text"
                className="fb-input"
                placeholder="Назва картки (напр. Primary)"
                value={cardForm.name}
                onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
              />
              <input
                type="text"
                className="fb-input"
                placeholder="Імʼя та прізвище власника"
                value={cardForm.cardHolderName}
                onChange={(e) => setCardForm({ ...cardForm, cardHolderName: e.target.value })}
                required
              />
              <input
                type="text"
                className="fb-input"
                placeholder="Номер картки (16 цифр)"
                value={cardForm.cardNumber}
                onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                required
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="fb-input"
                  placeholder="MM/YY"
                  value={cardForm.expiryDate}
                  onChange={(e) => setCardForm({ ...cardForm, expiryDate: e.target.value })}
                />
                <input
                  type="text"
                  className="fb-input"
                  placeholder="CVV"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                />
              </div>
              <input
                type="number"
                className="fb-input"
                placeholder="Початковий баланс"
                value={cardForm.balance}
                onChange={(e) => setCardForm({ ...cardForm, balance: Number(e.target.value) })}
              />
              <button type="submit" className="fb-btn" style={{ marginTop: '0.5rem' }}>
                Створити картку
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Actions (Deposit/Withdraw/Transfer) */}
      {actionModal && selectedCard && (
        <div className="fb-modal-overlay">
          <div className="fb-modal">
            <div className="fb-modal-header">
              <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{actionModal}</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                onClick={() => setActionModal(null)}
              >
                ✕
              </button>
            </div>
            <form className="fb-modal-form" onSubmit={handleActionSubmit}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Картка: {selectedCard.maskedCardNumber} ({selectedCard.cardHolderName})
              </div>
              <input
                type="number"
                className="fb-input"
                placeholder="Сума"
                value={actionAmount || ''}
                onChange={(e) => setActionAmount(Number(e.target.value))}
                required
              />
              {actionModal === 'transfer' && (
                <input
                  type="text"
                  className="fb-input"
                  placeholder="ID картки отримувача"
                  value={transferToCardId}
                  onChange={(e) => setTransferToCardId(e.target.value)}
                  required
                />
              )}
              <button type="submit" className="fb-btn" style={{ marginTop: '0.5rem' }}>
                Підтвердити
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reverse Confirmation */}
      {reversingTx && (
        <div className="fb-modal-overlay">
          <div className="fb-modal">
            <div className="fb-modal-header">
              <h3 style={{ margin: 0 }}>Скасування транзакції</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                onClick={() => setReversingTx(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Ви впевнені, що хочете скасувати транзакцію {shortId(reversingTx.id)} на суму{' '}
              {formatMoney(reversingTx.amount)}?
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="fb-btn fb-btn-secondary" onClick={() => setReversingTx(null)}>
                Скасувати
              </button>
              <button
                className="fb-btn"
                style={{ background: 'var(--accent-red)' }}
                onClick={handleConfirmReverse}
              >
                Підтвердити скасування
              </button>
            </div>
          </div>
        </div>
      )}

      {detailedTx && (
        <div className="fb-modal-overlay">
          <div className="fb-modal">
            <div className="fb-modal-header">
              <h3 style={{ margin: 0 }}>Деталі транзакції</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                onClick={() => setDetailedTx(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <div><strong>ID:</strong> <span style={{ fontFamily: 'monospace', color: '#fff' }}>{detailedTx.id}</span></div>
              <div><strong>Тип:</strong> <span style={{ color: '#fff' }}>{normalizeType(detailedTx.type)}</span></div>
              <div><strong>Деталі:</strong> <span style={{ color: '#fff' }}>{detailedTx.description || 'Без опису'}</span></div>
              <div><strong>Картка:</strong> <span style={{ fontFamily: 'monospace', color: '#fff' }}>{detailedTx.cardId}</span></div>
              {detailedTx.secondCardId && <div><strong>Друга картка:</strong> <span style={{ fontFamily: 'monospace', color: '#fff' }}>{detailedTx.secondCardId}</span></div>}
              <div><strong>Сума:</strong> <span style={{ color: '#fff' }}>{formatMoney(detailedTx.amount)}</span></div>
              <div><strong>Статус:</strong> <span style={{ color: '#fff' }}>{normalizeStatus(detailedTx.status)}</span></div>
              <div><strong>Дата:</strong> <span style={{ color: '#fff' }}>{formatDate(detailedTx.createdAt)}</span></div>
              {detailedTx.relatedTransactionId && <div><strong>Пов’язана транзакція:</strong> <span style={{ fontFamily: 'monospace', color: '#fff' }}>{detailedTx.relatedTransactionId}</span></div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="fb-btn fb-btn-secondary" onClick={() => setDetailedTx(null)}>
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBank;