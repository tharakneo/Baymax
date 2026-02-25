import React, { useState } from 'react';
import { logHealthData, getHealthSummary } from '../utils/api';

export default function Dashboard() {
    const [metric, setMetric] = useState('heart_rate');
    const [value, setValue] = useState('');
    const [unit, setUnit] = useState('bpm');
    const [status, setStatus] = useState(null);

    const metrics = [
        { name: 'heart_rate', unit: 'bpm', label: 'Heart Rate' },
        { name: 'blood_pressure', unit: 'mmHg', label: 'Blood Pressure' },
        { name: 'weight', unit: 'kg', label: 'Weight' },
        { name: 'temperature', unit: '°C', label: 'Temperature' },
        { name: 'sleep', unit: 'hours', label: 'Sleep' },
    ];

    const handleLog = async () => {
        if (!value) return;
        try {
            await logHealthData({ metric, value: parseFloat(value), unit });
            setStatus('✓ Logged successfully');
            setValue('');
        } catch {
            setStatus('✗ Failed to log');
        }
    };

    const handleMetricChange = (e) => {
        const selected = e.target.value;
        setMetric(selected);
        const m = metrics.find((m) => m.name === selected);
        if (m) setUnit(m.unit);
    };

    return (
        <div className="dashboard">
            <div className="log-form">
                <h3>Log Health Data</h3>
                <select value={metric} onChange={handleMetricChange}>
                    {metrics.map((m) => (
                        <option key={m.name} value={m.name}>{m.label}</option>
                    ))}
                </select>
                <div className="input-row">
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={`Value (${unit})`}
                    />
                    <span className="unit-label">{unit}</span>
                </div>
                <button onClick={handleLog}>Log</button>
                {status && <p className="log-status">{status}</p>}
            </div>

            <div className="trends-placeholder">
                <h3>Trends</h3>
                <p>Connect the backend to view your health trends and anomaly detection.</p>
            </div>
        </div>
    );
}
