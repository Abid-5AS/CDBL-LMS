import { redirect } from "next/navigation";

export default function LegacyMyLeavesRedirect() {
  redirect("/leaves");
}
