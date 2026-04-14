import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const submitted = (body as { password?: unknown }).password;
  const correct = process.env.ACCESS_PASSWORD;

  if (!correct) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (typeof submitted !== "string" || submitted !== correct) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("site_access", "granted", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
