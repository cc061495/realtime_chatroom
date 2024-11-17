import { useRef, useEffect, forwardRef } from 'react'
import { Message as MessageType } from './types'
import MessageComponent from './Message'

interface ChatProps {
  messages: MessageType[]
  onReply: (message: MessageType) => void
  onCopy: (content: string) => void
  onLoadMore: () => void
  isLoadingMore: boolean
  hasMore: boolean
}

export interface ChatRef {
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

const Chat = forwardRef<ChatRef, ChatProps>(({
  messages,
  onReply,
  onCopy,
  onLoadMore,
  isLoadingMore,
  hasMore
}, ref) => {
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef(messages.length)
  const prevScrollHeightRef = useRef(0)
  const prevFirstMessageId = useRef<string>()
  const initialScrollDoneRef = useRef(false)

  // Initial scroll to bottom
  useEffect(() => {
    if (!initialScrollDoneRef.current && messages.length > 0 && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      initialScrollDoneRef.current = true
    }
  }, [messages])
  
  // Handle scrolling for new messages and loading old messages
  useEffect(() => {
    if (!chatContainerRef.current) return

    const container = chatContainerRef.current
    const currentScrollHeight = container.scrollHeight
    
    // Check if messages were added
    const messagesAdded = messages.length > prevMessagesLengthRef.current
    
    // More accurate way to detect if we're loading older messages
    const isLoadingOlder = messagesAdded && 
      messages.length > prevMessagesLengthRef.current && 
      messages[0]?.id !== prevFirstMessageId.current

    if (messagesAdded && !isLoadingOlder) {
      // Scroll to bottom after new messages are added
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          })
        }
      })
    } else if (isLoadingOlder && currentScrollHeight !== prevScrollHeightRef.current) {
      // Maintain scroll position when loading older messages
      const scrollDiff = currentScrollHeight - prevScrollHeightRef.current
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = scrollDiff
        }
      })
    }

    // Update refs for next comparison
    prevScrollHeightRef.current = currentScrollHeight
    prevMessagesLengthRef.current = messages.length
    prevFirstMessageId.current = messages[0]?.id
  }, [messages])

  // Expose scrollToBottom method via ref
  useEffect(() => {
    if (ref) {
      (ref as any).current = {
        scrollToBottom: (behavior: ScrollBehavior = 'auto') => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior
            })
          }
        }
      }
    }
  }, [ref])

  // Handle infinite scroll
  const handleScroll = () => {
    if (!chatContainerRef.current || isLoadingMore || !hasMore) return

    const { scrollTop } = chatContainerRef.current
    
    // Load more when scrolled near the top (within 50px)
    if (scrollTop < 50) {
      onLoadMore()
    }
  }

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto custom-scrollbar"
      onScroll={handleScroll}
    >
      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 rounded-full border-t-transparent animate-spin"
            style={{ 
              borderColor: 'var(--text-secondary)',
              borderTopColor: 'transparent'
            }} 
          />
        </div>
      )}

      {/* Messages */}
      <div className="py-4 space-y-1">
        {messages.map((message, index) => (
          <div
            key={message.id}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            <MessageComponent
              message={message}
              onReply={onReply}
              onCopy={onCopy}
            />
          </div>
        ))}
      </div>
    </div>
  )
})

Chat.displayName = 'Chat'

export default Chat 