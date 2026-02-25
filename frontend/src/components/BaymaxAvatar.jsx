import React from 'react';

export default function BaymaxAvatar() {
    return (
        <div className="baymax-avatar">
            <svg viewBox="0 0 200 200" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
                {/* Head */}
                <ellipse cx="100" cy="85" rx="65" ry="55" fill="white" stroke="#E8E8ED" strokeWidth="2" />
                {/* Eyes */}
                <circle cx="80" cy="80" r="6" fill="#1D1D1F" />
                <circle cx="120" cy="80" r="6" fill="#1D1D1F" />
                {/* Eye connector line */}
                <line x1="86" y1="80" x2="114" y2="80" stroke="#1D1D1F" strokeWidth="2" />
                {/* Body hint */}
                <ellipse cx="100" cy="155" rx="50" ry="35" fill="white" stroke="#E8E8ED" strokeWidth="2" />
            </svg>
        </div>
    );
}
