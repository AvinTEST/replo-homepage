/**
 * Skeleton shown while a portal route resolves its server data. Reuses the
 * loading classes defined in dashboard.css (rail, sidebar, progress bar, card
 * grid), so it is only used inside the /dashboard layout where that stylesheet
 * is loaded.
 */
export function PortalRouteLoading({
  title = "데이터를 불러오고 있습니다",
  subtitle = "운영 정보를 확인하는 중입니다.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="ops-dashboard portal-route-loading" aria-busy="true" aria-live="polite">
      <div className="portal-loading-rail" aria-hidden="true">
        <span className="loading-logo">R<sup>+</sup></span>
        <div className="loading-rail-items">
          {Array.from({ length: 4 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      </div>
      <aside className="dashboard-sidebar">
        <div className="sidebar-workspace">
          <span>WORKSPACE</span>
          <div className="loading-line wide" />
          <div className="loading-line short" />
        </div>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-progress visible" role="progressbar" aria-label={title}>
          <span />
        </div>
        <header className="dashboard-page-header">
          <div>
            <p>REPLO WORKSPACE</p>
            <h1>{title}</h1>
            <span>{subtitle}</span>
          </div>
        </header>
        <div className="loading-card-grid" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="loading-card" key={index}>
              <div className="loading-line short" />
              <div className="loading-line wide" />
              <div className="loading-line medium" />
            </div>
          ))}
        </div>
        <div className="loading-panel" aria-hidden="true">
          <div className="loading-line medium" />
          <div className="loading-chart" />
        </div>
      </main>
    </div>
  );
}
