export default function BackgroundVideo() {
    return (
        <div className="fixed inset-0 z-0">
            <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute w-full h-full object-cover opacity-80"
            >
                <source src="/bgfinal.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/10"></div> {/* Overlay to darken the video */}
        </div>
    );
}