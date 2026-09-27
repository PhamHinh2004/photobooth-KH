declare module '@emoji-mart/data' {
  const data: Record<string, unknown>
  export default data
}

declare module 'emoji-mart' {
  export interface PickerOptions {
    data: Record<string, unknown>
    onEmojiSelect?: (emoji: { native?: string; id?: string; shortcodes?: string }) => void
    theme?: 'light' | 'dark' | 'auto'
    locale?: string
    previewPosition?: 'top' | 'bottom' | 'none'
    skinTonePosition?: 'preview' | 'search' | 'none'
    set?: 'native' | 'apple' | 'facebook' | 'google' | 'twitter'
    perLine?: number
    maxFrequentRows?: number
    emojiSize?: number
    emojiButtonSize?: number
    categories?: string[]
    autoFocus?: boolean
    searchPosition?: 'sticky' | 'static' | 'none'
  }

  export class Picker {
    constructor(options: PickerOptions)
  }
}
