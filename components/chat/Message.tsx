import { useTranslation } from 'next-i18next'
import { Message } from './types'
import Image from 'next/image'
import { useState } from 'react'

interface MessageProps {
  message: Message
  onReply: (message: Message) => void
  onCopy: (content: string) => void
  onDelete?: (messageId: string, userId: string) => void
  currentUserId?: string
}

// Add these helper functions at the top of the file
function getYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/, // Regular youtube URLs
    /youtube\.com\/embed\/([^&\s]+)/, // Embed URLs
    /youtube\.com\/v\/([^&\s]+)/, // Another format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function convertUrlsToLinks(text: string) {
  // Regex for matching URLs
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  
  // Replace URLs with links directly
  return text.replace(urlRegex, (url) => {
    return `[link]${url}[/link]`;
  }).split(/\[link\]|\[\/link\]/).map((part, i) => {
    if (i % 2 === 1) { // URL parts
      const youtubeId = getYoutubeVideoId(part);
      return (
        <span key={i}>
          <a
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {part}
          </a>
          {youtubeId && (
            <div className="mt-2 max-w-[500px]">
              <div className="relative aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                />
              </div>
            </div>
          )}
        </span>
      );
    }
    return part; // Text parts
  });
}

export default function MessageComponent({ message, onReply, onCopy, onDelete, currentUserId }: MessageProps) {
  const { t } = useTranslation('common')
  const isOwnMessage = message.user_id === currentUserId
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(message.id, message.user_id)
    }
    setShowDeleteConfirm(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const renderContent = (message: Message) => {    
    if (message.is_deleted) {
      return (
        <span className="text-[var(--text-secondary)] italic">
          {t('deletedMessage')}
        </span>
      )
    } else if (message.attachment?.type?.startsWith('audio/')) {
      return (
        <div className="space-y-2">
          {message.content && message.attachment?.name && 
           message.content !== `[File] ${message.attachment.name}` && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
          
          <div className="relative group max-w-[300px]">
            <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
              <audio
                controls
                className="w-full"
                preload="metadata"
              >
                <source src={message.attachment.url} type={message.attachment.type} />
                {t('audioNotSupported')}
              </audio>
            </div>
          </div>
        </div>
      )
    } else if (message.attachment?.type?.startsWith('video/')) {
      return (
        <div className="space-y-2">
          {message.content && message.attachment?.name && 
           message.content !== `[File] ${message.attachment.name}` && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
          
          <div className="relative group max-w-[300px]">
            <div className="relative aspect-video">
              <video
                src={message.attachment.url}
                controls
                className="rounded-lg w-full h-full"
                preload="metadata"
              >
                <source src={message.attachment.url} type={message.attachment.type} />
                {t('videoNotSupported')}
              </video>
            </div>
          </div>
        </div>
      )
    } else if (message.attachment?.type?.startsWith('image/')) {
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

    // Regular text message with URL detection
    return (
      <p className="whitespace-pre-wrap break-words">
        {convertUrlsToLinks(message.content)}
      </p>
    );
  }

  return (
    <>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-[var(--border-color)]">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              {t('deleteMessage')}
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {t('confirmDelete')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-md bg-[var(--bg-primary)] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Content */}
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
          {!message.is_deleted && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                onClick={() => onReply(message)}
                className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                aria-label={t('reply')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>
              <button
                onClick={() => onCopy(message.content)}
                className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                aria-label={t('copyMessage')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              {isOwnMessage && onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                  aria-label={t('deleteMessage')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
} 