import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../utils/api';
import PainScale from './PainScale';

/* ── Typewriter — reveals text word-by-word like ChatGPT / Claude ────────── */
function useTypewriter(text, speed = 28) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const idx = useRef(0);
    const words = useRef([]);

    useEffect(() => {
        if (!text) { setDisplayed(''); setDone(true); return; }
        words.current = text.split(/(\s+)/);
        idx.current = 0;
        setDisplayed('');
        setDone(false);

        const timer = setInterval(() => {
            idx.current++;
            setDisplayed(words.current.slice(0, idx.current).join(''));
            if (idx.current >= words.current.length) {
                clearInterval(timer);
                setDone(true);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return { displayed, done };
}

/* ── Detect "scale of 1 to 10" type questions ────────────────────────────── */
const SCALE_PATTERNS = [
    /scale\s+of\s+(?:one|1)\s+to\s+(?:ten|10)/i,
    /on\s+a\s+scale\s+(?:of\s+)?(?:one|1)\s+to\s+(?:ten|10)/i,
    /rate\s+(?:your|the)\s+(?:pain|discomfort|severity)/i,
    /(?:one|1)\s+to\s+(?:ten|10).*(?:rate|scale|how\s+(?:bad|severe))/i,
];

function hasScaleQuestion(text) {
    return SCALE_PATTERNS.some(rx => rx.test(text));
}

/* ── Single assistant message with typewriter ────────────────────────────── */
function AssistantMessage({ content, animate, showScale, onScaleSelect }) {
    const { displayed, done } = useTypewriter(animate ? content : null, 28);
    const show = animate ? displayed : content;

    return (
        <>
            <div className="cw-msg cw-msg--assistant">
                <div className="cw-avatar">B</div>
                <div className="cw-msg-text">
                    {show}
                    {animate && !done && <span className="cw-cursor" />}
                </div>
            </div>
            {showScale && (animate ? done : true) && (
                <div className="cw-msg cw-msg--widget">
                    <div style={{ width: 30, flexShrink: 0 }} />
                    <PainScale onSelect={onScaleSelect} />
                </div>
            )}
        </>
    );
}

export default function ChatWindow() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streamIdx, setStreamIdx] = useState(-1);
    // Track which messages have had their scale already used
    const [usedScales, setUsedScales] = useState(new Set());
    const conversationIdRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const isEmpty = messages.length === 0 && !loading;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => { inputRef.current?.focus(); }, []);

    /* ── Send a message (can be called by user or by scale widget) ────────── */
    const doSend = async (text) => {
        if (!text.trim() || loading) return;

        const newMsgs = [...messages, { role: 'user', content: text.trim() }];
        setMessages(newMsgs);
        setInput('');
        setLoading(true);

        try {
            const data = await sendChatMessage(text.trim(), conversationIdRef.current);
            if (data.conversation_id) conversationIdRef.current = data.conversation_id;
            const withReply = [...newMsgs, { role: 'assistant', content: data.answer }];
            setMessages(withReply);
            setStreamIdx(withReply.length - 1);
        } catch {
            const withErr = [...newMsgs, {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
            }];
            setMessages(withErr);
            setStreamIdx(withErr.length - 1);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => doSend(input);
    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleScaleSelect = (msgIdx, value) => {
        setUsedScales(prev => new Set(prev).add(msgIdx));
        doSend(`${value} out of 10`);
    };

    return (
        <div className={`cw-root${isEmpty ? ' cw-empty' : ''}`}>

            {/* ── Messages ── */}
            {!isEmpty && (
                <div className="cw-messages">
                    {messages.map((msg, i) =>
                        msg.role === 'assistant' ? (
                            <AssistantMessage
                                key={i}
                                content={msg.content}
                                animate={i === streamIdx}
                                showScale={hasScaleQuestion(msg.content) && !usedScales.has(i)}
                                onScaleSelect={(val) => handleScaleSelect(i, val)}
                            />
                        ) : (
                            <div key={i} className="cw-msg cw-msg--user">
                                <div className="cw-msg-text">{msg.content}</div>
                            </div>
                        )
                    )}
                    {loading && (
                        <div className="cw-msg cw-msg--assistant">
                            <div className="cw-avatar">B</div>
                            <div className="cw-msg-text cw-thinking">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* ── Empty state ── */}
            {isEmpty && (
                <div className="cw-hero">
                    <div className="cw-hero-inner">
                        <div className="cw-hero-greeting">Hello. I am Baymax,</div>
                        <div className="cw-hero-sub">your personal healthcare companion.</div>
                    </div>
                </div>
            )}

            {/* ── Input ── */}
            <div className={`cw-inputwrap${isEmpty ? ' cw-inputwrap--center' : ''}`}>
                <div className="cw-inputbar">
                    <textarea
                        ref={inputRef}
                        className="cw-textarea"
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Ask anything about your health…"
                        disabled={loading}
                    />
                    <button
                        className="cw-send"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        title="Send"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                        </svg>
                    </button>
                </div>
                <p className="cw-disclaimer">Not a substitute for professional medical advice.</p>
            </div>
        </div>
    );
}
