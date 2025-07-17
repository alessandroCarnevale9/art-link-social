import { useEffect, useRef } from "react";

const AuthVideo = ({ videoSrc }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(console.error);
    }
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        className="auth-video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className="video-overlay"></div>
    </>
  );
};

export default AuthVideo;
