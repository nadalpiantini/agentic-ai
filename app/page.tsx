import { redirect } from "next/navigation";

export default function HomePage() {
  // For now, redirect to dashboard
  // TODO: Add proper auth check and redirect to /login if not authenticated
  redirect("/chat");
}
