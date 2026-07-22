/**
 * Fixed site-wide meadow backdrop so every page/section sits over the same image.
 */
export function SiteBackdrop() {
  return (
    <div className="site-backdrop" aria-hidden="true">
      <div className="site-backdrop__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero.jpg"
          alt=""
          className="site-backdrop__image"
          fetchPriority="high"
        />
      </div>
      <div className="site-backdrop__scrim" />
      <div className="site-backdrop__vignette" />
      <div className="site-backdrop__grain" />
    </div>
  );
}
