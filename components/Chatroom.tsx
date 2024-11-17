import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { Message, OnlineUser, User, ColorOption } from './chat/types'
import Login from './Login'
import LoadingScreen from './chat/LoadingScreen'
import LeftSidebar from './chat/LeftSidebar'
import RightSidebar from './chat/RightSidebar'
import Chat from './chat/Chat'
import MessageInput from './chat/MessageInput'
import Settings from './chat/Settings'
import UserInfo from './chat/UserInfo'
import type { Database } from '../lib/database.types'

const colorOptions: ColorOption[] = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Indigo', value: '#6366F1' },
]

// Add this type to handle the database response
type MessageWithProfiles = {
  id: string
  content: string
  created_at: string
  user_id: string
  reply_to: {
    id: string
    content: string
    user_name: string
  } | null
  user_profiles: {
    username: string
    avatar_color: string
  } | null
}

export default function Chatroom() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const activityCheckInterval = useRef<NodeJS.Timer>()

  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [avatarColor, setAvatarColor] = useState<string>('#3B82F6')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showOnlineUsers, setShowOnlineUsers] = useState(false)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const messagesPerPage = 20
  
  // Settings state
  const [tempUsername, setTempUsername] = useState('')
  const [tempAvatarColor, setTempAvatarColor] = useState('#3B82F6')
  const [tempLocale, setTempLocale] = useState(router.locale)
  const [tempTheme, setTempTheme] = useState<'dark' | 'light'>('dark')

  // Move fetchMessages outside useEffect
  const fetchMessages = async (startIndex = 0) => {
    const { data, error, count } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        user_id,
        reply_to,
        user_profiles (
          username,
          avatar_color
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + messagesPerPage - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    if (data) {
      const formattedMessages = (data as MessageWithProfiles[]).map(message => ({
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        user_id: message.user_id,
        reply_to: message.reply_to,
        user_profiles: message.user_profiles || { username: '', avatar_color: '#3B82F6' },
        avatar_color: message.user_profiles?.avatar_color || '#3B82F6'
      }))

      // Check if we have more messages to load
      setHasMore(count ? startIndex + messagesPerPage < count : false)
      
      return formattedMessages.reverse() // Reverse to show newest at bottom
    }

    return []
  }

  useEffect(() => {
    const initializeMessages = async () => {
      const initialMessages = await fetchMessages(0)
      setMessages(initialMessages)
    }

    initializeMessages()
    setupRealtimeSubscriptions()

    return () => {
      channelRef.current?.unsubscribe()
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
            .select('username, avatar_color')
            .eq('user_id', session.user.id)
            .single()

          if (profileData) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              username: profileData.username,
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
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload: { new: Database['public']['Tables']['messages']['Row'] }) => {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('username, avatar_color')
            .eq('user_id', payload.new.user_id)
            .single()

          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            reply_to: payload.new.reply_to,
            user_profiles: profileData || { 
              username: '', 
              avatar_color: '#3B82F6' 
            }
          }
          
          setMessages(current => [...current, newMessage])
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const typingState = new Set<string>()
        const currentOnlineUsers: OnlineUser[] = []
        const now = Date.now()
        
        // Flatten all presence states into a single array
        const allPresences = Object.values(presenceState).flat() as Array<{
          username?: string
          isTyping?: boolean
          lastActive?: number
          avatarColor?: string
        }>
        
        // Filter and map presences to online users
        allPresences.forEach((presence) => {
          if (presence.username && presence.username !== user?.username) {
            const isAway = now - (presence.lastActive || now) > 60000
            currentOnlineUsers.push({
              username: presence.username,
              status: isAway ? 'away' : (presence.isTyping ? 'typing' : 'online'),
              lastActive: presence.lastActive || now,
              avatarColor: presence.avatarColor || '#3B82F6'
            })
            if (presence.isTyping) {
              typingState.add(presence.username)
            }
          }
        })
        
        setOnlineUsers(currentOnlineUsers)
        setTypingUsers(typingState)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({ 
            isTyping: false, 
            username: user.username,
            lastActive: Date.now(),
            avatarColor: avatarColor
          })
        }
      })

    channelRef.current = channel
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return

    const messageData = {
      content: content.trim(),
      user_id: user.id,
      reply_to: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        user_name: replyingTo.user_profiles?.username || ''
      } : null
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
        setShowCopyNotification(true)
        setTimeout(() => setShowCopyNotification(false), 2000)
      })
      .catch(err => console.error('Failed to copy:', err))
  }

  const handleTyping = () => {
    if (!user || !channelRef.current) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    channelRef.current.track({ 
      isTyping: true, 
      username: user.username,
      lastActive: Date.now(),
      avatarColor
    })

    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ 
        isTyping: false, 
        username: user.username,
        lastActive: Date.now(),
        avatarColor
      })
    }, 3000)
  }

  const handleSaveSettings = async () => {
    if (!user) return

    try {
      // First update the database
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: tempUsername,
          avatar_color: tempAvatarColor
        })
        .eq('user_id', user.id)

      if (error) throw error

      // After successful database update, update local state
      setUser(prev => prev ? {
        ...prev,
        username: tempUsername
      } : null)
      setAvatarColor(tempAvatarColor)
      
      // Update theme
      setTheme(tempTheme)
      localStorage.setItem('theme', tempTheme)
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(tempTheme)

      // Update locale if changed
      if (tempLocale !== router.locale) {
        router.push(router.pathname, router.pathname, { locale: tempLocale })
      }

      // Update presence channel with new info
      channelRef.current?.track({ 
        isTyping: false, 
        username: tempUsername,
        lastActive: Date.now(),
        avatarColor: tempAvatarColor
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
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const moreMessages = await fetchMessages(messages.length)
      setMessages(prevMessages => [...moreMessages, ...prevMessages])
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (!user) return <Login onLogin={setUser} />

  return (
    <div className="flex h-screen chat-container overflow-x-hidden">
      {showCopyNotification && (
        <div className="fixed md:top-4 top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-secondary)] px-4 py-2 rounded-lg shadow-lg border border-[var(--border-color)]">
          <span className="text-sm text-[var(--text-primary)]">
            {t('messageCopied')}
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
        user={user}
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
          messages={messages}
          onReply={setReplyingTo}
          onCopy={handleCopy}
          onLoadMore={loadMoreMessages}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
        />

        <div className="relative z-20">
          <MessageInput
            user={user}
            onSendMessage={handleSendMessage}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onTyping={handleTyping}
            theme={theme}
            typingUsers={typingUsers}
          />
        </div>
      </div>

      <RightSidebar
        className="w-64 flex-shrink-0 fixed right-0 top-0 bottom-0 md:block hidden"
        currentUser={user}
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