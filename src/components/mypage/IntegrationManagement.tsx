"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Role = "owner" | "admin" | "editor" | "viewer";
type Integration = {
  id: string;
  brand_name: string;
  channel_name: string | null;
  provider: string;
  access_key_masked: string | null;
  status: string;
  last_checked_at: string | null;
  last_synced_at: string | null;
};

const consentText =
  "채널톡 연동을 통해 상담 데이터, 고객명, 이메일, 전화번호, 채팅 내용, 주문 관련 정보가 Replo로 수집·분석될 수 있으며, 개인정보 처리 위탁이 필요하다는 내용을 확인했습니다.";

export function IntegrationManagement() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [role, setRole] = useState<Role>("viewer");
  const [activeCount, setActiveCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    brandName: "",
    channelName: "",
    accessKey: "",
    accessSecret: "",
    consent: false,
  });
  const canManage = role === "owner" || role === "admin";

  const load = useCallback(async () => {
    const response = await fetch("/api/integrations", { cache: "no-store" });
    const result = (await response.json().catch(() => ({}))) as {
      role?: Role;
      integrations?: Integration[];
      activeCount?: number;
      error?: string;
    };
    if (!response.ok) setMessage(result.error || "연동 목록을 불러오지 못했습니다.");
    else {
      setRole(result.role ?? "viewer");
      setIntegrations(result.integrations ?? []);
      setActiveCount(result.activeCount ?? 0);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm({ brandName: "", channelName: "", accessKey: "", accessSecret: "", consent: false });
    setEditingId(null);
    setShowForm(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const response = await fetch(
      editingId ? `/api/integrations/${editingId}` : "/api/integrations/channel-talk",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    setSubmitting(false);
    setMessage(result.message || (response.ok ? "연동 정보를 저장했습니다." : result.error || "저장에 실패했습니다."));
    if (response.ok) {
      resetForm();
      await load();
    }
  }

  function beginEdit(integration: Integration) {
    setEditingId(integration.id);
    setForm({
      brandName: integration.brand_name,
      channelName: integration.channel_name ?? "",
      accessKey: "",
      accessSecret: "",
      consent: true,
    });
    setShowForm(true);
  }

  async function testConnection(id: string) {
    setMessage("연결을 확인하고 있습니다.");
    const response = await fetch("/api/integrations/channel-talk/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ integrationId: id }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    setMessage(result.message || result.error || "연결 테스트를 완료했습니다.");
    if (response.ok) await load();
  }

  async function deleteIntegration(id: string) {
    if (!window.confirm("이 채널톡 연동을 삭제할까요?")) return;
    const response = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(response.ok ? "연동을 삭제했습니다." : result.error || "삭제에 실패했습니다.");
    if (response.ok) await load();
  }

  return (
    <section id="integrations" className="mt-5 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B47E0]">Integrations</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">연동 채널 관리</h2>
          <p className="mt-2 text-sm text-slate-500">브랜드별 채널톡 연결을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#F2EFFF] px-3 py-1 text-xs font-bold text-[#5B47E0]">
            {activeCount} / 10개 연결
          </span>
          {canManage ? (
            <button
              type="button"
              disabled={activeCount >= 10}
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="rounded-xl bg-[#5B47E0] px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
            >
              채널톡 추가하기
            </button>
          ) : null}
        </div>
      </div>

      {activeCount >= 10 ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          고객사 기준 최대 10개까지 연결할 수 있습니다.
        </p>
      ) : null}

      {showForm && canManage ? (
        <form onSubmit={save} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-bold">{editingId ? "채널톡 연동 수정" : "채널톡 연동 추가"}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["brandName", "브랜드명", "text"],
              ["channelName", "채널명", "text"],
              ["accessKey", editingId ? "새 Access Key (변경 시 입력)" : "Access Key", "password"],
              ["accessSecret", editingId ? "새 Access Secret (변경 시 입력)" : "Access Secret", "password"],
            ].map(([field, label, type]) => (
              <label key={field} className="text-sm font-semibold text-slate-700">
                {label}
                <input
                  type={type}
                  required={!editingId}
                  value={form[field as keyof typeof form] as string}
                  onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                  autoComplete="off"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#5B47E0]"
                />
              </label>
            ))}
          </div>
          {!editingId ? (
            <label className="mt-5 flex items-start gap-3 rounded-xl bg-white p-4 text-sm leading-6 text-slate-600">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))}
                className="mt-1 h-4 w-4 accent-[#5B47E0]"
              />
              <span>{consentText}</span>
            </label>
          ) : (
            <p className="mt-4 text-xs text-slate-500">
              저장된 Secret은 표시되지 않습니다. 인증 정보를 변경할 때만 새 Key와 Secret을 함께 입력하세요.
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={submitting || (!editingId && !form.consent)}
              className="rounded-xl bg-[#5B47E0] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300"
            >
              {submitting ? "저장 중..." : editingId ? "수정 저장" : "동의하고 연동"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold">
              취소
            </button>
          </div>
        </form>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl bg-[#F7F6FF] px-4 py-3 text-sm text-[#4935C8]" role="status">
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {integrations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
            아직 연결된 채널이 없습니다.
          </p>
        ) : null}
        {integrations.map((integration) => (
          <article key={integration.id} className="rounded-2xl border border-slate-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{integration.brand_name} · {integration.channel_name}</h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {integration.status === "connected" ? "연동 정상" : integration.status}
                  </span>
                </div>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                  <div><dt className="inline font-semibold">서비스 </dt><dd className="inline">채널톡</dd></div>
                  <div><dt className="inline font-semibold">API Key </dt><dd className="inline">{integration.access_key_masked || "마스킹 정보 없음"}</dd></div>
                  <div><dt className="inline font-semibold">최근 동기화 </dt><dd className="inline">{integration.last_synced_at ? new Date(integration.last_synced_at).toLocaleString("ko-KR") : "아직 없음"}</dd></div>
                </dl>
              </div>
              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void testConnection(integration.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">연결 테스트</button>
                  <button type="button" onClick={() => beginEdit(integration)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">수정</button>
                  <button type="button" onClick={() => void deleteIntegration(integration.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600">삭제</button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
