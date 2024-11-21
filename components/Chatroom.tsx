import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database.types'
import { Message, OnlineUser, User, ColorOption } from '@/components/chat/types'
import Login from '@/components/Login'
import LoadingScreen from '@/components/chat/LoadingScreen'
import LeftSidebar from '@/components/chat/LeftSidebar'
import RightSidebar from '@/components/chat/RightSidebar'
import Chat, { ChatRef } from '@/components/chat/Chat'
import MessageInput from '@/components/chat/MessageInput'
import Settings from '@/components/chat/Settings'
import UserInfo from '@/components/chat/UserInfo'

type NonNullUser = Exclude<User, null>;

const colorOptions: ColorOption[] = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Indigo', value: '#6366F1' },
]

export default function Chatroom() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const channelRef = useRef<any>(null)
  const chatRef = useRef<ChatRef>(null)

  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [avatarColor, setAvatarColor] = useState<string>('#3B82F6')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    }
    return 'dark'
  })
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const messagesPerPage = 50
  
  // Settings state
  const [tempUsername, setTempUsername] = useState('')
  const [tempAvatarColor, setTempAvatarColor] = useState('#3B82F6')
  const [tempLocale, setTempLocale] = useState(router.locale)
  const [tempTheme, setTempTheme] = useState<'dark' | 'light'>('dark')
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null)

  // Add these state variables
  const loadingRef = useRef(false) // Use ref instead of state to avoid race conditions
  const initialLoadRef = useRef(false)

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Modify fetchMessages to include the last loaded ID check
  const fetchMessages = async (startIndex = 0): Promise<Message[]> => {
    try {
      const query = supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          reply_to,
          attachment,
          is_deleted,
          user_profiles (
            username,
            avatar_color,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        
      // For pagination, use created_at instead of id
      if (messages.length > 0 && startIndex > 0) {
        const oldestMessage = messages[0] // First message is the oldest due to reverse order
        query.lt('created_at', oldestMessage.created_at)
      }

      query.limit(messagesPerPage)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching messages:', error)
        return []
      }

      if (data) {
        const formattedMessages = (data as any[]).map(message => ({
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          user_id: message.user_id,
          reply_to: message.reply_to,
          attachment: message.attachment,
          is_deleted: message.is_deleted,
          user_profiles: message.user_profiles || { username: '', avatar_color: '#3B82F6' }
        })) as Message[]

        // Check if we have more messages to load
        setHasMore(formattedMessages.length === messagesPerPage)
        
        return formattedMessages.reverse() // Reverse to show newest at bottom
      }

      return []
    } catch (error) {
      console.error('Error in fetchMessages:', error)
      return []
    }
  }

  useEffect(() => {
    const initializeMessages = async () => {
      // Prevent multiple initial loads
      if (initialLoadRef.current || !user) return
      initialLoadRef.current = true
      
      const initialMessages = await fetchMessages(0)
      setMessages(initialMessages)
    }

    initializeMessages()
    setupRealtimeSubscriptions()

    return () => {
      channelRef.current?.unsubscribe()
      initialLoadRef.current = false // Reset on unmount
    }
  }, [user])

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now())
      channelRef.current?.track({ 
        isTyping: false, 
        username: user?.username || '',
        lastActive: Date.now(),
        avatarColor
      })
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
    }
  }, [user, avatarColor])

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true)
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()

          if (profileData) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              username: profileData.username,
              created_at: profileData.created_at,
              status: profileData.status
            })
            setAvatarColor(profileData.avatar_color || '#3B82F6')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (showSettings && user) {
      setTempUsername(user.username)
      setTempAvatarColor(avatarColor)
      setTempLocale(router.locale || 'en')
      setTempTheme(theme)
    }
  }, [showSettings, user, avatarColor, router.locale, theme])

  const setupRealtimeSubscriptions = () => {
    const channel = supabase.channel('public:messages', {
      config: {
        broadcast: { self: true },
        presence: {
          key: user?.username || 'anonymous',
        },
      },
    })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload: { 
          new: Database['public']['Tables']['messages']['Row'],
          eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        }) => {
          if (payload.eventType === 'INSERT') {
            // Check if message already exists
            const messageExists = messages.some(m => m.id === payload.new.id)
            if (messageExists) return

            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('username, avatar_color, created_at')
              .eq('user_id', payload.new.user_id)
              .single()

            const newMessage: Message = {
              id: payload.new.id,
              content: payload.new.content,
              created_at: payload.new.created_at,
              user_id: payload.new.user_id,
              reply_to: payload.new.reply_to,
              attachment: payload.new.attachment,
              is_deleted: payload.new.is_deleted,
              user_profiles: profileData || { 
                username: '', 
                avatar_color: '#3B82F6',
                created_at: ''
              }
            }
            
            setMessages(current => {
              // Double check for duplicates before adding
              if (current.some(m => m.id === newMessage.id)) {
                return current
              }
              return [...current, newMessage]
            })
          } else if (payload.eventType === 'UPDATE' && payload.new.is_deleted) {
            // Handle message deletion
            setMessages(current => 
              current.map(msg => 
                msg.id === payload.new.id 
                  ? { ...msg, is_deleted: true }
                  : msg
              )
            )
          }
        }
      )
      .on('presence', { event: 'sync' }, async () => {
        const presenceState = channel.presenceState()
        const typingState = new Set<string>()
        const currentOnlineUsers: OnlineUser[] = []
        const now = Date.now()
        
        const allPresences = Object.values(presenceState).flat() as Array<{
          username?: string
          isTyping?: boolean
          lastActive?: number
          avatarColor?: string
          status?: string
          user_id?: string
        }>
        
        // Fetch user profiles for all online users
        for (const presence of allPresences) {
          if (presence.username && presence.username !== user?.username) {
            // Fetch user profile data including created_at
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('username, avatar_color, created_at')
              .eq('username', presence.username)
              .single()

            currentOnlineUsers.push({
              username: presence.username,
              status: presence.isTyping ? 'typing' : (presence.status || 'online'),
              lastActive: presence.lastActive || now,
              avatarColor: presence.avatarColor || '#3B82F6',
              created_at: profileData?.created_at || '',
              user_id: presence.user_id
            })

            if (presence.isTyping) {
              typingState.add(presence.username)
            }
          }
        }
        
        setOnlineUsers(currentOnlineUsers)
        setTypingUsers(typingState)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({ 
            isTyping: false, 
            username: user.username,
            lastActive: Date.now(),
            avatarColor: avatarColor,
            status: user.status || 'online',
            user_id: user.id
          })
        }
      })

    channelRef.current = channel
  }

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSendMessage = async (
    content: string, 
    attachment?: { url: string; name: string; type: string; size: number; } | null
  ) => {
    if ((!content.trim() && !attachment) || !user) return

    const messageData = {
      content: content.trim() || (attachment ? `[File] ${attachment.name}` : ''),
      user_id: user.id,
      reply_to: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        user_name: replyingTo.user_profiles?.username || ''
      } : null,
      attachment: attachment || null
    }

    const { error } = await supabase
      .from('messages')
      .insert([messageData])

    if (error) {
      console.error('Error sending message:', error)
    } else {
      setReplyingTo(null)
    }
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        showNotification(t('messageCopied'))
      })
      .catch(err => {
        console.error('Failed to copy:', err)
        showNotification('Failed to copy message', 'error')
      })
  }

  const handleTyping = () => {
    if (!user || !channelRef.current) return

    channelRef.current.track({ 
      isTyping: true, 
      username: user.username,
      lastActive: Date.now(),
      avatarColor
    })
  }

  const handleSaveSettings = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: tempUsername,
          avatar_color: tempAvatarColor
        })
        .eq('user_id', user.id)

      if (error) throw error

      setUser(prev => prev ? {
        ...prev,
        username: tempUsername
      } : null)
      setAvatarColor(tempAvatarColor)
      
      // Update theme
      setTheme(tempTheme)

      // Update locale if changed
      if (tempLocale !== router.locale) {
        router.push(router.pathname, router.pathname, { locale: tempLocale })
      }

      // Update presence channel with new info
      channelRef.current?.track({ 
        isTyping: false, 
        username: tempUsername,
        lastActive: Date.now(),
        avatarColor: tempAvatarColor,
        user_id: user.id
      })

      setShowSettings(false)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const isUserAway = (lastActiveTime: number) => {
    return Date.now() - lastActiveTime > 60000
  }

  const loadMoreMessages = async () => {
    // Prevent duplicate loads
    if (loadingRef.current || !hasMore || isLoadingMore) return
    
    loadingRef.current = true
    setIsLoadingMore(true)

    try {
      const moreMessages = await fetchMessages(messages.length)
      
      if (moreMessages.length > 0) {
        setMessages(prevMessages => {
          const existingMessageIds = new Set(prevMessages.map(m => m.id))
          const uniqueNewMessages = moreMessages.filter(m => !existingMessageIds.has(m.id))
          return [...uniqueNewMessages, ...prevMessages]
        })
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMore(false)
      loadingRef.current = false
    }
  }

  const handleDeleteMessage = async (messageId: string, userId: string) => {
    // Check if the message belongs to the current user
    if (userId !== user?.id) {
      showNotification(t('cannotDeleteMessage'), 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId)

      if (error) {
        console.error('Error deleting message:', error)
        showNotification(t('errorDeletingMessage'), 'error')
        return
      }

      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, is_deleted: true }
            : msg
        )
      )

      showNotification(t('messageDeleted'), 'success')
    } catch (error) {
      console.error('Error in handleDeleteMessage:', error)
      showNotification(t('errorDeletingMessage'), 'error')
    }
  }

  if (loading) return <LoadingScreen />
  if (!user) return null;

  return (
    <div className="flex h-screen chat-container overflow-x-hidden">
      {notification && (
        <div 
          className={`fixed md:top-4 top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border transition-all duration-300 ${
            notification.type === 'error' 
              ? 'bg-red-50 border-red-200 dark:bg-red-900/50 dark:border-red-800' 
              : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
          }`}
        >
          <span className={`text-sm ${
            notification.type === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-[var(--text-primary)]'
          }`}>
            {notification.message}
          </span>
        </div>
      )}

      <div className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] z-40">
        {/* Left side - User info */}
        <button
          onClick={() => setShowUserInfo(true)}
          className="flex items-center gap-2 hover:bg-[var(--hover-bg)] rounded-full px-3 py-1.5 transition-colors group"
        >
          <div className="relative">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: avatarColor }}
            >
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-secondary)] ${
              isUserAway(lastActivity) ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
          </div>
          <span className="text-[var(--text-primary)] font-medium">
            {user?.username}
          </span>
        </button>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--hover-bg)]"
            aria-label={t('settings')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 rounded-full hover:bg-[var(--hover-bg)]"
            aria-label={t('logout')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>

      <LeftSidebar 
        onSettingsClick={() => setShowSettings(true)}
        onLogout={handleLogout}
        user={user as NonNullUser}
        avatarColor={avatarColor}
        isAway={isUserAway(lastActivity)}
        onUserInfoClick={() => setShowUserInfo(true)}
      />

      {showUserInfo && user && (
        <UserInfo
          className="fixed inset-0 z-50 transition-opacity duration-300"
          user={user}
          avatarColor={avatarColor}
          onAvatarColorChange={setTempAvatarColor}
          onUsernameChange={setTempUsername}
          colorOptions={colorOptions}
          onClose={() => setShowUserInfo(false)}
          onSave={async (newUsername, newAvatarColor) => {
            try {
              const { error } = await supabase
                .from('user_profiles')
                .update({
                  username: newUsername,
                  avatar_color: newAvatarColor
                })
                .eq('user_id', user.id)

              if (error) throw error

              setUser(prev => prev ? {
                ...prev,
                username: newUsername
              } : null)
              setAvatarColor(newAvatarColor)

              // Update presence channel
              channelRef.current?.track({ 
                isTyping: false, 
                username: newUsername,
                lastActive: Date.now(),
                avatarColor: newAvatarColor
              })

              setShowUserInfo(false)
            } catch (error) {
              console.error('Error saving user settings:', error)
            }
          }}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative bg-[var(--bg-primary)] md:mr-64 pt-16 md:pt-0">
        <Chat
          ref={chatRef}
          messages={messages}
          onReply={setReplyingTo}
          onCopy={handleCopy}
          onDelete={handleDeleteMessage}
          onLoadMore={loadMoreMessages}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          currentUserId={user.id}
        />

        <div className="relative z-20">
          <MessageInput
            user={user as NonNullUser}
            onSendMessage={handleSendMessage}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onTyping={handleTyping}
            theme={theme}
            showNotification={showNotification}
            typingUsers={typingUsers}
          />
        </div>
      </div>

      <RightSidebar
        className="w-64 flex-shrink-0 fixed right-0 top-0 bottom-0 md:block hidden"
        currentUser={user as NonNullUser}
        onlineUsers={onlineUsers}
        userAvatarColor={avatarColor}
        isUserAway={isUserAway}
        lastActivity={lastActivity}
      />

      <Settings
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          showSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClose={() => setShowSettings(false)}
        locale={tempLocale || 'en'}
        onLocaleChange={setTempLocale}
        theme={tempTheme}
        onThemeChange={setTempTheme}
        onSave={handleSaveSettings}
      />
    </div>
  )
}