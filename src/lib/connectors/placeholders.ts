import type { ConnectorDefinition } from "@/lib/connectors/types";

export const connectorDefinitions: ConnectorDefinition[] = [
  {
    provider: "channel_talk",
    displayName: "채널톡",
    availability: "available",
    credentialFields: [
      { key: "accessKey", label: "Access Key" },
      { key: "accessSecret", label: "Access Secret", secret: true },
    ],
  },
  {
    provider: "naver_commerce",
    displayName: "네이버 커머스",
    availability: "planned",
    credentialFields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client Secret", secret: true },
    ],
  },
  {
    provider: "coupang",
    displayName: "쿠팡",
    availability: "planned",
    credentialFields: [
      { key: "vendorId", label: "Vendor ID" },
      { key: "accessKey", label: "Access Key" },
      { key: "secretKey", label: "Secret Key", secret: true },
    ],
  },
  {
    provider: "kakao_channel",
    displayName: "카카오톡 채널",
    availability: "planned",
    credentialFields: [{ key: "adminKey", label: "Admin Key", secret: true }],
  },
  {
    provider: "cafe24",
    displayName: "카페24",
    availability: "planned",
    credentialFields: [
      { key: "mallId", label: "Mall ID" },
      { key: "refreshToken", label: "Refresh Token", secret: true },
    ],
  },
];

// TODO: 각 provider 공식 문의/주문 API 검증 후 Connector 구현을 교체한다.
