"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDown, Zap, Globe, Shield, Cpu } from "lucide-react";
import { useModelStore } from "@/hooks/use-model-store";
import type { ModelProvider } from "@/types/models";
import { cn } from "@/lib/utils/cn";

const MODEL_OPTIONS: {
  value: ModelProvider;
  label: string;
  icon: typeof Zap;
  color: string;
}[] = [
  { value: "zai", label: "GLM-5", icon: Cpu, color: "text-blue-400" },
  { value: "claude", label: "Claude", icon: Zap, color: "text-yellow-400" },
  {
    value: "deepseek",
    label: "DeepSeek",
    icon: Globe,
    color: "text-green-400",
  },
  { value: "ollama", label: "Ollama", icon: Shield, color: "text-purple-400" },
];

export function ModelSelector() {
  const { model, setModel } = useModelStore();
  const current = MODEL_OPTIONS.find((o) => o.value === model) ?? MODEL_OPTIONS[0];
  const Icon = current.icon;

  return (
    <Select.Root value={model} onValueChange={(v) => setModel(v as ModelProvider)}>
      <Select.Trigger
        className={cn(
          "flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2",
          "text-xs text-zinc-300 hover:border-zinc-600 transition-colors",
          "focus:outline-none focus:border-blue-600"
        )}
        aria-label="Select model"
      >
        <Icon className={cn("h-3.5 w-3.5", current.color)} />
        <Select.Value />
        <ChevronDown className="h-3 w-3 text-zinc-500" />
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="z-50 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {MODEL_OPTIONS.map((option) => {
              const OptionIcon = option.icon;
              return (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs text-zinc-300",
                    "outline-none data-[highlighted]:bg-zinc-800 data-[highlighted]:text-zinc-100"
                  )}
                >
                  <OptionIcon className={cn("h-3.5 w-3.5", option.color)} />
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              );
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
