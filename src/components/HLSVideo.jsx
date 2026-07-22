import React, { useEffect, useRef } from 'react';

export default function HLSVideo(props) {
    const { src, vidRef } = props;
    const localRef = useRef(null);
    const ref = vidRef || localRef;
    const isHls = src && src.indexOf(".m3u8") !== -1;
    useEffect(() => {
        const video = ref.current;
        if (!video || !src) return;
        if (!isHls) { video.src = src; return; }
        // Native HLS (Safari / iOS)
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
            return;
        }
        // hls.js for Chrome/Firefox/etc — load lazily from CDN
        const setup = () => {
            if (window.Hls && window.Hls.isSupported()) {
                const hls = new window.Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
                video._hls = hls;
            } else {
                video.src = src; // last resort
            }
        };
        if (window.Hls) { setup(); }
        else {
            const existing = document.getElementById("hlsjs-cdn");
            if (existing) { existing.addEventListener("load", setup); }
            else {
                const s = document.createElement("script");
                s.id = "hlsjs-cdn";
                s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js";
                s.onload = setup;
                document.head.appendChild(s);
            }
        }
        return () => { if (video && video._hls) { try { video._hls.destroy(); } catch (e) {} video._hls = null; } };
    }, [src, isHls]);
    const passProps = Object.assign({}, props);
    delete passProps.src; delete passProps.vidRef;
    return React.createElement("video", Object.assign({ ref: ref }, passProps));
}
