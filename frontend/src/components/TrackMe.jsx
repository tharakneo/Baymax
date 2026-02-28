import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    logHealthEntry,
    getTodaySummary,
    getHealthCard,
    updateHealthCard,
    analyzeFood,
    getTodaysFood,
    deleteHealthLog,
} from '../utils/api';

/* ═══════════════════════════════════════════════════════════════════════════
   TRACK ME — Apple-style health dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

const WATER_UNITS = [
    { id: 'cups', label: 'Cups', factor: 1 },
    { id: 'ml', label: 'mL', factor: 0.00423 },
    { id: 'oz', label: 'oz', factor: 0.125 },
    { id: 'L', label: 'L', factor: 4.227 },
    { id: 'gal', label: 'gal', factor: 16 },
];

function cupsTo(cups, unitId) {
    const u = WATER_UNITS.find(w => w.id === unitId);
    if (!u || u.factor === 0) return cups;
    return cups / u.factor;
}

function fmtWater(cups, unitId) {
    const val = cupsTo(cups, unitId);
    return val >= 100 ? Math.round(val) : parseFloat(val.toFixed(1));
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function dateLabel(dateStr) {
    const today = fmtDate(new Date());
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (dateStr === today) return 'Today';
    if (dateStr === fmtDate(y)) return 'Yesterday';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Sleep Modal (with inline history + delete) ───────────────────────────────
function SleepModal({ onClose, onLogged, logs }) {
    const [value, setValue] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!value) return;
        setSaving(true);
        try { await logHealthEntry('sleep', parseFloat(value)); onLogged(); }
        catch { } finally { setSaving(false); setValue(''); }
    };

    const handleDelete = async (id) => {
        try { await deleteHealthLog(id); onLogged(); } catch { }
    };

    return (
        <div className="tm-overlay" onClick={onClose}>
            <div className="tm-modal" onClick={e => e.stopPropagation()}>
                <div className="tm-modal-title">Sleep</div>
                <div className="tm-modal-field">
                    <input type="number" step="0.5" min="0" max="24" className="tm-input"
                        placeholder="Hours slept" value={value} onChange={e => setValue(e.target.value)} autoFocus />
                    <span className="tm-unit">hrs</span>
                </div>
                <button className="tm-btn tm-btn--primary" onClick={save} disabled={saving || !value} style={{ width: '100%' }}>
                    {saving ? 'Saving…' : 'Add'}
                </button>

                {/* Logged entries */}
                {logs.length > 0 && (
                    <div className="tm-inline-list">
                        {logs.map(l => (
                            <div key={l.id} className="tm-inline-row">
                                <span>{l.value} hours</span>
                                <button className="tm-inline-del" onClick={() => handleDelete(l.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button className="tm-btn tm-btn--ghost" onClick={onClose} style={{ width: '100%' }}>Done</button>
            </div>
        </div>
    );
}

// ── Water Modal (with inline history + delete) ───────────────────────────────
function WaterModal({ onClose, onLogged, logs, waterUnit, setWaterUnit }) {
    const [value, setValue] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!value) return;
        setSaving(true);
        const cups = parseFloat(value) * (WATER_UNITS.find(u => u.id === waterUnit)?.factor || 1);
        try { await logHealthEntry('water', cups); onLogged(); }
        catch { } finally { setSaving(false); setValue(''); }
    };

    const handleDelete = async (id) => {
        try { await deleteHealthLog(id); onLogged(); } catch { }
    };

    return (
        <div className="tm-overlay" onClick={onClose}>
            <div className="tm-modal" onClick={e => e.stopPropagation()}>
                <div className="tm-modal-title">Water</div>
                <div className="tm-unit-pills">
                    {WATER_UNITS.map(u => (
                        <button key={u.id}
                            className={`tm-unit-pill${waterUnit === u.id ? ' active' : ''}`}
                            onClick={() => setWaterUnit(u.id)}
                        >{u.label}</button>
                    ))}
                </div>
                <div className="tm-modal-field">
                    <input type="number" step="0.5" min="0" className="tm-input"
                        placeholder={`Amount in ${waterUnit}`} value={value}
                        onChange={e => setValue(e.target.value)} autoFocus />
                </div>
                <button className="tm-btn tm-btn--primary" onClick={save} disabled={saving || !value} style={{ width: '100%' }}>
                    {saving ? 'Saving…' : 'Add'}
                </button>

                {/* Logged entries */}
                {logs.length > 0 && (
                    <div className="tm-inline-list">
                        {logs.map(l => (
                            <div key={l.id} className="tm-inline-row">
                                <span>{fmtWater(l.value, waterUnit)} {waterUnit}</span>
                                <button className="tm-inline-del" onClick={() => handleDelete(l.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button className="tm-btn tm-btn--ghost" onClick={onClose} style={{ width: '100%' }}>Done</button>
            </div>
        </div>
    );
}

// ── Steps Modal ──────────────────────────────────────────────────────────────
function StepsModal({ onClose }) {
    return (
        <div className="tm-overlay" onClick={onClose}>
            <div className="tm-modal" onClick={e => e.stopPropagation()}>
                <div className="tm-steps-icon-wrap">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </div>
                <div className="tm-modal-title">Steps</div>
                <p className="tm-steps-body">Connect to Apple Watch to sync your daily steps. Step tracking requires a native iOS app with HealthKit access.</p>
                <button className="tm-btn tm-btn--ghost" onClick={onClose} style={{ width: '100%' }}>Done</button>
            </div>
        </div>
    );
}

// ── Health Card Modal ────────────────────────────────────────────────────────
function HealthCardModal({ card, onClose, onSaved }) {
    const [height, setHeight] = useState(card.height || '');
    const [weight, setWeight] = useState(card.weight || '');
    const [age, setAge] = useState(card.age || '');
    const [gender, setGender] = useState(card.gender || '');
    const [calGoal, setCalGoal] = useState(card.calorie_goal || '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const updated = await updateHealthCard({
                height: height ? parseFloat(height) : null,
                weight: weight ? parseFloat(weight) : null,
                age: age ? parseInt(age) : null,
                gender: gender || null,
                calorie_goal: calGoal ? parseInt(calGoal) : null,
            });
            onSaved(updated);
            onClose();
        } catch { } finally { setSaving(false); }
    };

    return (
        <div className="tm-overlay" onClick={onClose}>
            <div className="tm-modal tm-modal--card" onClick={e => e.stopPropagation()}>
                <div className="tm-modal-title">Health Card</div>
                <div className="tm-card-grid">
                    <div className="tm-card-field">
                        <label>Height (cm)</label>
                        <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="172" />
                    </div>
                    <div className="tm-card-field">
                        <label>Weight (kg)</label>
                        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" />
                    </div>
                    <div className="tm-card-field">
                        <label>Age</label>
                        <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25" />
                    </div>
                    <div className="tm-card-field">
                        <label>Daily Cal Goal</label>
                        <input type="number" value={calGoal} onChange={e => setCalGoal(e.target.value)} placeholder="2000" />
                    </div>
                    <div className="tm-card-field" style={{ gridColumn: '1 / -1' }}>
                        <label>Gender</label>
                        <div className="tm-gender-pills">
                            {['Male', 'Female', 'Other'].map(g => (
                                <button key={g}
                                    className={`tm-gender-pill${gender === g.toLowerCase() ? ' active' : ''}`}
                                    onClick={() => setGender(g.toLowerCase())}
                                >{g}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="tm-modal-actions">
                    <button className="tm-btn tm-btn--ghost" onClick={onClose}>Cancel</button>
                    <button className="tm-btn tm-btn--primary" onClick={save} disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Food Logger (centered modal, no donut) ───────────────────────────────────
function FoodLogger({ onClose, onLogged, date }) {
    const [mealType, setMealType] = useState('breakfast');
    const [desc, setDesc] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [todayMeals, setTodayMeals] = useState([]);

    const loadMeals = useCallback(() => {
        getTodaysFood(date).then(d => setTodayMeals(d.meals || [])).catch(() => { });
    }, [date]);

    useEffect(() => { loadMeals(); }, [loadMeals]);

    const handleAnalyze = async () => {
        if (!desc.trim()) return;
        setAnalyzing(true);
        setResult(null);
        try {
            const data = await analyzeFood(mealType, desc.trim());
            setResult(data);
            setDesc('');
            loadMeals();
            onLogged();
        } catch {
            setResult({ nutrition: { summary: 'Analysis failed. Try again.' } });
        } finally { setAnalyzing(false); }
    };

    const handleDeleteMeal = async (id) => {
        try { await deleteHealthLog(id); loadMeals(); onLogged(); } catch { }
    };

    const totalCal = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);

    return (
        <div className="tm-overlay" onClick={onClose}>
            <div className="tm-modal tm-modal--food" onClick={e => e.stopPropagation()}>
                <div className="tm-food-row-header">
                    <div className="tm-modal-title">Food Log</div>
                    <span className="tm-food-cals-badge">{Math.round(totalCal)} cal</span>
                </div>

                {/* Meal tabs */}
                <div className="tm-meal-tabs">
                    {MEAL_TYPES.map(m => (
                        <button key={m}
                            className={`tm-meal-tab${mealType === m.toLowerCase() ? ' active' : ''}`}
                            onClick={() => setMealType(m.toLowerCase())}
                        >{m}</button>
                    ))}
                </div>

                {/* Input */}
                <textarea
                    className="tm-food-textarea"
                    placeholder="Describe what you ate…"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    rows={2}
                />
                <button className="tm-btn tm-btn--primary" style={{ width: '100%' }}
                    onClick={handleAnalyze} disabled={analyzing || !desc.trim()}>
                    {analyzing ? 'Analyzing…' : 'Log & Analyze'}
                </button>

                {/* Result */}
                {result?.nutrition && (
                    <div className="tm-food-result">
                        {result.nutrition.summary && (
                            <div className="tm-food-summary">{result.nutrition.summary}</div>
                        )}
                        {result.nutrition.totals && (
                            <div className="tm-macro-row">
                                <div className="tm-macro tm-macro--p"><span>{result.nutrition.totals.protein_g}g</span>protein</div>
                                <div className="tm-macro tm-macro--c"><span>{result.nutrition.totals.carbs_g}g</span>carbs</div>
                                <div className="tm-macro tm-macro--f"><span>{result.nutrition.totals.fat_g}g</span>fat</div>
                                <div className="tm-macro"><span>{Math.round(result.nutrition.totals.calories)}</span>cal</div>
                            </div>
                        )}
                        {result.nutrition.items?.length > 0 && (
                            <div className="tm-inline-list">
                                {result.nutrition.items.map((item, i) => (
                                    <div key={i} className="tm-inline-row">
                                        <span>{item.name}</span>
                                        <span className="tm-inline-detail">{Math.round(item.calories)} cal</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Today's log */}
                {todayMeals.length > 0 && (
                    <div className="tm-inline-list">
                        <div className="tm-inline-list-header">Logged</div>
                        {todayMeals.map((meal, i) => (
                            <div key={i} className="tm-inline-row">
                                <div>
                                    <div className="tm-inline-type">{meal.meal_type}</div>
                                    <div className="tm-inline-desc">{meal.description}</div>
                                </div>
                                <div className="tm-inline-right">
                                    <span className="tm-inline-detail">{Math.round(meal.calories)} cal</span>
                                    <button className="tm-inline-del" onClick={() => handleDeleteMeal(meal.id)}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button className="tm-btn tm-btn--ghost" onClick={onClose} style={{ width: '100%' }}>Done</button>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function TrackMe() {
    const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()));
    const [summary, setSummary] = useState(null);
    const [card, setCard] = useState(null);
    const [modal, setModal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [waterUnit, setWaterUnit] = useState(() => localStorage.getItem('baymax_water_unit') || 'cups');

    const handleSetWaterUnit = (u) => {
        setWaterUnit(u);
        localStorage.setItem('baymax_water_unit', u);
    };

    const isToday = selectedDate === fmtDate(new Date());

    const fetchData = useCallback(async () => {
        try {
            const [s, c] = await Promise.all([getTodaySummary(selectedDate), getHealthCard()]);
            setSummary(s);
            setCard(c);
        } catch {
            setSummary({ sleep: { total_hours: 0, entries: 0, logs: [] }, water: { total_cups: 0, entries: 0, logs: [] }, food: { entries: 0, meals: [] } });
            setCard({ height: null, weight: null, age: null, gender: null, calorie_goal: null });
        } finally { setLoading(false); }
    }, [selectedDate]);

    useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

    const navigateDate = (dir) => {
        const d = new Date(selectedDate + 'T00:00:00');
        d.setDate(d.getDate() + dir);
        const target = fmtDate(d);
        const todayStr = fmtDate(new Date());
        if (target <= todayStr) setSelectedDate(target);
    };

    if (loading) {
        return <div className="tm-root"><div className="tm-loading">Loading…</div></div>;
    }

    const sleepHrs = summary?.sleep?.total_hours || 0;
    const sleepLogs = summary?.sleep?.logs || [];
    const waterCups = summary?.water?.total_cups || 0;
    const waterLogs = summary?.water?.logs || [];
    const foodCount = summary?.food?.entries || 0;

    return (
        <div className="tm-root">
            {/* ── Top: date nav (left) + health card (far right) ── */}
            <div className="tm-topbar">
                <div className="tm-date-nav">
                    <button className="tm-date-arrow" onClick={() => navigateDate(-1)}>‹</button>
                    <div className="tm-date-label">{dateLabel(selectedDate)}</div>
                    <button className="tm-date-arrow" onClick={() => navigateDate(1)} disabled={isToday}>›</button>
                </div>
                <button className="tm-hc-chip" onClick={() => setModal('card')}>
                    Health Card
                    <span className="tm-hc-chip-arrow">›</span>
                </button>
            </div>

            {/* ── 4 Centered widget tiles ── */}
            <div className="tm-tiles-wrap">
                <div className="tm-tiles">
                    <button className="tm-tile tm-tile--sleep" onClick={() => setModal('sleep')}>
                        <div className="tm-tile-label">Sleep</div>
                        <div className="tm-tile-value">{sleepHrs > 0 ? `${sleepHrs}` : '–'}</div>
                        <div className="tm-tile-sub">{sleepHrs > 0 ? 'hrs' : ''}</div>
                        <div className="tm-tile-action">+</div>
                    </button>

                    <button className="tm-tile tm-tile--water" onClick={() => setModal('water')}>
                        <div className="tm-tile-label">Water</div>
                        <div className="tm-tile-value">{waterCups > 0 ? fmtWater(waterCups, waterUnit) : '–'}</div>
                        <div className="tm-tile-sub">{waterCups > 0 ? waterUnit : ''}</div>
                        <div className="tm-tile-action">+</div>
                    </button>

                    <button className="tm-tile tm-tile--food" onClick={() => setModal('food')}>
                        <div className="tm-tile-label">Food</div>
                        <div className="tm-tile-value">{foodCount > 0 ? foodCount : '–'}</div>
                        <div className="tm-tile-sub">{foodCount > 0 ? 'meals' : ''}</div>
                        <div className="tm-tile-action">+</div>
                    </button>

                    <button className="tm-tile tm-tile--steps" onClick={() => setModal('steps')}>
                        <div className="tm-tile-label">Steps</div>
                        <div className="tm-tile-value">–</div>
                        <div className="tm-tile-sub"></div>
                        <div className="tm-tile-action">›</div>
                    </button>
                </div>
            </div>

            {/* ── Modals ── */}
            {modal === 'sleep' && <SleepModal onClose={() => setModal(null)} onLogged={fetchData} logs={sleepLogs} />}
            {modal === 'water' && <WaterModal onClose={() => setModal(null)} onLogged={fetchData} logs={waterLogs} waterUnit={waterUnit} setWaterUnit={handleSetWaterUnit} />}
            {modal === 'food' && <FoodLogger onClose={() => setModal(null)} onLogged={fetchData} date={selectedDate} />}
            {modal === 'steps' && <StepsModal onClose={() => setModal(null)} />}
            {modal === 'card' && card && (
                <HealthCardModal card={card} onClose={() => setModal(null)} onSaved={c => setCard(c)} />
            )}
        </div>
    );
}
