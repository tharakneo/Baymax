import React, { useState, useRef, useEffect } from 'react';
import IntroVideo from './components/IntroVideo';
import ChatWindow from './components/ChatWindow';

const MODULES = [
  { id: 'chat', name: 'Talk to Me', desc: 'Health Q&A powered by RAG' },
  { id: 'scan', name: 'Scan Me', desc: 'Skin & nutrition image analysis' },
  { id: 'track', name: 'Track Me', desc: 'Health trends & anomaly detection' },
  { id: 'check', name: 'Check Me', desc: 'Wellness & mental health assessments' },
];

function ComingSoon({ name }) {
  return (
    <div>
      <div className="mp-soon-title">Coming Soon</div>
      <div className="mp-soon-desc">
        {name} is under development. Connect the backend to bring it to life.
      </div>
    </div>
  );
}

export default function App() {
  // Intro state
  const [videoFading, setVideoFading] = useState(false);
  const [videoGone, setVideoGone] = useState(false);
  const [mainVisible, setMainVisible] = useState(false);

  // Card animation
  const [cardIn, setCardIn] = useState(false);
  const [rowsVisible, setRowsVisible] = useState([]); // booleans per row

  // Module page
  const [activeModule, setActiveModule] = useState(null);
  const [pageOpen, setPageOpen] = useState(false);

  // Called by IntroVideo when the video ends / hits 10.3s
  const handleVideoFinished = () => {
    setVideoFading(true);

    // After fade-out transition (0.5s), remove video layer and show main
    setTimeout(() => {
      setVideoGone(true);
      setMainVisible(true);

      // Stagger: card animates in first, then rows one by one
      setTimeout(() => setCardIn(true), 100);
      MODULES.forEach((_, i) => {
        setTimeout(() => {
          setRowsVisible(prev => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 700 + i * 100);
      });
    }, 500);
  };

  const openModule = (id) => {
    setActiveModule(id);
    // Small rAF delay so React renders the page before adding .open
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPageOpen(true));
    });
  };

  const closeModule = () => {
    setPageOpen(false);
    // Wait for slide-down transition to finish before removing content
    setTimeout(() => setActiveModule(null), 500);
  };

  const activeModuleInfo = MODULES.find(m => m.id === activeModule);

  return (
    <>
      {/* ── VIDEO LAYER ─────────────────────────────────── */}
      {!videoGone && (
        <div className={`video-layer${videoFading ? ' fade-out' : ''}`}>
          <IntroVideo onFinished={handleVideoFinished} />
        </div>
      )}

      {/* ── MAIN CONTENT (hero card) ─────────────────────── */}
      <div className={`main-content${mainVisible ? ' visible' : ''}`}>
        <div className={`hero-card${cardIn ? ' animate-in' : ''}`}>
          <div className="card-header">
            <div className="card-label">BayMax AI</div>
            <div className="card-title">
              Your personal<br />healthcare<br />companion.
            </div>
            <div className="card-subtitle">AI-powered health tools, built for you.</div>
          </div>

          <div className="module-list">
            {MODULES.map((m, i) => (
              <button
                key={m.id}
                className={`module-row${rowsVisible[i] ? ' visible' : ''}`}
                onClick={() => openModule(m.id)}
              >
                <div className="module-row-left">
                  <div className="module-row-name">{m.name}</div>
                  <div className="module-row-desc">{m.desc}</div>
                </div>
                <span className="module-row-arrow">›</span>
              </button>
            ))}
          </div>

          <div className="card-footer">
            <div className="card-footer-text">Not a substitute for professional medical advice</div>
          </div>
        </div>
      </div>

      {/* ── MODULE PAGE (slide up) ───────────────────────── */}
      <div className={`module-page${pageOpen ? ' open' : ''}`}>
        <div className="mp-header">
          <button className="mp-back" onClick={closeModule}>‹ Back</button>
          <div className="mp-title">{activeModuleInfo?.name}</div>
        </div>
        <div className={`mp-body${activeModule !== 'chat' ? ' mp-body--center' : ''}`}>
          {activeModule === 'chat' ? (
            <ChatWindow />
          ) : (
            <ComingSoon name={activeModuleInfo?.name ?? ''} />
          )}
        </div>
      </div>
    </>
  );
}
