type ChannelTalkCallFields = {
  state?: string;
  firstAskedAt?: number | string;
  missedReason?: string;
};

export function channelTalkCallDirection(chat: ChannelTalkCallFields) {
  return chat.state === "missed" || chat.firstAskedAt != null
    ? "inbound"
    : "outbound";
}

export function channelTalkCallStatus(chat: ChannelTalkCallFields) {
  return chat.state === "missed" || Boolean(chat.missedReason)
    ? "missed"
    : "closed";
}
