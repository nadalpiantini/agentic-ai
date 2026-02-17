'use client'

type ModelOption = 'claude' | 'deepseek' | 'ollama'

interface ModelSelectorProps {
  value: ModelOption
  onChange: (model: ModelOption) => void
}

const models: { id: ModelOption; label: string; color: string }[] = [
  { id: 'claude', label: 'Claude', color: 'bg-emerald-400' },
  { id: 'deepseek', label: 'DeepSeek', color: 'bg-blue-400' },
  { id: 'ollama', label: 'Ollama', color: 'bg-orange-400' },
]

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-white/5">
      {models.map(model => (
        <button
          key={model.id}
          onClick={() => onChange(model.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
            value === model.id
              ? 'bg-brand-600/20 text-brand-300 shadow-sm'
              : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${model.color} ${value === model.id ? 'opacity-100' : 'opacity-40'}`} />
          {model.label}
        </button>
      ))}
    </div>
  )
}
