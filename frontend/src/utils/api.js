/**
 * API utility — Axios wrapper for all backend calls.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE });

// ── Talk to Me ──
export async function sendChatMessage(message, sessionId = null) {
    const { data } = await api.post('/chat/', { message, session_id: sessionId });
    return data;
}

// ── Scan Me ──
export async function uploadScanImage(file, scanType = 'skin') {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post(`/scan/${scanType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

// ── Track Me ──
export async function logHealthData(payload) {
    const { data } = await api.post('/track/log', payload);
    return data;
}

export async function getHealthSummary() {
    const { data } = await api.get('/track/summary');
    return data;
}

export async function getTrends(metric) {
    const { data } = await api.get(`/track/trends/${metric}`);
    return data;
}

// ── Check Me ──
export async function getAssessmentQuestions(type) {
    const { data } = await api.get(`/check/questions/${type}`);
    return data;
}

export async function submitAssessment(payload) {
    const { data } = await api.post('/check/submit', payload);
    return data;
}
