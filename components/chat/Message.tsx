import { useTranslation } from 'next-i18next'
import { Message } from './types'
import Image from 'next/image'

interface MessageProps {
  message: Message
  onReply: (message: Message) => void
  onCopy: (content: string) => void
}

export default function MessageComponent({ message, onReply, onCopy }: MessageProps) {
  const { t } = useTranslation('common')
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const renderContent = (message: Message) => {
    if (message.attachment?.type?.startsWith('image/')) {
      return (
        <div className="space-y-2">
          {message.content && message.attachment?.name && 
           message.content !== `[File] ${message.attachment.name}` && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
          
          <div className="relative group max-w-[300px]">
            <div className="relative aspect-video">
              {message.attachment?.url && (
                <Image
                  src={message.attachment.url}
                  alt={message.attachment.name || 'Image attachment'}
                  fill
                  priority
                  sizes="300px"
                  className="rounded-lg cursor-pointer object-contain"
                  onClick={() => message.attachment?.url && window.open(message.attachment.url, '_blank')}
                  unoptimized={true}
                />
              )}
            </div>
          </div>
        </div>
      )
    } else if (message.attachment) {
      // For non-image attachments
      return (
        <div className="space-y-2">
          {/* Show message content if it exists */}
          {message.content && message.content !== `[File] ${message.attachment.name}` && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
          
          {/* File attachment */}
          <a
            href={message.attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-[var(--text-primary)]">{message.attachment.name}</span>
          </a>
        </div>
      )
    }

    // Regular text message
    return <p className="whitespace-pre-wrap break-words">{message.content}</p>
  }

  return (
    <div className="group hover:bg-[var(--hover-bg)] px-4 py-2 rounded-md">
      {/* Reply reference if exists */}
      {message.reply_to && (
        <div className="ml-12 mb-1 text-sm text-[var(--text-secondary)] flex items-center gap-2">
          <svg className="w-4 h-4 rotate-180 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"></path>
          </svg>
          <div className="flex items-center gap-1 min-w-0">
            <span className="whitespace-nowrap">
              {t('replyingTo')} {message.reply_to.user_name}:
            </span>
            <span className="truncate min-w-0">
              {message.reply_to.content}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-x-3">
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: message.user_profiles.avatar_color || '#3B82F6' }}
        >
          {message.user_profiles.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-x-2">
            <span className="font-semibold text-[var(--text-primary)]">
              {message.user_profiles.username}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {formatDate(message.created_at)}
            </span>
          </div>
          <div className="text-[var(--text-primary)] mt-1 break-words whitespace-pre-wrap">
            {renderContent(message)}
          </div>
        </div>
        {/* Action buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex gap-2 flex-shrink-0">
          <button
            onClick={() => onCopy(message.content)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded"
            title={t('copyMessage')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onReply(message)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded"
            title={t('reply')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 