import { ChatInterface } from "@/components/chat/ChatInterface";
import { ThreadSidebar } from "@/components/sidebar/ThreadSidebar";

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <ThreadSidebar />
      <main className="flex-1">
        <ChatInterface threadId={null} />
      </main>
    </div>
  );
}
