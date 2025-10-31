import { NextResponse } from "next/server";
import { policy } from "@/lib/policy";

export const cache = "no-store";

export async function GET() {
  return NextResponse.json({ policy });
}
