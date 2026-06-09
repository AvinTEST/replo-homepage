export class ConnectorError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "unauthorized"
      | "forbidden"
      | "rate_limited"
      | "upstream"
      | "invalid_response",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ConnectorError";
  }
}
