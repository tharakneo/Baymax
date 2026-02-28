/**
 * API utility — Axios wrapper for all backend calls.
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE });

// ── Talk to Me ──
export async function sendChatMessage(message, conversationId = null) {
    const { data } = await api.post('/chat/message', { message, conversation_id: conversationId });
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
export async function logHealthEntry(logType, value, notes = null, dateStr = null) {
    const { data } = await api.post('/track/log', { log_type: logType, value, notes, date_str: dateStr });
    return data;
}

export async function getTrackLogs(logType, days = 7) {
    const { data } = await api.get(`/track/logs/${logType}?days=${days}`);
    return data;
}

export async function getTodaySummary(date = null) {
    const tz = new Date().getTimezoneOffset();
    const params = [`tz_offset=${tz}`];
    if (date) params.push(`date=${date}`);
    const { data } = await api.get(`/track/summary?${params.join('&')}`);
    return data;
}

export async function getHealthCard() {
    const { data } = await api.get('/track/health-card');
    return data;
}

export async function updateHealthCard(card) {
    const { data } = await api.put('/track/health-card', card);
    return data;
}

export async function analyzeFood(mealType, description, dateStr = null) {
    const { data } = await api.post('/track/food/analyze', { meal_type: mealType, description, date_str: dateStr });
    return data;
}

export async function getTodaysFood(date = null) {
    const q = date ? `?date=${date}` : '';
    const { data } = await api.get(`/track/food/today${q}`);
    return data;
}

export async function deleteHealthLog(logId) {
    const { data } = await api.delete(`/track/logs/${logId}`);
    return data;
}

// ── Insights ──
export async function getWeeklyInsights() {
    const tz = new Date().getTimezoneOffset();
    const { data } = await api.get(`/insights/weekly?tz_offset=${tz}`);
    return data;
}
