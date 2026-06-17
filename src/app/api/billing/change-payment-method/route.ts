import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "현재 런칭 준비 중입니다. 정식 오픈 이후 제공됩니다." },
    { status: 404 },
  );
}
