"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";

interface MobileSidebarProps {
  userId: string;
  activeThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: (threadId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({
  open,
  onOpenChange,
  ...sidebarProps
}: MobileSidebarProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button
          className="fixed left-3 top-3 z-50 rounded-lg bg-zinc-800/90 p-2 text-zinc-300 backdrop-blur-sm hover:bg-zinc-700 transition-colors md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Sidebar {...sidebarProps} />
          <Dialog.Close className="absolute right-3 top-3 rounded p-1 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
