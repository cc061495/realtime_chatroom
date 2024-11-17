import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { Message as MessageType } from './types'
import Message from './Message'

interface ChatProps {
  messages: MessageType[]
  onReply: (message: MessageType) => void
  onCopy: (content: string) => void
  onLoadMore: () => void
  isLoadingMore: boolean
  hasMore: boolean
}

export default function Chat({ 
  messages, 
  onReply, 
  onCopy,
  onLoadMore,
  isLoadingMore,
  hasMore 
}: ChatProps) {
  const { t } = useTranslation('common')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isScrollingUp, setIsScrollingUp] = useState(false)
  const previousScrollHeightRef = useRef<number>(0)
  const previousMessagesLengthRef = useRef<number>(messages.length)

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (chatContainerRef.current && isAtBottom) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }

    // Handle scroll position when loading more messages
    if (chatContainerRef.current && messages.length > previousMessagesLengthRef.current) {
      const newScrollHeight = chatContainerRef.current.scrollHeight
      const scrollDifference = newScrollHeight - previousScrollHeightRef.current
      
      if (scrollDifference > 0 && !isAtBottom) {
        chatContainerRef.current.scrollTop = scrollDifference
      }
    }

    // Update refs for next comparison
    if (chatContainerRef.current) {
      previousScrollHeightRef.current = chatContainerRef.current.scrollHeight
      previousMessagesLengthRef.current = messages.length
    }
  }, [messages, isAtBottom])

  // Initial scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      previousScrollHeightRef.current = chatContainerRef.current.scrollHeight
      previousMessagesLengthRef.current = messages.length
    }
  }, [])

  // Add scroll handler for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearTop = scrollTop < 100
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    // Store the current scroll height before loading more messages
    if (isNearTop && hasMore && !isLoadingMore) {
      previousScrollHeightRef.current = scrollHeight
      onLoadMore()
    }

    setIsAtBottom(isNearBottom)
    setIsScrollingUp(!isNearBottom)
  }

  return (
    <>
      {/* Loading indicator - adjusted for mobile */}
      {isLoadingMore && (
        <div className="absolute top-4 md:top-4 top-16 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-secondary)] p-2 rounded-lg shadow-lg border border-[var(--border-color)]">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--text-secondary)] border-t-transparent"></div>
        </div>
      )}

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-[var(--scrollbar-thumb)] scrollbar-track-[var(--scrollbar-track)] hover:scrollbar-thumb-[var(--scrollbar-thumb-hover)]"
        onScroll={handleScroll}
      >
        {/* Messages */}
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            onReply={onReply}
            onCopy={onCopy}
          />
        ))}
      </div>
    </>
  )
} 