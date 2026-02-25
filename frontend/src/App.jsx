import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import ImageUpload from './components/ImageUpload';
import Dashboard from './components/Dashboard';
import CheckIn from './components/CheckIn';
import BaymaxAvatar from './components/BaymaxAvatar';

const modules = [
  { id: 'chat', name: 'Talk to Me', desc: 'Health Q&A powered by RAG' },
  { id: 'scan', name: 'Scan Me', desc: 'Skin & nutrition image analysis' },
  { id: 'track', name: 'Track Me', desc: 'Health trends & anomaly detection' },
  { id: 'check', name: 'Check Me', desc: 'Wellness & mental health assessments' },
];

export default function App() {
  const [activeModule, setActiveModule] = useState(null);

  const renderModule = () => {
    switch (activeModule) {
      case 'chat':  return <ChatWindow />;
      case 'scan':  return <ImageUpload />;
      case 'track': return <Dashboard />;
      case 'check': return <CheckIn />;
      default:      return null;
    }
  };

  return (
    <div className="app">
      {!activeModule ? (
        <div className="home">
          <BaymaxAvatar />
          <h1>BayMax AI</h1>
          <p className="subtitle">Your personal healthcare companion</p>
          <div className="module-grid">
            {modules.map((m) => (
              <button
                key={m.id}
                className="module-card"
                onClick={() => setActiveModule(m.id)}
              >
                <span className="module-name">{m.name}</span>
                <span className="module-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="module-view">
          <header>
            <button className="back-btn" onClick={() => setActiveModule(null)}>
              ← Back
            </button>
            <h2>{modules.find((m) => m.id === activeModule)?.name}</h2>
          </header>
          <main>{renderModule()}</main>
        </div>
      )}
    </div>
  );
}
