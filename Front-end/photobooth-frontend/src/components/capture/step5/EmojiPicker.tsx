import { useEffect, useRef, useCallback } from 'react'
import data from '@emoji-mart/data'

interface EmojiPickerProps {
  onSelect: (emoji: { native?: string; id?: string }) => void
}

/**
 * Vanilla emoji-mart picker wrapped for React 19.
 * Uses the web component API instead of @emoji-mart/react (which is broken with React 19).
 */
export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onSelect)
  callbackRef.current = onSelect

  const stableCallback = useCallback((emoji: { native?: string; id?: string }) => {
    callbackRef.current(emoji)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    // Dynamic import to avoid SSR issues
    import('emoji-mart').then(({ Picker }) => {
      if (!mounted || !containerRef.current) return

      // Clear previous
      containerRef.current.innerHTML = ''

      // Create vanilla picker (web component)
      const picker = new Picker({
        data,
        onEmojiSelect: stableCallback,
        theme: 'light',
        locale: 'vi',
        previewPosition: 'none',
        skinTonePosition: 'search',
        set: 'facebook',
        perLine: 8,
        maxFrequentRows: 2,
        emojiSize: 28,
        emojiButtonSize: 36,
        categories: ['frequent', 'people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags'],
      })

      if (containerRef.current) {
        containerRef.current.appendChild(picker as unknown as Node)
      }
    })

    return () => {
      mounted = false
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [stableCallback])

  return (
    <div
      ref={containerRef}
      className="flex justify-center rounded-xl overflow-hidden border border-slate-200 [&_em-emoji-picker]:w-full"
    />
  )
}
