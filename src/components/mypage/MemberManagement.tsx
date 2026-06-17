"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Role = "owner" | "admin" | "editor" | "viewer";
type Member = {
  id: string;
  role: Role;
  status: string;
  last_seen_at: string | null;
  name: string;
  email: string;
  isCurrentUser: boolean;
};
type Invite = {
  id: string;
  email: string;
  role: Exclude<Role, "owner">;
  status: string;
  expires_at: string;
};

const roleLabels: Record<Role, string> = {
  owner: "소유자",
  admin: "관리자",
  editor: "편집자",
  viewer: "뷰어",
};

export function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [currentRole, setCurrentRole] = useState<Role>("viewer");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "owner">>("viewer");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const canManage = currentRole === "owner" || currentRole === "admin";

  const load = useCallback(async () => {
    const response = await fetch("/api/members", { cache: "no-store" });
    const result = (await response.json().catch(() => ({}))) as {
      role?: Role;
      members?: Member[];
      invites?: Invite[];
      error?: string;
    };
    if (!response.ok) {
      setMessage(result.error || "멤버 목록을 불러오지 못했습니다.");
    } else {
      setCurrentRole(result.role ?? "viewer");
      setMembers(result.members ?? []);
      setInvites(result.invites ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/members/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    setMessage(result.message || result.error || "");
    if (response.ok) {
      setEmail("");
      await load();
    }
  }

  async function updateRole(id: string, nextRole: Role) {
    const response = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(response.ok ? "멤버 역할을 변경했습니다." : result.error || "변경에 실패했습니다.");
    if (response.ok) await load();
  }

  async function deleteMember(id: string) {
    if (!window.confirm("이 멤버를 고객사 워크스페이스에서 삭제할까요?")) return;
    const response = await fetch(`/api/members/${id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(response.ok ? "멤버를 삭제했습니다." : result.error || "삭제에 실패했습니다.");
    if (response.ok) await load();
  }

  return (
    <section id="members" className="mt-5 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B47E0]">Members</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">멤버 관리</h2>
          <p className="mt-2 text-sm text-slate-500">고객사 구성원과 역할을 관리합니다.</p>
        </div>
        <span className="rounded-full bg-[#F2EFFF] px-3 py-1 text-xs font-bold text-[#5B47E0]">
          내 역할: {roleLabels[currentRole]}
        </span>
      </div>

      {canManage ? (
        <form onSubmit={inviteMember} className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_160px_auto]">
          <label className="text-sm font-semibold text-slate-700">
            새 멤버 이메일
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#5B47E0]"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            역할
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Exclude<Role, "owner">)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#5B47E0]"
            >
              {currentRole === "owner" ? <option value="admin">관리자</option> : null}
              <option value="editor">편집자</option>
              <option value="viewer">뷰어</option>
            </select>
          </label>
          <button type="submit" className="self-end rounded-xl bg-[#5B47E0] px-5 py-3 font-bold text-white">
            새 멤버 초대하기
          </button>
        </form>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl bg-[#F7F6FF] px-4 py-3 text-sm text-[#4935C8]" role="status">
          {message}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-3">이름</th>
              <th className="px-3 py-3">이메일</th>
              <th className="px-3 py-3">역할</th>
              <th className="px-3 py-3">최근 접속</th>
              <th className="px-3 py-3">초대 상태</th>
              <th className="px-3 py-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-6 text-slate-500">멤버를 불러오는 중입니다.</td></tr>
            ) : null}
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-3 py-4 font-semibold">{member.name}{member.isCurrentUser ? " (나)" : ""}</td>
                <td className="px-3 py-4 text-slate-600">{member.email}</td>
                <td className="px-3 py-4">
                  {canManage && !member.isCurrentUser ? (
                    <select
                      value={member.role}
                      onChange={(event) => void updateRole(member.id, event.target.value as Role)}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-2"
                    >
                      {currentRole === "owner" ? <option value="owner">소유자</option> : null}
                      {currentRole === "owner" ? <option value="admin">관리자</option> : null}
                      <option value="editor">편집자</option>
                      <option value="viewer">뷰어</option>
                    </select>
                  ) : roleLabels[member.role]}
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {member.last_seen_at ? new Date(member.last_seen_at).toLocaleString("ko-KR") : "접속 기록 없음"}
                </td>
                <td className="px-3 py-4">가입 완료</td>
                <td className="px-3 py-4">
                  {canManage && !member.isCurrentUser ? (
                    <button type="button" onClick={() => void deleteMember(member.id)} className="font-semibold text-rose-600">
                      삭제
                    </button>
                  ) : "-"}
                </td>
              </tr>
            ))}
            {invites.map((invite) => (
              <tr key={invite.id} className="bg-slate-50/70">
                <td className="px-3 py-4 text-slate-500">초대 대기</td>
                <td className="px-3 py-4">{invite.email}</td>
                <td className="px-3 py-4">{roleLabels[invite.role]}</td>
                <td className="px-3 py-4 text-slate-500">-</td>
                <td className="px-3 py-4 text-amber-700">초대 중</td>
                <td className="px-3 py-4 text-xs text-slate-500">
                  {new Date(invite.expires_at).toLocaleDateString("ko-KR")} 만료
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
