import React from 'react';
import './NotFoundPage.css';

interface NotFoundPageProps {
  onNavigate: (page: string) => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="notfound-container">
      <div className="notfound-card">
        {/* Left Side: Service Lift & Broken Car Illustration */}
        <div className="notfound-illustration-wrap">
          <svg
            className="notfound-svg"
            viewBox="0 0 540 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Garage Grid Lines */}
            <line x1="20" y1="260" x2="520" y2="260" stroke="#262626" strokeWidth="4" />
            <line x1="40" y1="20" x2="40" y2="260" stroke="#1c1c1c" strokeWidth="2" strokeDasharray="6 6" />
            <line x1="500" y1="20" x2="500" y2="260" stroke="#1c1c1c" strokeWidth="2" strokeDasharray="6 6" />

            {/* Mechanic Hydraulic Lift Platform */}
            <rect x="70" y="248" width="370" height="12" rx="4" fill="#222222" stroke="#333333" strokeWidth="2" />
            
            {/* Lift Pillars & Support */}
            <rect x="145" y="195" width="20" height="55" fill="#3a3a3c" />
            <rect x="345" y="195" width="20" height="55" fill="#3a3a3c" />
            <rect x="110" y="185" width="290" height="10" rx="3" fill="#2d2d30" stroke="#48484a" strokeWidth="1.5" />

            {/* Danger Hazard Strip on the Ground */}
            <g transform="translate(130, 268)">
              <rect x="0" y="0" width="80" height="24" rx="4" fill="#222222" stroke="#444444" strokeWidth="2" />
              <path d="M10 24 L24 0 M26 24 L40 0 M42 24 L56 0 M58 24 L72 0" stroke="#888888" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Red Mechanic Tool Box */}
            <g transform="translate(415, 222)">
              <rect x="0" y="10" width="62" height="34" rx="4" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
              <rect x="24" y="24" width="14" height="6" rx="2" fill="#1f2937" />
              {/* Toolbox Handle */}
              <path d="M20 10 V4 H42 V10" fill="none" stroke="#991b1b" strokeWidth="3" strokeLinecap="round" />
              <line x1="0" y1="22" x2="62" y2="22" stroke="#991b1b" strokeWidth="2" />
            </g>

            {/* ─── Blue Car Body ───────────────────────────────────── */}
            <g transform="translate(95, 60)">
              {/* Car Shadow */}
              <ellipse cx="160" cy="130" rx="140" ry="10" fill="rgba(0,0,0,0.4)" />

              {/* Main Silhouette / Outer Outline */}
              <path
                d="M40 105 
                   C40 100, 48 85, 65 80 
                   C85 75, 100 45, 125 30 
                   C150 15, 205 15, 255 35 
                   C275 45, 285 70, 300 80 
                   C315 88, 318 95, 318 105
                   L318 120
                   C318 126, 312 130, 305 130
                   L275 130
                   C275 105, 235 105, 235 130
                   L130 130
                   C130 105, 90 105, 90 130
                   L50 130
                   C42 130, 40 125, 40 120
                   Z"
                fill="#2563eb"
                stroke="#1e293b"
                strokeWidth="5"
                strokeLinejoin="round"
              />

              {/* Darker Blue Bottom Trim & Dent */}
              <path
                d="M50 115 C90 122, 130 115, 180 120 C230 112, 280 120, 312 115 L318 120 L40 120 Z"
                fill="#1d4ed8"
              />
              {/* Scratches / Dents on Body */}
              <path d="M190 85 Q205 95 198 108" stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
              <path d="M210 90 Q220 98 214 105" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />

              {/* Front Bumper & Headlight */}
              <rect x="35" y="106" width="14" height="10" rx="2" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2.5" />
              <path d="M42 90 C45 84, 52 84, 55 90 Z" fill="#facc15" stroke="#1e293b" strokeWidth="2" />

              {/* Rear Bumper & Taillight */}
              <rect x="312" y="106" width="10" height="10" rx="2" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2.5" />
              <path d="M312 90 C310 84, 304 84, 302 90 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="2" />

              {/* Door Cut Line & Handle */}
              <path d="M175 40 L175 125" stroke="#1e293b" strokeWidth="3.5" />
              <rect x="155" y="82" width="14" height="4" rx="2" fill="#1e293b" />
              <rect x="183" y="82" width="14" height="4" rx="2" fill="#1e293b" />

              {/* Front Windshield with Crack */}
              <path
                d="M125 36 C145 23, 168 22, 172 36 L172 74 C172 74, 120 74, 100 74 C106 58, 114 44, 125 36 Z"
                fill="#e0f2fe"
                stroke="#1e293b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Windshield Cracks */}
              <path
                d="M136 40 L146 52 L140 58 M146 52 L158 50 L164 62 M146 52 L150 42"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Rear Window */}
              <path
                d="M182 36 C220 25, 250 35, 268 74 L182 74 Z"
                fill="#e0f2fe"
                stroke="#1e293b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Front Wheel / Rim */}
              <g transform="translate(110, 130)">
                <circle cx="0" cy="0" r="28" fill="#334155" stroke="#0f172a" strokeWidth="4" />
                <circle cx="0" cy="0" r="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
                <circle cx="0" cy="0" r="7" fill="#64748b" />
              </g>

              {/* Rear Wheel / Rim (Supported on lift) */}
              <g transform="translate(255, 130)">
                <circle cx="0" cy="0" r="28" fill="#334155" stroke="#0f172a" strokeWidth="4" />
                <circle cx="0" cy="0" r="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
                <circle cx="0" cy="0" r="7" fill="#64748b" />
              </g>
            </g>
          </svg>
        </div>

        {/* Right Side: 404 Text & Action Button */}
        <div className="notfound-content">
          <h1 className="notfound-code">404</h1>
          <h2 className="notfound-heading">Oops, This Page Not Found!</h2>
          <p className="notfound-description">
            YOU MAY HAVE MISTYPED THE ADDRESS OR THE PAGE MAY HAVE MOVED.
          </p>
          <button
            type="button"
            className="notfound-btn"
            onClick={() => onNavigate('home')}
          >
            Back to main page
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
