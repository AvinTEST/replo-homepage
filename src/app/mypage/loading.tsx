import "./mypage.css";

export default function MypageLoading() {
  return (
    <div className="mypage-shell" aria-busy="true" aria-live="polite">
      <div className="mypage-skel-rail" aria-hidden="true" />
      <aside className="mypage-menu" aria-hidden="true">
        <div className="mypage-menu-head">
          <div className="mypage-skel-line" style={{ width: 140, height: 24 }} />
        </div>
        <div className="mypage-menu-list">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="mypage-skel-line" style={{ height: 46, marginBottom: 6 }} />
          ))}
        </div>
      </aside>
      <div className="mypage-content">
        <div className="mypage-progress" role="progressbar" aria-label="마이페이지 정보를 불러오는 중">
          <span />
        </div>
        <div className="mypage-title">
          <div className="mypage-skel-line" style={{ width: 90, height: 12 }} />
          <div className="mypage-skel-line" style={{ width: 220, height: 30, marginTop: 12 }} />
          <div className="mypage-skel-line" style={{ width: 320, height: 14, marginTop: 12 }} />
        </div>
        <div className="mypage-card" aria-hidden="true">
          <div className="mypage-skel-line" style={{ width: 180, height: 18 }} />
          <div className="mypage-form-grid" style={{ paddingTop: 24 }}>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index}>
                <div className="mypage-skel-line" style={{ width: 80, height: 11, marginBottom: 7 }} />
                <div className="mypage-skel-line" style={{ width: "100%", height: 43 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
