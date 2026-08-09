import { isAdminEmail } from "@/app/lib/admin";
import { authOptions } from "@/app/lib/auth";
import { markOrderShipped } from "@/app/lib/orders";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return null;
  }
  return session;
}

type Params = { sessionId: string };

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  let body: {
    trackingNumber?: unknown;
    carrier?: unknown;
    sendEmail?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const trackingNumber =
    typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";
  if (!trackingNumber) {
    return NextResponse.json(
      { error: "Tracking number is required" },
      { status: 400 }
    );
  }

  const carrier =
    typeof body.carrier === "string" && body.carrier.trim()
      ? body.carrier.trim()
      : null;
  const sendEmail = body.sendEmail !== false;

  try {
    const order = await markOrderShipped({
      sessionId,
      trackingNumber,
      carrier,
      sendEmail,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      stripeSessionId: order.stripeSessionId,
      status: order.status,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      shippedAt: order.shippedAt,
      emailSent: sendEmail && !!order.customerEmail,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
