import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const target = new URL("https://dev.replo.kr/login");
  target.search = request.nextUrl.search;

  return NextResponse.redirect(target);
}
