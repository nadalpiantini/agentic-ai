import { redirect } from "next/navigation";

export default function ChatIndexPage() {
  // Redirect to dashboard - users should create/select a thread
  redirect("/");
}
