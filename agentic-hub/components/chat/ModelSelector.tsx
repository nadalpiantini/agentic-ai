'use client'

type ModelOption = 'claude' | 'deepseek' | 'ollama'

interface ModelSelectorProps {
  value: ModelOption
  onChange: (model: ModelOption) => void
}

const models: { id: ModelOption; label: string; description: string }[] = [
  { id: 'claude', label: 'Claude', description: 'Quality' },
  { id: 'deepseek', label: 'DeepSeek', description: 'Cost' },
  { id: 'ollama', label: 'Ollama', description: 'Local' },
]

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div className="flex gap-1">
      {models.map(model => (
        <button
          key={model.id}
          onClick={() => onChange(model.id)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            value === model.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={model.description}
        >
          {model.label}
        </button>
      ))}
    </div>
  )
}
