import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { AdminDashboardClient } from "./admin-dashboard-client";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const session = verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  return <AdminDashboardClient username={session.sub} />;
}
