import React, { useState, useRef } from 'react';
import { uploadScanImage } from '../utils/api';

const SEVERITY_COLORS = {
    low: '#34C759',
    medium: '#FF9F0A',
    high: '#FF3B30',
    unknown: '#86868B',
};

function SeverityBadge({ severity }) {
    const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.unknown;
    return (
        <span className="sc-severity" style={{ '--sev-color': color }}>
            <span className="sc-severity-dot" />
            {severity === 'low' ? 'Low Severity' :
                severity === 'medium' ? 'Medium Severity' :
                    severity === 'high' ? 'High - See a Doctor' :
                        'Unknown'}
        </span>
    );
}

export default function ImageUpload() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [scanType, setScanType] = useState('skin');
    const [phase, setPhase] = useState('idle'); // idle | scanning | done
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const pickFile = (f) => {
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setResult(null);
        setPhase('idle');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer?.files?.[0];
        if (f && f.type.startsWith('image/')) pickFile(f);
    };

    const handleUpload = async () => {
        if (!file || phase === 'scanning') return;
        setPhase('scanning');
        setResult(null);

        try {
            const data = await uploadScanImage(file, 'skin');
            setResult(data);
            setPhase('done');
        } catch {
            setResult({
                label: 'Analysis Failed',
                severity: 'unknown',
                confidence: 0,
                description: 'Something went wrong. Please try again with a clearer image.',
                recommendations: ['Try again with better lighting'],
                see_doctor: false,
            });
            setPhase('done');
        }
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setPhase('idle');
    };

    return (
        <div className="sc-root">


            {/* ── Viewfinder ── */}
            <div
                className={`sc-viewfinder${dragOver ? ' drag-over' : ''}${phase === 'scanning' ? ' scanning' : ''}${phase === 'done' ? ' done' : ''}`}
                onClick={() => !preview && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                {/* Corner brackets */}
                <span className="sc-corner sc-tl" />
                <span className="sc-corner sc-tr" />
                <span className="sc-corner sc-bl" />
                <span className="sc-corner sc-br" />

                {/* Scan line animation */}
                {phase === 'scanning' && <div className="sc-scanline" />}

                {preview ? (
                    <img src={preview} alt="scan preview" className="sc-preview" />
                ) : (
                    <div className="sc-placeholder">
                        <div className="sc-placeholder-title">
                            Drop a skin image here
                        </div>
                        <div className="sc-placeholder-sub">or click to browse</div>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickFile(e.target.files[0])}
                    hidden
                />
            </div>

            {/* ── Action buttons ── */}
            <div className="sc-actions">
                {preview && phase !== 'scanning' && (
                    <button className="sc-btn sc-btn--ghost" onClick={reset}>
                        Clear
                    </button>
                )}
                <button
                    className="sc-btn sc-btn--primary"
                    onClick={preview ? handleUpload : () => inputRef.current?.click()}
                    disabled={phase === 'scanning'}
                >
                    {phase === 'scanning' ? (
                        <><span className="sc-spinner" /> Analyzing…</>
                    ) : preview ? (
                        'Analyze Image'
                    ) : (
                        'Choose Image'
                    )}
                </button>
            </div>

            {/* ── Results Card ── */}
            {result && phase === 'done' && (
                <div className="sc-result" style={{ '--sev-color': SEVERITY_COLORS[result.severity] || SEVERITY_COLORS.unknown }}>
                    <div className="sc-result-header">
                        <h3 className="sc-result-label">{result.label}</h3>
                        <SeverityBadge severity={result.severity} />
                    </div>

                    <p className="sc-result-desc">{result.description}</p>

                    {result.recommendations?.length > 0 && (
                        <div className="sc-recs">
                            <div className="sc-recs-title">Recommendations</div>
                            <ul className="sc-recs-list">
                                {result.recommendations.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {result.see_doctor && (
                        <div className="sc-doctor-alert">
                            ⚠️ Baymax recommends seeing a healthcare professional.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
