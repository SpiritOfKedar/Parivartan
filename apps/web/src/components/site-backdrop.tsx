/**
 * Fixed site-wide meadow backdrop — landscape image, light scrim only.
 */
export function SiteBackdrop() {
  return (
    <div className="site-backdrop" aria-hidden="true">
      <div className="site-backdrop__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/meadow.jpg"
          alt=""
          className="site-backdrop__image"
          width={1024}
          height={630}
          fetchPriority="high"
        />
      </div>
      <div className="site-backdrop__scrim" />
      <div className="site-backdrop__grain" />
    </div>
  );
}
