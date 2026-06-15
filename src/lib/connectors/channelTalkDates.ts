type ChannelTalkDateFields = {
  state?: string;
  createdAt?: number | string;
  openedAt?: number | string;
  closedAt?: number | string;
};

function timestamp(value: number | string | undefined) {
  if (value === undefined) return null;
  const normalized =
    typeof value === "string" && /^\d+$/.test(value)
      ? Number(value)
      : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function channelTalkProcessedAt(chat: ChannelTalkDateFields) {
  return chat.state === "closed" ? timestamp(chat.closedAt) : null;
}

export function channelTalkMissedCallAt(chat: ChannelTalkDateFields) {
  return chat.state === "opened" || chat.state === "snoozed"
    ? timestamp(chat.openedAt ?? chat.createdAt)
    : null;
}
