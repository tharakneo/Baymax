import React, { useState, useEffect } from 'react';
import { getWeeklyInsights } from '../utils/api';

const INSIGHT_ICONS = {
    warning: '⚠',
    tip: '💡',
    positive: '✓',
};

const INSIGHT_CLS = {
    warning: 'insight--warn',
    tip: 'insight--tip',
    positive: 'insight--good',
};

export default function InsightsPanel({ sliderMode }) {
    const [insights, setInsights] = useState([]);
    const [period, setPeriod] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getWeeklyInsights()
            .then(d => { setInsights(d.insights || []); setPeriod(d.period || ''); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const listClass = sliderMode ? 'ip-slider' : 'ip-list';

    return (
        <div className="ip-root" style={sliderMode ? { padding: 0, background: 'transparent', boxShadow: 'none' } : {}}>
            {!sliderMode && (
                <div className="ip-header">
                    <div className="ip-title">Insights</div>
                    {period && <div className="ip-period">{period}</div>}
                </div>
            )}

            {loading ? (
                <div className="ip-loading">Analyzing patterns…</div>
            ) : insights.length === 0 ? (
                <div className="ip-empty" style={sliderMode ? { background: '#F5F5F7', borderRadius: '20px' } : {}}>
                    <div className="ip-empty-icon">🔍</div>
                    <div className="ip-empty-text">Log your sleep, food, and water for a few days to unlock weekly insights.</div>
                </div>
            ) : (
                <div className={listClass}>
                    {insights.map((ins, i) => (
                        <div key={i} className={`ip-card ${INSIGHT_CLS[ins.type] || ''}`}>
                            <div className="ip-card-icon">{INSIGHT_ICONS[ins.type] || '•'}</div>
                            <div className="ip-card-body">
                                <div className="ip-card-title">{ins.title}</div>
                                <div className="ip-card-text">{ins.body}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
