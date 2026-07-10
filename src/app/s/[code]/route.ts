import { NextRequest, NextResponse } from "next/server";
import { processRealScan } from "@/app/actions/scan";
import { getUserSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code;
  
  const session = await getUserSession();
  
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/app/login";
    url.searchParams.set("from", `/s/${code}`);
    return NextResponse.redirect(url);
  }

  const result = await processRealScan(session.userId, code);
  
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/app/wallet";
  
  if (result.ok) {
    redirectUrl.searchParams.set("scanned", "success");
    redirectUrl.searchParams.set("points", String(result.points));
    redirectUrl.searchParams.set("product", result.product?.name || "");
  } else {
    redirectUrl.searchParams.set("scanned", "error");
    redirectUrl.searchParams.set("reason", result.reason || "unknown");
  }
  
  return NextResponse.redirect(redirectUrl);
}
