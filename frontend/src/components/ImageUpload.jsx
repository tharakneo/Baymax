import React, { useState } from 'react';
import { uploadScanImage } from '../utils/api';

export default function ImageUpload() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [scanType, setScanType] = useState('skin');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const data = await uploadScanImage(file, scanType);
            setResult(data);
        } catch {
            setResult({ label: 'Error', confidence: 0, description: 'Upload failed.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="image-upload">
            <div className="scan-type-toggle">
                <button className={scanType === 'skin' ? 'active' : ''} onClick={() => setScanType('skin')}>Skin</button>
                <button className={scanType === 'nutrition' ? 'active' : ''} onClick={() => setScanType('nutrition')}>Nutrition</button>
            </div>

            <label className="upload-area">
                {preview ? <img src={preview} alt="preview" /> : <span>Click or drag an image here</span>}
                <input type="file" accept="image/*" onChange={handleFileChange} hidden />
            </label>

            <button className="analyze-btn" onClick={handleUpload} disabled={!file || loading}>
                {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>

            {result && (
                <div className="scan-result">
                    <h3>{result.label}</h3>
                    <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                    <p>{result.description}</p>
                </div>
            )}
        </div>
    );
}
