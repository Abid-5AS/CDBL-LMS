import { cookies } from "next/headers";
import { verifyAuthJWT, AUTH_COOKIE } from "@/lib/auth-jwt";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/user";

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const claims = await verifyAuthJWT(token);
    await dbConnect();
    const doc = await User.findById(claims.uid).lean();
    if (!doc) return null;
    return { id: String(doc._id), name: doc.name, email: doc.email, role: doc.role as string };
  } catch {
    return null;
  }
}
