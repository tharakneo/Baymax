import React, { useRef, useEffect, useState } from 'react';

export default function IntroVideo({ onFinished }) {
    const videoRef = useRef(null);
    const [muted, setMuted] = useState(true);
    const finished = useRef(false);

    const finish = () => {
        if (!finished.current) {
            finished.current = true;
            onFinished();
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTimeUpdate = () => {
            if (video.currentTime >= 10.3) finish();
        };
        const onEnded = finish;
        const onError = finish;

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('ended', onEnded);
        video.addEventListener('error', onError);

        // If video source errors before events fire, skip
        const source = video.querySelector('source');
        if (source) source.addEventListener('error', finish);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('ended', onEnded);
            video.removeEventListener('error', onError);
        };
    }, []);

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setMuted(video.muted);
    };

    return (
        <>
            <video
                ref={videoRef}
                className="intro-video"
                playsInline
                preload="auto"
                autoPlay
                muted
            >
                <source src="/intro.mp4" type="video/mp4" />
            </video>

            {/* Apple-style mute toggle: bottom-right, frosted glass */}
            <button className="mute-btn" onClick={toggleMute} title="Toggle sound">
                {muted ? (
                    /* Muted icon */
                    <svg viewBox="0 0 24 24">
                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                        <path fillRule="evenodd" d="M22.28 9.22a.75.75 0 010 1.06L20.56 12l1.72 1.72a.75.75 0 11-1.06 1.06L19.5 13.06l-1.72 1.72a.75.75 0 01-1.06-1.06L18.44 12l-1.72-1.72a.75.75 0 011.06-1.06l1.72 1.72 1.72-1.72a.75.75 0 011.06 0z" clipRule="evenodd" />
                    </svg>
                ) : (
                    /* Sound icon */
                    <svg viewBox="0 0 24 24">
                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.061z" />
                    </svg>
                )}
            </button>
        </>
    );
}
