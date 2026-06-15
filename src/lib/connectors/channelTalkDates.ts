type ChannelTalkDateFields = {
  state?: string;
  closedAt?: number | string;
};

export function channelTalkProcessedAt(chat: ChannelTalkDateFields) {
  if (chat.state !== "closed" || chat.closedAt === undefined) return null;
  const value =
    typeof chat.closedAt === "string" && /^\d+$/.test(chat.closedAt)
      ? Number(chat.closedAt)
      : chat.closedAt;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
