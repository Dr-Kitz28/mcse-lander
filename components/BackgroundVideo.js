'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function BackgroundVideo() {
    const [videoLoaded, setVideoLoaded] = useState(false);
    const videoUrl = '/bgfinal.mp4';

    // Register service worker for video caching
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/video-cache-sw.js').catch(error => {
                console.error('Service Worker registration failed:', error);
            });
        }

        // Check if video is already in browser cache
        if (caches) {
            caches.match(videoUrl).then(response => {
                if (response) {
                    setVideoLoaded(true);
                }
            });
        }
    }, []);

    return (
        <>
            <Head>
                {/* Add preload hint for the video */}
                <link
                    rel="preload"
                    href={videoUrl}
                    as="video"
                    type="video/mp4"
                    crossOrigin="anonymous"
                />
            </Head>

            <div className="fixed inset-0 z-0">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute w-full h-full object-cover opacity-80"
                    preload="auto"
                    onLoadedData={() => setVideoLoaded(true)}
                    poster="/video-placeholder.png" // Optional: Add a placeholder image
                >
                    <source
                        src={videoUrl}
                        type="video/mp4"
                    />
                </video>
                <div className="absolute inset-0 bg-black/10"></div> {/* Overlay to darken the video */}
            </div>
        </>
    );
}