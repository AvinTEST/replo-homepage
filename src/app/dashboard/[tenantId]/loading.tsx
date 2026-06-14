export default function DashboardLoading() {
  return (
    <div className="ops-dashboard portal-route-loading" aria-busy="true" aria-live="polite">
      <div className="portal-loading-rail" aria-hidden="true">
        <span className="loading-logo">R<sup>+</sup></span>
        <div className="loading-rail-items">
          {Array.from({ length: 4 }, (_, index) => <i key={index} />)}
        </div>
      </div>
      <aside className="dashboard-sidebar">
        <div className="sidebar-workspace">
          <span>WORKSPACE</span>
          <div className="loading-line wide" />
          <div className="loading-line short" />
        </div>
        <div className="sidebar-navigation">
          <p>운영</p>
          {Array.from({ length: 4 }, (_, index) => <div className="loading-nav" key={index} />)}
        </div>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-progress visible" role="progressbar" aria-label="운영 데이터 불러오는 중">
          <span />
        </div>
        <header className="dashboard-page-header">
          <div>
            <p>REPLO WORKSPACE</p>
            <h1>운영 데이터를 불러오고 있습니다</h1>
            <span>연동된 채널과 리포트 정보를 확인하는 중입니다.</span>
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
