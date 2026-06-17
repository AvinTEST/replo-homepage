import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const target = new URL("/", request.url);
  target.searchParams.set("login", "1");

  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    target.searchParams.set("error", error);
  }

  return NextResponse.redirect(target);
}
