'use client'

import { useState, FormEvent } from 'react'
import type { CreateTargetPayload } from '@/types/intel'

interface AddTargetFormProps {
  onSubmit: (data: CreateTargetPayload) => Promise<void>
}

export function AddTargetForm({ onSubmit }: AddTargetFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [targetType, setTargetType] = useState<'domain' | 'repo' | 'api'>('domain')
  const [identifier, setIdentifier] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')

  const resetForm = () => {
    setTargetType('domain')
    setIdentifier('')
    setCategory('')
    setNote('')
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        target_type: targetType,
        identifier: identifier.trim(),
        category: category.trim() || undefined,
        note: note.trim() || undefined,
      })
      resetForm()
      setIsOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add target'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-white/10 text-sm font-medium text-text-muted hover:text-text-secondary hover:border-white/20 hover:bg-white/3 transition-all duration-200"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Target
      </button>
    )
  }

  const inputClasses = 'bg-surface-2 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 outline-none transition-colors'

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-text-secondary">Add New Target</h3>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Row 1: type + identifier */}
        <div className="flex gap-3">
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as 'domain' | 'repo' | 'api')}
            className={`${inputClasses} w-32 shrink-0 appearance-none cursor-pointer`}
          >
            <option value="domain">Domain</option>
            <option value="repo">Repo</option>
            <option value="api">API</option>
          </select>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="example.com"
            required
            className={`${inputClasses} flex-1`}
          />
        </div>

        {/* Row 2: category + note */}
        <div className="flex gap-3">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            className={`${inputClasses} w-48 shrink-0`}
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className={`${inputClasses} flex-1`}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/5 bg-surface-1/30">
        <button
          type="button"
          onClick={() => { resetForm(); setIsOpen(false) }}
          className="px-4 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text-secondary hover:bg-white/5 border border-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!identifier.trim() || isSubmitting}
          className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-500 disabled:bg-surface-4 disabled:text-text-muted transition-all active:scale-95"
        >
          {isSubmitting ? 'Adding...' : 'Add Target'}
        </button>
      </div>
    </form>
  )
}
