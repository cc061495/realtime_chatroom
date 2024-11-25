import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { Message, User } from './types'
import { supabase } from '../../lib/supabaseClient'
import Image from 'next/image'

interface MessageInputProps {
  user: User
  onSendMessage: (content: string, attachment?: { url: string; name: string; type: string; size: number } | null) => void
  replyingTo: Message | null
  onCancelReply: () => void
  onTyping: () => void
  theme: 'dark' | 'light'
  showNotification: (message: string, type?: 'success' | 'error') => void
  typingUsers: Set<string>
}

export default function MessageInput({
  user,
  onSendMessage,
  replyingTo,
  onCancelReply,
  onTyping,
  theme,
  showNotification,
  typingUsers
}: MessageInputProps) {
  const { t } = useTranslation('common')
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && !pendingAttachment) || !user) return

    await onSendMessage(
      message.trim(), 
      pendingAttachment
    )
    
    setMessage('')
    setPendingAttachment(null)
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px'
      textareaRef.current.style.overflowY = 'hidden'
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    const value = textarea.value
    
    // Get the computed styles
    const computedStyle = window.getComputedStyle(textarea)
    const paddingTop = parseInt(computedStyle.paddingTop)
    const paddingBottom = parseInt(computedStyle.paddingBottom)
    const lineHeight = parseInt(computedStyle.lineHeight) || 20 // Get actual line height or fallback
    const maxLines = 5

    // Reset height to recalculate scrollHeight
    textarea.style.height = 'auto'

    // Count actual number of lines by splitting on newlines
    const lines = value.split('\n').length
    const totalLines = Math.max(
      lines,
      Math.ceil((textarea.scrollHeight - paddingTop - paddingBottom) / lineHeight)
    )

    if (!value.trim()) {
      // Reset to single line if empty
      textarea.style.height = `${lineHeight}px`
      textarea.style.overflowY = 'hidden'
    } else {
      // Set height based on content lines, capped at maxLines
      const clampedLines = Math.min(totalLines, maxLines)
      const newHeight = (clampedLines * lineHeight) + paddingTop + paddingBottom
      textarea.style.height = `${newHeight}px`
      textarea.style.overflowY = totalLines > maxLines ? 'auto' : 'hidden'
    }

    setMessage(value)
    onTyping()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showNotification(t('fileTooBig'), 'error')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create a signed URL that expires in 1 year (31536000 seconds)
      const { data } = await supabase.storage
        .from('attachments')
        .createSignedUrl(filePath, 31536000) // 1 year in seconds

      if (!data?.signedUrl) throw new Error('Could not create signed URL')

      setPendingAttachment({
        url: data.signedUrl,
        name: file.name,
        type: file.type,
        size: file.size
      })
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
      {/* Typing indicator - updated to match reply preview style */}
      {typingUsers.size > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-[var(--text-secondary)] animate-fade-in-down">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 bg-[var(--text-secondary)] rounded-full animate-typing-dot1"></span>
            <span className="w-1 h-1 bg-[var(--text-secondary)] rounded-full animate-typing-dot2"></span>
            <span className="w-1 h-1 bg-[var(--text-secondary)] rounded-full animate-typing-dot3"></span>
          </div>
          <span className="flex-1 truncate">
            <span className="font-medium">{Array.from(typingUsers).join(', ')}</span>
            <span> {t('typing')}</span>
          </span>
        </div>
      )}

      {/* Reply preview */}
      {replyingTo && (
        <div className="mb-4 flex items-center gap-2 text-sm text-[var(--text-secondary)] animate-fade-in-down">
          <svg className="w-4 h-4 rotate-180" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"></path>
          </svg>
          <span className="flex-1 truncate">
            {t('replyingTo')} {replyingTo.user_profiles.username}
          </span>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-[var(--hover-bg)] rounded"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
            </svg>
          </button>
        </div>
      )}

      {pendingAttachment && (
        <div className="mx-4 mb-2 p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] relative">
          <div className="flex items-center gap-2">
            {pendingAttachment.type.startsWith('image/') ? (
              <div className="relative w-20 h-20">
                <Image
                  src={pendingAttachment.url}
                  alt={pendingAttachment.name}
                  fill
                  priority
                  sizes="80px"
                  className="object-cover rounded"
                  unoptimized={true}
                />
              </div>
            ) : (
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            <span className="flex-1 truncate text-sm text-[var(--text-secondary)]">
              {pendingAttachment.name}
            </span>
            <button
              onClick={() => setPendingAttachment(null)}
              className="p-1 hover:bg-[var(--hover-bg)] rounded text-[var(--text-secondary)]"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative flex-1 flex items-end bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] focus-within:border-blue-500 transition-colors">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaInput}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder={t('sendMessage')}
            className="flex-1 resize-none bg-transparent text-[var(--text-primary)] px-4 py-2 outline-none custom-scrollbar min-h-[40px] max-h-[200px] rounded-2xl"
            rows={1}
          />

          <div className="flex items-center gap-1 px-2">
            {/* Attachment button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors relative"
              title={t('attachFile')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)] bg-opacity-50 rounded-full">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>

            {/* Emoji picker button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors"
              title={t('addEmoji')}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm3.5-9c.828 0 1.5-.672 1.5-1.5S16.328 8 15.5 8 14 8.672 14 9.5s.672 1.5 1.5 1.5zm-7 0c.828 0 1.5-.672 1.5-1.5S9.328 8 8.5 8 7 8.672 7 9.5 7.672 11 8.5 11zm3.5 6.5c2.33 0 4.32-1.45 5.12-3.5H7.38c.9 2.05 2.89 3.5 5.12 3.5z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Send button - Now a rounded square with equal width and height */}
        <button
          onClick={handleSubmit}
          disabled={!message.trim() && !uploading}
          className="bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[40px] w-[40px] flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 right-4">
          <EmojiPicker
            onEmojiClick={(emojiObject) => {
              setMessage(prev => prev + emojiObject.emoji)
              if (textareaRef.current) {
                textareaRef.current.focus()
              }
            }}
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
          />
        </div>
      )}
    </div>
  )
} 