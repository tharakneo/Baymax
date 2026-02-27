import React, { useState } from 'react';

/**
 * Interactive 1–10 pain/severity scale.
 * Renders as a row of numbered pills — clicking one calls onSelect(n).
 * After selection the chosen pill stays highlighted and the rest fade.
 */
export default function PainScale({ onSelect }) {
    const [selected, setSelected] = useState(null);

    const handleClick = (n) => {
        if (selected !== null) return; // one-shot
        setSelected(n);
        onSelect(n);
    };

    // Color ramps from green → yellow → red
    const getColor = (n) => {
        if (n <= 3) return '#34C759';
        if (n <= 6) return '#FF9F0A';
        if (n <= 8) return '#FF6B35';
        return '#FF3B30';
    };

    return (
        <div className="ps-wrap">
            <div className="ps-label">Tap to rate your pain</div>
            <div className="ps-row">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                        key={n}
                        className={`ps-pill${selected === n ? ' ps-selected' : ''}${selected !== null && selected !== n ? ' ps-faded' : ''}`}
                        style={{
                            '--pill-color': getColor(n),
                            ...(selected === n ? { background: getColor(n), color: '#fff', borderColor: getColor(n) } : {}),
                        }}
                        onClick={() => handleClick(n)}
                        disabled={selected !== null}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <div className="ps-labels">
                <span>Mild</span>
                <span>Severe</span>
            </div>
        </div>
    );
}
