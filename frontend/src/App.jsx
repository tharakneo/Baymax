import React, { useState, useEffect, useCallback } from 'react';
import IntroVideo from './components/IntroVideo';
import ChatWindow from './components/ChatWindow';
import ImageUpload from './components/ImageUpload';
import InsightsPanel from './components/InsightsPanel';
import {
  logHealthEntry,
  getTodaySummary,
  getHealthCard,
  updateHealthCard,
  analyzeFood,
  getTodaysFood,
  deleteHealthLog,
} from './utils/api';

/* ═══════════════════════════════════════════════════════════════════════════
   BAYMAX AI — Two-Panel Glassmorphism Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

const WATER_UNITS = [
  { id: 'cups', label: 'Cups', factor: 1 },
  { id: 'ml', label: 'mL', factor: 0.00423 },
  { id: 'oz', label: 'oz', factor: 0.125 },
  { id: 'L', label: 'L', factor: 4.227 },
  { id: 'gal', label: 'gal', factor: 16 },
];

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtWater(cups, unitId) {
  const u = WATER_UNITS.find(w => w.id === unitId);
  if (!u || u.factor === 0) return cups;
  const val = cups / u.factor;
  return val >= 100 ? Math.round(val) : parseFloat(val.toFixed(1));
}

/* ── Detail views for left panel ───────────────────────────────────────── */

function SleepDetail({ date, logs, onLogged, onClose }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!value) return;
    setSaving(true);
    try { await logHealthEntry('sleep', parseFloat(value), null, date); onLogged(); }
    catch { } finally { setSaving(false); setValue(''); }
  };

  const del = async (id) => { try { await deleteHealthLog(id); onLogged(); } catch { } };

  return (
    <div className="dv-root">
      <div className="dv-header-row">
        <div className="dv-title">Sleep Log</div>
        <button className="dv-back" onClick={onClose}>← Back to insights</button>
      </div>
      <div className="dv-input-row">
        <input type="number" step="0.5" min="0" max="24" className="dv-input"
          placeholder="Hours slept" value={value} onChange={e => setValue(e.target.value)} />
        <button className="dv-add" onClick={save} disabled={saving || !value}>
          {saving ? '…' : 'Add'}
        </button>
      </div>
      {logs.length > 0 && (
        <div className="dv-list">
          {logs.map(l => (
            <div key={l.id} className="dv-row">
              <span>{l.value} hours</span>
              <button className="dv-del" onClick={() => del(l.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WaterDetail({ date, logs, onLogged, onClose }) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(() => localStorage.getItem('baymax_water_unit') || 'cups');
  const [saving, setSaving] = useState(false);

  const setUnitPref = (u) => { setUnit(u); localStorage.setItem('baymax_water_unit', u); };

  const save = async () => {
    if (!value) return;
    setSaving(true);
    const cups = parseFloat(value) * (WATER_UNITS.find(u => u.id === unit)?.factor || 1);
    try { await logHealthEntry('water', cups, null, date); onLogged(); }
    catch { } finally { setSaving(false); setValue(''); }
  };

  const del = async (id) => { try { await deleteHealthLog(id); onLogged(); } catch { } };

  return (
    <div className="dv-root">
      <div className="dv-header-row">
        <div className="dv-title">Water Log</div>
        <button className="dv-back" onClick={onClose}>← Back to insights</button>
      </div>
      <div className="dv-pills">
        {WATER_UNITS.map(u => (
          <button key={u.id} className={`dv-pill${unit === u.id ? ' active' : ''}`}
            onClick={() => setUnitPref(u.id)}>{u.label}</button>
        ))}
      </div>
      <div className="dv-input-row">
        <input type="number" step="0.5" min="0" className="dv-input"
          placeholder={`Amount in ${unit}`} value={value} onChange={e => setValue(e.target.value)} />
        <button className="dv-add" onClick={save} disabled={saving || !value}>
          {saving ? '…' : 'Add'}
        </button>
      </div>
      {logs.length > 0 && (
        <div className="dv-list">
          {logs.map(l => (
            <div key={l.id} className="dv-row">
              <span>{fmtWater(l.value, unit)} {unit}</span>
              <button className="dv-del" onClick={() => del(l.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FoodDetail({ date, onLogged, onClose }) {
  const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const [mealType, setMealType] = useState('breakfast');
  const [desc, setDesc] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [meals, setMeals] = useState([]);

  const loadMeals = useCallback(() => {
    getTodaysFood(date).then(d => setMeals(d.meals || [])).catch(() => { });
  }, [date]);
  useEffect(() => { loadMeals(); }, [loadMeals]);

  const handleAnalyze = async () => {
    if (!desc.trim()) return;
    setAnalyzing(true); setResult(null);
    try {
      const data = await analyzeFood(mealType, desc.trim(), date);
      setResult(data); setDesc('');
      loadMeals(); onLogged();
    } catch { setResult({ nutrition: { summary: 'Analysis failed.' } }); }
    finally { setAnalyzing(false); }
  };

  const del = async (id) => { try { await deleteHealthLog(id); loadMeals(); onLogged(); } catch { } };

  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0);

  return (
    <div className="dv-root">
      <div className="dv-header-row">
        <div className="dv-title">Food Log</div>
        <div className="dv-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="dv-badge">{Math.round(totalCal)} cal</span>
          <button className="dv-back" onClick={onClose}>← Back to insights</button>
        </div>
      </div>
      <div className="dv-pills">
        {MEAL_TYPES.map(m => (
          <button key={m} className={`dv-pill${mealType === m.toLowerCase() ? ' active' : ''}`}
            onClick={() => setMealType(m.toLowerCase())}>{m}</button>
        ))}
      </div>
      <textarea className="dv-textarea" placeholder="Describe what you ate…"
        value={desc} onChange={e => setDesc(e.target.value)} rows={2} />
      <button className="dv-analyze" onClick={handleAnalyze} disabled={analyzing || !desc.trim()}>
        {analyzing ? 'Analyzing…' : 'Log & Analyze'}
      </button>

      {result?.nutrition && (
        <div className="dv-result">
          {result.nutrition.summary && <div className="dv-summary">{result.nutrition.summary}</div>}
          {result.nutrition.totals && (
            <div className="dv-macros">
              <span><b>{result.nutrition.totals.protein_g}g</b> protein</span>
              <span><b>{result.nutrition.totals.carbs_g}g</b> carbs</span>
              <span><b>{result.nutrition.totals.fat_g}g</b> fat</span>
            </div>
          )}
        </div>
      )}

      {meals.length > 0 && (
        <div className="dv-list">
          {meals.map((m, i) => (
            <div key={i} className="dv-row">
              <div>
                <div className="dv-meal-type">{m.meal_type}</div>
                <div className="dv-meal-desc">{m.description}</div>
              </div>
              <div className="dv-row-right">
                <span className="dv-cal">{Math.round(m.calories)} cal</span>
                <button className="dv-del" onClick={() => del(m.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepsDetail({ onClose }) {
  return (
    <div className="dv-root">
      <div className="dv-header-row">
        <div className="dv-title">Steps</div>
        <button className="dv-back" onClick={onClose}>← Back to insights</button>
      </div>
      <div className="dv-empty">
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Connect to Apple Watch</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          Step tracking requires a native iOS app with HealthKit.
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   BAYMAX AI — Dashboard Interface
   ────────────────────────────────────────────────────────────────────────── */
function HealthCardModal({ card, onClose, onSaved }) {
  const [f, setF] = useState({ ...card });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateHealthCard({
        height: f.height ? parseFloat(f.height) : null,
        weight: f.weight ? parseFloat(f.weight) : null,
        age: f.age ? parseInt(f.age) : null,
        gender: f.gender || null,
        calorie_goal: f.calorie_goal ? parseInt(f.calorie_goal) : null,
      });
      onSaved(updated); onClose();
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="tm-overlay" onClick={onClose}>
      <div className="tm-modal tm-modal--card" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-title">Health Card</div>
        <div className="tm-card-grid">
          {[['Height (cm)', 'height', '172'], ['Weight (kg)', 'weight', '70'], ['Age', 'age', '25'], ['Daily Cal Goal', 'calorie_goal', '2000']].map(([label, key, ph]) => (
            <div key={key} className="tm-card-field">
              <label>{label}</label>
              <input type="number" value={f[key] || ''} onChange={e => setF(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} />
            </div>
          ))}
          <div className="tm-card-field" style={{ gridColumn: '1 / -1' }}>
            <label>Gender</label>
            <div className="tm-gender-pills">
              {['Male', 'Female', 'Other'].map(g => (
                <button key={g} className={`tm-gender-pill${f.gender === g.toLowerCase() ? ' active' : ''}`}
                  onClick={() => setF(p => ({ ...p, gender: g.toLowerCase() }))}>{g}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="tm-modal-actions">
          <button className="tm-btn tm-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="tm-btn tm-btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Intro
  const [videoFading, setVideoFading] = useState(false);
  const [videoGone, setVideoGone] = useState(false);
  const [dashReady, setDashReady] = useState(false);

  // Dashboard state
  const [rightTab, setRightTab] = useState('chat'); // 'chat' | 'scan'
  const [showHealthCard, setShowHealthCard] = useState(false);

  // Track data
  const [summary, setSummary] = useState(null);
  const [card, setCard] = useState(null);
  const [logDate, setLogDate] = useState(new Date());
  const dateStr = fmtDate(logDate);

  // Track Me sub-detail (shown inside the Track module page)
  const [activeTrackDetail, setActiveTrackDetail] = useState(null);

  const fetchTrackData = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getTodaySummary(dateStr), getHealthCard()]);
      setSummary(s); setCard(c);
    } catch { }
  }, [dateStr]);

  useEffect(() => { if (dashReady) fetchTrackData(); }, [dashReady, fetchTrackData]);

  const handleVideoFinished = () => {
    setVideoFading(true);
    setTimeout(() => { setVideoGone(true); setTimeout(() => setDashReady(true), 100); }, 500);
  };

  const sleepHrs = summary?.sleep?.total_hours || 0;
  const sleepLogs = summary?.sleep?.logs || [];
  const waterCups = summary?.water?.total_cups || 0;
  const waterLogs = summary?.water?.logs || [];
  const foodCount = summary?.food?.entries || 0;
  const waterUnit = localStorage.getItem('baymax_water_unit') || 'cups';

  // Track Me detail views
  let trackDetailView = null;
  if (activeTrackDetail === 'sleep') trackDetailView = <SleepDetail date={dateStr} logs={sleepLogs} onLogged={fetchTrackData} onClose={() => setActiveTrackDetail(null)} />;
  if (activeTrackDetail === 'water') trackDetailView = <WaterDetail date={dateStr} logs={waterLogs} onLogged={fetchTrackData} onClose={() => setActiveTrackDetail(null)} />;
  if (activeTrackDetail === 'food') trackDetailView = <FoodDetail date={dateStr} onLogged={fetchTrackData} onClose={() => setActiveTrackDetail(null)} />;
  if (activeTrackDetail === 'steps') trackDetailView = <StepsDetail onClose={() => setActiveTrackDetail(null)} />;

  return (
    <>
      {/* ── Intro Video ── */}
      {!videoGone && (
        <div className={`video-layer${videoFading ? ' fade-out' : ''}`}>
          <IntroVideo onFinished={handleVideoFinished} />
        </div>
      )}

      {/* ── iCloud-style Dashboard ── */}
      {dashReady && (
        <div className="dash">
          {/* Top bar */}
          <div className="dash-topbar">
            <div className="dash-logo">BayMax</div>
            <button className="dash-hc-btn" onClick={() => setShowHealthCard(true)}>Health Card</button>
          </div>

          {/* Two iCloud cards */}
          <div className="dash-panels">

            {/* LEFT CARD — Track & Insights */}
            <div className="icloud-card">
              <div className="icloud-card-body icloud-card-body--no-pad" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '30px', overflowY: 'auto' }}>
                {activeTrackDetail ? (
                  <div className="track-detail-layer" style={{ padding: '10px' }}>
                    {trackDetailView}
                  </div>
                ) : (
                  <div className="dash-left-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Track Grid Section */}
                    <div className="dash-track-section">
                      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d1d1f' }}>Log</div>

                        <div className="date-compact">
                          <button
                            className="date-compact-btn"
                            onClick={() => { const d = new Date(logDate); d.setDate(d.getDate() - 1); setLogDate(d); }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                          </button>

                          <div className="date-compact-display">
                            {logDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            <input
                              type="date"
                              className="date-compact-input"
                              value={logDate.toISOString().split('T')[0]}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                if (e.target.value) {
                                  // Parse as local date to prevent timezone shift issues
                                  const [y, m, d] = e.target.value.split('-');
                                  setLogDate(new Date(y, m - 1, d));
                                }
                              }}
                            />
                          </div>

                          <button
                            className="date-compact-btn"
                            disabled={logDate.toDateString() === new Date().toDateString()}
                            onClick={() => { const d = new Date(logDate); d.setDate(d.getDate() + 1); setLogDate(d); }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                          </button>
                        </div>
                      </div>

                      <div className="dash-widget-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                        <button className="dash-widget" onClick={() => setActiveTrackDetail('water')}
                          style={{
                            background: 'linear-gradient(135deg, #5AC8FA, #007AFF)', padding: '20px', borderRadius: '22px', border: 'none', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between',
                            height: '110px', transition: 'transform 0.2s', textAlign: 'left',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                          }}>
                          <div style={{ display: 'flex' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{waterCups > 0 ? fmtWater(waterCups, waterUnit) : '-'}</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Water</div>
                          </div>
                        </button>

                        <button className="dash-widget" onClick={() => setActiveTrackDetail('sleep')}
                          style={{
                            background: 'linear-gradient(135deg, #7A62F9, #5856D6)', padding: '20px', borderRadius: '22px', border: 'none', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between',
                            height: '110px', transition: 'transform 0.2s', textAlign: 'left',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                          }}>
                          <div style={{ display: 'flex' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{sleepHrs > 0 ? `${sleepHrs} h` : '-'}</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Sleep</div>
                          </div>
                        </button>

                        <button className="dash-widget" onClick={() => setActiveTrackDetail('food')}
                          style={{
                            background: 'linear-gradient(135deg, #FFB340, #FF9F0A)', padding: '20px', borderRadius: '22px', border: 'none', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between',
                            height: '110px', transition: 'transform 0.2s', textAlign: 'left',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                          }}>
                          <div style={{ display: 'flex' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{foodCount > 0 ? foodCount : '-'}</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Food</div>
                          </div>
                        </button>

                        <button className="dash-widget" onClick={() => setActiveTrackDetail('steps')}
                          style={{
                            background: 'linear-gradient(135deg, #4CD964, #30D158)', padding: '20px', borderRadius: '22px', border: 'none', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between',
                            height: '110px', transition: 'transform 0.2s', textAlign: 'left',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                          }}>
                          <div style={{ display: 'flex' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>-</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Steps</div>
                          </div>
                        </button>

                      </div>
                    </div>

                    {/* Insights Section */}
                    <div className="dash-insights-section">
                      <div className="dash-section-header" style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d1d1f' }}>Baymax Insights</div>
                      </div>
                      <div className="dash-insights-wrapper" style={{ minHeight: '140px' }}>
                        <InsightsPanel sliderMode={true} />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* RIGHT CARD — Chat & Scan */}
            <div className="icloud-card">
              <div className="icloud-card-body icloud-card-body--no-pad" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}>

                {/* Segmented Control */}
                <div className="dash-segmented-wrapper" style={{ padding: '24px 30px 16px', flexShrink: 0 }}>
                  <div className="dash-segmented" style={{ display: 'flex', background: '#F5F5F7', padding: '4px', borderRadius: '12px' }}>
                    <button
                      className={rightTab === 'chat' ? 'active' : ''}
                      onClick={() => setRightTab('chat')}
                      style={{
                        flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none',
                        background: rightTab === 'chat' ? '#FFFFFF' : 'transparent',
                        boxShadow: rightTab === 'chat' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        color: rightTab === 'chat' ? '#1d1d1f' : '#86868b',
                        fontWeight: rightTab === 'chat' ? 600 : 500, fontSize: '14px', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                      Talk to Me
                    </button>
                    <button
                      className={rightTab === 'scan' ? 'active' : ''}
                      onClick={() => setRightTab('scan')}
                      style={{
                        flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none',
                        background: rightTab === 'scan' ? '#FFFFFF' : 'transparent',
                        boxShadow: rightTab === 'scan' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        color: rightTab === 'scan' ? '#1d1d1f' : '#86868b',
                        fontWeight: rightTab === 'scan' ? 600 : 500, fontSize: '14px', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                      Scan Me
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="dash-right-content" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  {rightTab === 'chat' ? <ChatWindow /> : <ImageUpload />}
                </div>

              </div>
            </div>

          </div>

          {/* Health Card Modal */}
          {showHealthCard && card && (
            <HealthCardModal card={card} onClose={() => setShowHealthCard(false)} onSaved={c => setCard(c)} />
          )}
        </div>
      )}
    </>
  );
}

