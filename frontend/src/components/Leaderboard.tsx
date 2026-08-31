import React, { useEffect, useState } from 'react';
import './Leaderboard.css';

interface LeaderBordEntety {
  userId: string | number;
  userName: string;
  totalWinningBid: number;
  totalWins: number;
  carName: string;
}

interface LeaderboardProps {
  onNavigate?: (page: string, params?: { carId?: number | string }) => void;
}

// Статичні дані-заглушка на випадок, якщо в БД ще немає жодного переможця аукціону
const FALLBACK_LEADERBOARD: LeaderBordEntety[] = [
  { userId: 'demo-1', userName: 'MotorMaverick', totalWinningBid: 128500, totalWins: 6, carName: 'Porsche 911, BMW M3, Audi RS6' },
  { userId: 'demo-2', userName: 'ClassicChaser', totalWinningBid: 97200, totalWins: 5, carName: 'Ford Mustang, Chevrolet Camaro' },
  { userId: 'demo-3', userName: 'GarageQueen', totalWinningBid: 84300, totalWins: 4, carName: 'Mercedes-Benz SL, Jaguar E-Type' },
  { userId: 'demo-4', userName: 'TorqueTitan', totalWinningBid: 61900, totalWins: 4, carName: 'Toyota Supra, Nissan GT-R' },
  { userId: 'demo-5', userName: 'RustHunter', totalWinningBid: 54200, totalWins: 3, carName: 'Land Rover Defender' },
  { userId: 'demo-6', userName: 'VelocityVik', totalWinningBid: 48750, totalWins: 3, carName: 'Subaru WRX STI, Mazda RX-7' },
  { userId: 'demo-7', userName: 'CoupeCollector', totalWinningBid: 39900, totalWins: 2, carName: 'Alfa Romeo GTV' },
  { userId: 'demo-8', userName: 'PitLaneNadia', totalWinningBid: 33150, totalWins: 2, carName: 'Volkswagen Golf GTI' },
  { userId: 'demo-9', userName: 'HighBidderHank', totalWinningBid: 27400, totalWins: 2, carName: 'Honda Civic Type R' },
  { userId: 'demo-10', userName: 'AuctionRookie', totalWinningBid: 18600, totalWins: 1, carName: 'Mini Cooper S' },
];

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard: React.FC<LeaderboardProps> = ({ onNavigate }) => {
  const [entries, setEntries] = useState<LeaderBordEntety[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/leaderbord/top10');
        if (!response.ok) throw new Error('Failed to load leaderboard');
        const data = await response.json();
        const list: LeaderBordEntety[] = Array.isArray(data) ? data : [];
        if (list.length === 0) {
          setEntries(FALLBACK_LEADERBOARD);
          setIsDemoData(true);
        } else {
          setEntries(list);
          setIsDemoData(false);
        }
      } catch {
        setEntries(FALLBACK_LEADERBOARD);
        setIsDemoData(true);
        setError('Не вдалося зʼєднатися з сервером — показано демо-дані.');
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, []);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3, 10);

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-intro">
        <p className="leaderboard-eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v6a6 6 0 0 1-12 0V4z" />
            <path d="M12 16v4M9 20h6" />
          </svg>
          Топ переможці аукціонів
        </p>
        <h1>
          Лідер<span className="gradient-text-accent">борд</span>
        </h1>
        <p>Рейтинг користувачів за загальною сумою виграних ставок на CarsBids.</p>
      </div>

      {isDemoData && (
        <div className="leaderboard-demo-banner glass-panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            У базі поки немає завершених аукціонів із переможцями, тож нижче показано приклад того, як виглядатиме
            рейтинг.
          </span>
        </div>
      )}

      {error && <div className="msg msg-error leaderboard-error-msg">{error}</div>}

      {loading ? (
        <div className="profile-loading glass-panel">
          <div className="profile-spinner" />
          <span>Завантаження рейтингу...</span>
        </div>
      ) : (
        <>
          {/* ===== ПОДІУМ: ТОП-3 ===== */}
          <div className="leaderboard-podium">
            {podium.map((entry, index) => (
              <div
                key={String(entry.userId)}
                className={`leaderboard-podium-card glass-panel glass-panel-hover podium-rank-${index + 1}`}
                onClick={() => onNavigate?.('profile', undefined)}
              >
                <span className="podium-rank-badge">#{index + 1}</span>
                <div className="podium-medal">{RANK_MEDALS[index]}</div>
                <div className="podium-avatar">{initialsOf(entry.userName)}</div>
                <div className="podium-username">{entry.userName}</div>
                <div className="podium-bid">${entry.totalWinningBid.toLocaleString()}</div>
                <div className="podium-wins">
                  {entry.totalWins} {entry.totalWins === 1 ? 'перемога' : 'перемог'}
                </div>
                {entry.carName && <div className="podium-cars">{entry.carName}</div>}
              </div>
            ))}
          </div>

          {/* ===== РЕШТА РЕЙТИНГУ: 4-10 ===== */}
          {rest.length > 0 && (
            <div className="leaderboard-list glass-panel">
              {rest.map((entry, index) => (
                <div
                  key={String(entry.userId)}
                  className="leaderboard-row"
                  onClick={() => onNavigate?.('profile', undefined)}
                >
                  <div className="leaderboard-row-rank">{index + 4}</div>
                  <div className="leaderboard-row-avatar">{initialsOf(entry.userName)}</div>
                  <div className="leaderboard-row-info">
                    <div className="leaderboard-row-name">{entry.userName}</div>
                    <div className="leaderboard-row-cars">{entry.carName || 'Немає даних про авто'}</div>
                  </div>
                  <div className="leaderboard-row-stats">
                    <span className="leaderboard-row-wins">{entry.totalWins} W</span>
                    <span className="leaderboard-row-bid">${entry.totalWinningBid.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {entries.length === 0 && (
            <div className="catalog-empty">
              <h3>Рейтинг порожній</h3>
              <p>Поки що жоден аукціон не завершився з переможцем.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;