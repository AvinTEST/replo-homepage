"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import {
  buildResponsiveCallChartSeries,
  buildResponsiveChartSeries,
} from "@/lib/dashboard/chartSeries";
import { createCsv } from "@/lib/dashboard/csv";
import type { DashboardResponse, Grain } from "@/types/dashboard";

const number = new Intl.NumberFormat("ko-KR");

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = createCsv(rows);
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function LineChart({
  items,
  start,
  end,
  color = "#5B47E0",
  valueLabel = "처리 건수",
  onGrainChange,
}: {
  items: Array<{ key: string; value: number }>;
  start: string;
  end: string;
  color?: string;
  valueLabel?: string;
  onGrainChange?: (grain: Grain) => void;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const updateWidth = () => setWidth(Math.max(280, Math.round(element.clientWidth)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const maxPoints = Math.max(2, Math.floor((width - 36) / 28) + 1);
  const series = useMemo(
    () => buildResponsiveChartSeries(items, start, end, maxPoints),
    [end, items, maxPoints, start],
  );
  useEffect(() => {
    onGrainChange?.(series.grain);
  }, [onGrainChange, series.grain]);
  const values = series.points.map((point) => point.value);
  const labels = series.points.map((point) => point.label);
  const height = Math.max(160, Math.min(220, Math.round(width * 0.3)));
  const chartTop = 24;
  const chartBottom = height - 34;
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => ({
    x: values.length === 1 ? width / 2 : (index / Math.max(1, values.length - 1)) * (width - 36) + 18,
    y: chartBottom - (value / max) * (chartBottom - chartTop),
  }));
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const activePoint = activeIndex === null ? null : points[activeIndex];
  const labelCapacity = Math.max(2, Math.floor(width / 88));
  const labelStep = Math.max(1, Math.ceil(labels.length / labelCapacity));
  const shouldShowLabel = (index: number) =>
    index === 0 || index === labels.length - 1 || index % labelStep === 0;
  const tooltipTransform =
    activeIndex === 0
      ? "translate(0, -115%)"
      : activeIndex === points.length - 1
        ? "translate(-100%, -115%)"
        : "translate(-50%, -115%)";

  return (
    <div
      ref={wrapRef}
      className="chart-svg-wrap"
      style={{ height }}
      data-grain={series.grain}
    >
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="처리 건수 추이">
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="18"
            x2={width - 18}
            y1={chartBottom - ratio * (chartBottom - chartTop)}
            y2={chartBottom - ratio * (chartBottom - chartTop)}
            stroke="#e8ebf1"
          />
        ))}
        {points.map((point, index) => (
          <line
            key={`guide-${labels[index]}-${point.x}`}
            className={activeIndex === index ? "chart-guide active" : "chart-guide"}
            x1={point.x}
            x2={point.x}
            y1={chartTop}
            y2={chartBottom}
          />
        ))}
        <path d={`${path} L${points.at(-1)?.x ?? 0},${chartBottom} L18,${chartBottom} Z`} fill={`${color}12`} />
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g
            key={`${point.x}-${point.y}`}
            tabIndex={0}
            role="button"
            aria-label={`${labels[index]}, ${valueLabel} ${number.format(values[index])}건`}
            onPointerEnter={() => setActiveIndex(index)}
            onPointerLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onClick={() => setActiveIndex((current) => current === index ? null : index)}
          >
            <circle cx={point.x} cy={point.y} r="12" fill="transparent" />
            <circle cx={point.x} cy={point.y} r={activeIndex === index ? 5 : 3.5} fill="#fff" stroke={color} strokeWidth="2" />
          </g>
        ))}
        {points.map((point, index) => shouldShowLabel(index) ? (
          <text
            key={`label-${labels[index]}-${point.x}`}
            className="chart-date-label"
            x={point.x}
            y={height - 8}
            textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
          >
            {labels[index]}
          </text>
        ) : null)}
      </svg>
      {activePoint && activeIndex !== null ? (
        <div
          className="chart-tooltip"
          role="status"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.y / height) * 100}%`,
            transform: tooltipTransform,
          }}
        >
          <span>{labels[activeIndex]}</span>
          <strong>{valueLabel} {number.format(values[activeIndex])}건</strong>
        </div>
      ) : null}
    </div>
  );
}

function BarChart({
  rows,
  labelKey,
  onSelect,
}: {
  rows: Array<Record<string, string | number>>;
  labelKey: string;
  onSelect?: (value: string) => void;
}) {
  const max = Math.max(...rows.map((row) => Number(row.count)), 1);
  return (
    <div className="bar-chart">
      {rows.slice(0, 8).map((row) => (
        <button
          type="button"
          className="bar-row"
          key={String(row[labelKey])}
          onClick={() => onSelect?.(String(row[labelKey]))}
          disabled={!onSelect}
        >
          <span className="bar-name">{String(row[labelKey])}</span>
          <span className="bar-track">
            <span style={{ width: `${(Number(row.count) / max) * 100}%` }} />
          </span>
          <strong>{number.format(Number(row.count))}</strong>
        </button>
      ))}
    </div>
  );
}

function CallMixedChart({
  items,
  start,
  end,
}: {
  items: Array<{ key: string; total: number; answered: number }>;
  start: string;
  end: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const updateWidth = () => setWidth(Math.max(280, Math.round(element.clientWidth)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const maxPoints = Math.max(2, Math.floor((width - 36) / 36));
  const series = useMemo(
    () => buildResponsiveCallChartSeries(items, start, end, maxPoints),
    [end, items, maxPoints, start],
  );
  const height = Math.max(160, Math.min(220, Math.round(width * 0.3)));
  const chartTop = 24;
  const chartBottom = height - 34;
  const chartHeight = chartBottom - chartTop;
  const maxCount = Math.max(...series.points.map((point) => point.total + point.answered), 1);
  const slotWidth = (width - 36) / Math.max(series.points.length, 1);
  const barWidth = Math.max(8, Math.min(28, slotWidth * 0.58));
  const labelCapacity = Math.max(2, Math.floor(width / 88));
  const labelStep = Math.max(1, Math.ceil(series.points.length / labelCapacity));
  const shouldShowLabel = (index: number) =>
    index === 0 || index === series.points.length - 1 || index % labelStep === 0;
  const points = series.points.map((point, index) => ({
    x: 18 + slotWidth * index + slotWidth / 2,
    y: chartBottom - (point.rate / 100) * chartHeight,
  }));
  const ratePath = points
    .map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`)
    .join(" ");
  const activePoint = activeIndex === null ? null : points[activeIndex];
  const activeValue = activeIndex === null ? null : series.points[activeIndex];
  const tooltipTransform =
    activeIndex === 0
      ? "translate(0, -110%)"
      : activeIndex === points.length - 1
        ? "translate(-100%, -110%)"
        : "translate(-50%, -110%)";

  return (
    <div ref={wrapRef} className="chart-svg-wrap call-mixed-chart" style={{ height }}>
      <div className="call-chart-legend" aria-hidden="true">
        <span className="inbound">인입 건</span>
        <span className="answered">응대 건</span>
        <span className="rate">응대율</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="콜 인입, 응대, 응대율 추이">
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="18"
            x2={width - 18}
            y1={chartBottom - ratio * chartHeight}
            y2={chartBottom - ratio * chartHeight}
            stroke="#e8ebf1"
          />
        ))}
        {series.points.map((point, index) => {
          const x = points[index].x - barWidth / 2;
          const inboundHeight = (point.total / maxCount) * chartHeight;
          const answeredHeight = (point.answered / maxCount) * chartHeight;
          return (
            <g key={`bars-${point.key}`}>
              <rect
                x={x}
                y={chartBottom - inboundHeight}
                width={barWidth}
                height={inboundHeight}
                rx="3"
                fill="#c7d2fe"
              />
              <rect
                x={x}
                y={chartBottom - inboundHeight - answeredHeight}
                width={barWidth}
                height={answeredHeight}
                rx="3"
                fill="#5b47e0"
              />
            </g>
          );
        })}
        <path
          d={ratePath}
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <g
            key={`call-point-${series.points[index].key}`}
            tabIndex={0}
            role="button"
            aria-label={`${series.points[index].label}, 인입 ${number.format(series.points[index].total)}건, 응대 ${number.format(series.points[index].answered)}건, 응대율 ${series.points[index].rate.toFixed(1)}%`}
            onPointerEnter={() => setActiveIndex(index)}
            onPointerLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onClick={() => setActiveIndex((current) => current === index ? null : index)}
          >
            <rect
              x={point.x - slotWidth / 2}
              y={chartTop}
              width={slotWidth}
              height={chartHeight}
              fill="transparent"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={activeIndex === index ? 5 : 3.5}
              fill="#fff"
              stroke="#0284c7"
              strokeWidth="2"
            />
          </g>
        ))}
        {series.points.map((point, index) => shouldShowLabel(index) ? (
          <text
            key={`call-label-${point.key}`}
            className="chart-date-label"
            x={points[index].x}
            y={height - 8}
            textAnchor={index === 0 ? "start" : index === series.points.length - 1 ? "end" : "middle"}
          >
            {point.label}
          </text>
        ) : null)}
      </svg>
      {activePoint && activeValue ? (
        <div
          className="chart-tooltip"
          role="status"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.y / height) * 100}%`,
            transform: tooltipTransform,
          }}
        >
          <span>{activeValue.label}</span>
          <strong>인입 {number.format(activeValue.total)}건</strong>
          <strong>응대 {number.format(activeValue.answered)}건</strong>
          <strong>응대율 {activeValue.rate.toFixed(1)}%</strong>
        </div>
      ) : null}
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="dashboard-section-head">
      <h2>{title}</h2>
      <span />
      <p>{sub}</p>
    </div>
  );
}

export function OperationDashboard({
  tenantId,
  initialData,
  canManage,
}: {
  tenantId: string;
  initialData: DashboardResponse;
  canManage: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [grain, setGrain] = useState<Grain>(initialData.range.grain);
  const [start, setStart] = useState(initialData.range.start);
  const [end, setEnd] = useState(initialData.range.end);
  const [channel, setChannel] = useState("");
  const [task, setTask] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [compareMode, setCompareMode] = useState<"line" | "bar">("line");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboard = async (overrides?: { channel?: string; task?: string }) => {
    const nextChannel = overrides?.channel ?? channel;
    const nextTask = overrides?.task ?? task;
    const query = new URLSearchParams({ start, end });
    if (nextChannel) query.set("channel", nextChannel);
    if (nextTask) query.set("task", nextTask);
    setError("");
    const response = await fetch(`/api/tenants/${tenantId}/dashboard?${query}`);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "데이터를 불러오지 못했습니다.");
      return;
    }
    const nextData = body as DashboardResponse;
    setData(nextData);
    setGrain(nextData.range.grain);
  };

  const refresh = async (overrides?: { channel?: string; task?: string }) => {
    setIsLoading(true);
    try {
      await fetchDashboard(overrides);
    } finally {
      setIsLoading(false);
    }
  };

  const setChannelFilter = (value: string) => {
    setChannel(value);
    setTask("");
    refresh({ channel: value, task: "" });
  };
  const clearFilters = () => {
    setChannel("");
    setTask("");
    refresh({ channel: "", task: "" });
  };
  const sync = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tenants/${tenantId}/sync/all`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "동기화에 실패했습니다.");
        return;
      }
      await fetchDashboard();
    } finally {
      setIsLoading(false);
    }
  };

  const compare = useMemo(() => {
    const midpoint = Math.ceil(data.charts.trend.length / 2);
    const a = data.charts.trend.slice(0, midpoint);
    const b = data.charts.trend.slice(midpoint);
    const totalA = a.reduce((sum, item) => sum + item.count, 0);
    const totalB = b.reduce((sum, item) => sum + item.count, 0);
    return { a, b, totalA, totalB, diff: totalB - totalA };
  }, [data.charts.trend]);

  const usage = Math.min(100, Math.max(0, data.planUsage.usageRate));
  return (
    <PortalShell
      tenantId={tenantId}
      tenantName={data.tenant.name}
      planName={data.tenant.planName}
      active="dashboard"
      sidebar={
        <>
        <div className="sidebar-group">
          <h2>데이터 연동</h2>
          <div className="sync-status">
            <i className={data.sync.status} />
            <span>{isLoading ? "데이터 갱신 중..." : data.sync.message}</span>
          </div>
          <button type="button" className="secondary-button full" onClick={sync} disabled={isLoading || !canManage}>
            새로고침
          </button>
        </div>
        <div className="sidebar-group">
          <h2>기간 필터</h2>
          <div className="automatic-grain">
            <span>자동 집계</span>
            <strong>{grain === "day" ? "일 단위" : grain === "week" ? "주 단위" : "월 단위"}</strong>
          </div>
          <label>시작일</label>
          <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
          <label>종료일</label>
          <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
          <button type="button" className="primary-button full" onClick={() => refresh()} disabled={isLoading}>기간 적용</button>
        </div>
        <div className="sidebar-group">
          <h2>채널 필터</h2>
          <label>판매채널</label>
          <select value={channel} onChange={(event) => setChannelFilter(event.target.value)}>
            <option value="">전체 채널</option>
            {initialData.filters.channels.map((item) => <option key={item}>{item}</option>)}
          </select>
          <label>세부업무</label>
          <select
            value={task}
            onChange={(event) => {
              setTask(event.target.value);
              refresh({ task: event.target.value });
            }}
          >
            <option value="">전체 업무</option>
            {initialData.filters.tasks.map((item) => <option key={item}>{item}</option>)}
          </select>
          {channel || task ? (
            <div className="filter-chips">
              {channel ? <span>{channel}</span> : null}
              {task ? <span>{task}</span> : null}
              <button type="button" onClick={clearFilters}>초기화</button>
            </div>
          ) : null}
        </div>
        </>
      }
    >
        <div
          className={`dashboard-progress ${isLoading ? "visible" : ""}`}
          role="progressbar"
          aria-label="대시보드 데이터 불러오는 중"
          aria-hidden={!isLoading}
        >
          <span />
        </div>
        <header className="dashboard-page-header">
          <div>
            <p>OPERATIONS</p>
            <h1>운영 대시보드</h1>
            <span>{data.tenant.name}의 고객 운영 현황을 확인합니다.</span>
          </div>
          <div className="dashboard-badges">
            <span>{data.range.start} ~ {data.range.end}</span>
            <span>{grain === "day" ? "일간" : grain === "week" ? "주간" : "월간"}</span>
            <span>마지막 데이터: {data.range.lastDataDate ?? "없음"}</span>
            {channel ? <span className="active">채널: {channel}</span> : null}
          </div>
        </header>
        {error ? <div className="dashboard-error">{error}</div> : null}
        <section>
          <SectionHead title="월 플랜 사용량" sub="이번 달 차감 대상 항목 기준" />
          <div className="plan-grid">
            <article className="metric-card plan-main">
              <p className="plan-name">{data.tenant.planName}</p>
              <p className="metric-label">월 플랜 건수</p>
              <strong>{number.format(data.planUsage.planLimit)}</strong>
              <small>계약 기준</small>
            </article>
            <article className="metric-card">
              <div className="metric-actions">
                <p className="metric-label">이번 달 사용 건수</p>
                <button type="button" onClick={() => setDetailOpen((open) => !open)}>내역 {detailOpen ? "▲" : "▼"}</button>
              </div>
              <strong>{number.format(data.planUsage.monthlyUsed)}</strong>
              <small>사용률 {data.planUsage.usageRate.toFixed(1)}%</small>
              <div className="progress"><span style={{ width: `${usage}%` }} /></div>
            </article>
            <article className="metric-card">
              <p className="metric-label">이번 달 잔여 건수</p>
              <strong>{number.format(data.planUsage.remaining)}</strong>
              <small>잔여 {data.planUsage.remainingRate.toFixed(1)}%</small>
            </article>
            <div className="stacked-metrics">
              <article className="metric-card compact"><p className="metric-label">영업일 잔여</p><strong>{data.planUsage.businessDaysLeft}</strong><small>이번 달 평일 기준</small></article>
              <article className="metric-card compact"><p className="metric-label">일평균 필요 처리</p><strong>{number.format(data.planUsage.dailyNeed)}</strong><small>플랜 소진 기준</small></article>
            </div>
          </div>
          {detailOpen ? (
            <div className="usage-detail panel">
              <div className="panel-toolbar">
                <strong>차감 항목별 상세 내역</strong>
                <button type="button" className="secondary-button" onClick={() => downloadCsv("replo-plan-usage.csv", [["판매채널", "세부업무", "처리 건수", "비중"], ...data.planUsage.detailRows.map((row) => [row.channel, row.task, row.count, `${row.pct.toFixed(1)}%`])])}>CSV 다운로드</button>
              </div>
              <div className="table-scroll"><table><thead><tr><th>판매채널</th><th>세부업무</th><th>처리 건수</th><th>비중</th></tr></thead><tbody>{data.planUsage.detailRows.map((row) => <tr key={`${row.channel}-${row.task}`}><td>{row.channel}</td><td>{row.task}</td><td>{number.format(row.count)}</td><td>{row.pct.toFixed(1)}%</td></tr>)}</tbody></table></div>
            </div>
          ) : null}
        </section>

        <section>
          <SectionHead title="운영 현황" sub="선택 기간 기준" />
          <div className="kpi-grid">
            {[
              ["전체 처리 건수", number.format(data.operationKpis.total), "선택 기간 전체 합계"],
              ["활성 채널 수", data.operationKpis.activeChannels, "처리 건수 0 초과 채널"],
              ["최다 처리 채널", data.operationKpis.topChannel?.name ?? "-", `${number.format(data.operationKpis.topChannel?.count ?? 0)}건`],
              ["최다 세부업무", data.operationKpis.topTask?.name ?? "-", `${number.format(data.operationKpis.topTask?.count ?? 0)}건`],
              ["전일 대비", `${data.operationKpis.dayOverDay.diff > 0 ? "+" : ""}${number.format(data.operationKpis.dayOverDay.diff)}`, data.operationKpis.dayOverDay.diffPct === null ? "비교 데이터 없음" : `${data.operationKpis.dayOverDay.diffPct.toFixed(1)}%`],
            ].map(([label, value, meta]) => <article className="metric-card kpi" key={label}><p className="metric-label">{label}</p><strong>{value}</strong><small>{meta}</small></article>)}
          </div>
        </section>

        <section>
          <SectionHead title="전화 응대율" sub="선택 기간 영업일 기준" />
          <div className="call-grid">
            <div className="call-kpis">
              {[
                ["총 콜 인입", data.callKpis.totalCalls],
                ["응대한 콜", data.callKpis.answeredCalls],
                ["미응대 콜", data.callKpis.missedCalls],
                ["응대율", `${data.callKpis.answerRate.toFixed(1)}%`],
              ].map(([label, value]) => <article className="metric-card compact" key={label}><p className="metric-label">{label}</p><strong>{typeof value === "number" ? number.format(value) : value}</strong><small>채널톡 전화 기준</small></article>)}
            </div>
            <article className="panel chart-panel">
              <div className="chart-heading"><div><strong>콜 인입 · 응대 · 응대율 추이</strong><small>기간별 전화 응대 현황</small></div><span>혼합</span></div>
              <CallMixedChart
                items={data.charts.callTrend.map((item) => ({
                  key: item.key,
                  total: item.total,
                  answered: item.answered,
                }))}
                start={data.range.start}
                end={data.range.end}
              />
            </article>
          </div>
        </section>

        <section>
          <SectionHead title="처리 추이" sub={`${grain === "day" ? "일간" : grain === "week" ? "주간" : "월간"} 집계`} />
          <div className="charts-grid">
            <article className="panel chart-panel wide"><div className="chart-heading"><div><strong>처리 건수 추이</strong><small>영역에 맞춰 일·주·월 단위로 자동 표시</small></div><span>라인</span></div><LineChart items={data.charts.trend.map((item) => ({ key: item.key, value: item.count }))} start={data.range.start} end={data.range.end} onGrainChange={setGrain} /></article>
            <article className="panel chart-panel"><div className="chart-heading"><div><strong>채널별 처리 건수</strong><small>클릭하면 필터 적용</small></div><span>바</span></div><BarChart rows={data.charts.byChannel} labelKey="channel" onSelect={setChannelFilter} /></article>
            <article className="panel chart-panel"><div className="chart-heading"><div><strong>세부업무별 처리 건수</strong><small>상위 10개</small></div><span>바</span></div><BarChart rows={data.charts.byTask} labelKey="task" onSelect={(value) => { setTask(value); refresh({ task: value }); }} /></article>
          </div>
        </section>

        <section>
          <SectionHead title="기간 비교" sub="현재 선택 기간을 앞·뒤 구간으로 비교" />
          <article className="panel compare-panel">
            <div className="compare-presets"><button type="button" className="active">선택 기간 비교</button><button type="button" onClick={() => setCompareMode("line")} className={compareMode === "line" ? "active" : ""}>라인</button><button type="button" onClick={() => setCompareMode("bar")} className={compareMode === "bar" ? "active" : ""}>막대</button></div>
            <div className="compare-summary">
              <div><span>기간 A</span><strong>{number.format(compare.totalA)}</strong><small>앞 구간 합계</small></div>
              <div className="blue"><span>기간 B</span><strong>{number.format(compare.totalB)}</strong><small>뒤 구간 합계</small></div>
              <div className="amber"><span>증감 (B - A)</span><strong>{compare.diff > 0 ? "+" : ""}{number.format(compare.diff)}</strong><small>{compare.totalA ? `${((compare.diff / compare.totalA) * 100).toFixed(1)}%` : "비교 불가"}</small></div>
            </div>
            {compareMode === "line" ? <LineChart items={[...compare.a, ...compare.b].map((item) => ({ key: item.key, value: item.count }))} start={data.range.start} end={data.range.end} /> : <BarChart rows={[{ period: "기간 A", count: compare.totalA }, { period: "기간 B", count: compare.totalB }]} labelKey="period" />}
          </article>
        </section>

        <section className="panel table-panel">
          <div className="panel-toolbar"><div><strong>상세 테이블</strong><small>기준일 / 판매채널 / 세부업무 / 처리 건수</small></div><button type="button" className="secondary-button" onClick={() => downloadCsv("replo-operation-detail.csv", [["기준일", "판매채널", "세부업무", "처리 건수", "메모"], ...data.table.map((row) => [row.date, row.channel, row.task, row.count, row.memo ?? ""])])}>CSV 다운로드</button></div>
          <div className="table-scroll"><table><thead><tr><th>기준일</th><th>판매채널</th><th>세부업무</th><th>처리 건수</th><th>메모</th></tr></thead><tbody>{data.table.map((row, index) => <tr key={`${row.date}-${row.channel}-${row.task}-${index}`}><td>{row.date}</td><td><span className="channel-tag">{row.channel}</span></td><td>{row.task}</td><td>{number.format(row.count)}</td><td>{row.memo}</td></tr>)}</tbody><tfoot><tr><td colSpan={3}>합계</td><td>{number.format(data.operationKpis.total)}</td><td /></tr></tfoot></table></div>
        </section>
        <footer>{data.tenant.name} 운영팀 전용 · Powered by Replo</footer>
    </PortalShell>
  );
}
