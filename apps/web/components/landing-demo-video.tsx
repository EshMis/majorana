type LandingDemoVideoProps = {
  label: string;
  describedById: string;
  poster: string;
  src: string;
  fallback: string;
};

/** Native controls keep playback intentional, keyboard accessible and motion safe. */
export function LandingDemoVideo({ label, describedById, poster, src, fallback }: LandingDemoVideoProps) {
  return (
    <video
      aria-describedby={describedById}
      aria-label={label}
      className="lq-landing-demo-video"
      controls
      muted
      playsInline
      poster={poster}
      preload="none"
    >
      <source src={src} type="video/mp4" />
      <a href={src}>{fallback}</a>
    </video>
  );
}
