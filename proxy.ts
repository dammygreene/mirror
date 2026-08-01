import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const ref = request.nextUrl.searchParams.get("ref");

  if (ref && /^[a-z0-9-]{3,32}$/i.test(ref)) {
    response.cookies.set("mirror_ref", ref, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf)$).*)"],
};
