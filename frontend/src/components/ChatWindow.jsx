import React, { useState } from 'react';
import { sendChatMessage } from '../utils/api';

export default function ChatWindow() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const data = await sendChatMessage(input);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.reply },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-window">
            <div className="chat-messages">
                {messages.length === 0 && (
                    <p className="chat-empty">Ask me anything about your health!</p>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {loading && <div className="chat-bubble assistant loading">Thinking...</div>}
            </div>
            <div className="chat-input-bar">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your health question..."
                />
                <button onClick={handleSend} disabled={loading}>Send</button>
            </div>
        </div>
    );
}
