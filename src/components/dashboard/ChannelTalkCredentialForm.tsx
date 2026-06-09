"use client";

import { FormEvent, useState, useTransition } from "react";

export function ChannelTalkCredentialForm({
  tenantId,
  configured,
}: {
  tenantId: string;
  configured: boolean;
}) {
  const [accessKey, setAccessKey] = useState("");
  const [accessSecret, setAccessSecret] = useState("");
  const [message, setMessage] = useState(
    configured ? "저장된 credential이 있습니다. 새 값 저장 시 기존 값이 교체됩니다." : "",
  );
  const [isPending, startTransition] = useTransition();

  const call = (path: string) =>
    startTransition(async () => {
      setMessage("");
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessKey, accessSecret }),
      });
      const body = await response.json();
      setMessage(body.message ?? body.error ?? (body.ok ? "연결이 확인되었습니다." : "요청에 실패했습니다."));
    });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    call(`/api/tenants/${tenantId}/integrations/channel-talk`);
  };

  return (
    <form className="credential-form" onSubmit={submit}>
      <strong>{configured ? "연동 정보 교체" : "연동 정보 등록"}</strong>
      <label htmlFor="channel-access-key">Access Key</label>
      <input
        id="channel-access-key"
        value={accessKey}
        onChange={(event) => setAccessKey(event.target.value)}
        autoComplete="off"
        required
      />
      <label htmlFor="channel-access-secret">Access Secret</label>
      <input
        id="channel-access-secret"
        type="password"
        value={accessSecret}
        onChange={(event) => setAccessSecret(event.target.value)}
        autoComplete="new-password"
        required
      />
      <div className="credential-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={isPending || !accessKey || !accessSecret}
          onClick={() => call(`/api/tenants/${tenantId}/integrations/channel-talk/test`)}
        >
          연결 테스트
        </button>
        <button className="primary-button" disabled={isPending}>
          테스트 후 안전하게 저장
        </button>
      </div>
      {message ? <div className="form-message" role="status">{message}</div> : null}
    </form>
  );
}
