import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

interface LoginProps {
  onLogin: (user: { id: string; email: string; username: string; avatarColor?: string }) => void
}

export default function Login({ onLogin }: LoginProps) {
  const router = useRouter()
  const { t, i18n } = useTranslation('common')
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (router.locale) {
      i18n.changeLanguage(router.locale)
    }
  }, [router.locale, i18n])

  const changeLanguage = async (lng: string) => {
    await router.push(router.pathname, router.pathname, { locale: lng })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegistering) {
        // Register new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) {
          // Handle registration specific errors
          if (authError.message.includes('duplicate key')) {
            setError('emailInUse')
            return
          }
          if (authError.message.includes('password')) {
            setError('weakPassword')
            return
          }
          if (authError.message.includes('email')) {
            setError('invalidEmail')
            return
          }
          if (authError.message.includes('registered')) {
            setError('usernameInUse')
            return
          }
          setError('unknownError')
          return
        }

        if (authData.user) {
          // Store additional user data in a custom table
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
              {
                user_id: authData.user.id,
                username,
                email,
                avatar_color: '#3B82F6'
              },
            ])

          if (profileError) {
            // Handle profile creation errors
            if (profileError.message.includes('duplicate key')) {
              if (profileError.message.includes('username')) {
                setError('duplicateUsername')
              } else if (profileError.message.includes('email')) {
                setError('duplicateEmail')
              } else {
                setError('databaseError')
              }
              return
            }
            
            if (profileError.message.includes('invalid_username')) {
              setError('invalidUsername')
              return
            }
            
            if (profileError.message.includes('username_length')) {
              if (username.length > 30) {
                setError('usernameTooLong')
              } else {
                setError('usernameTooShort')
              }
              return
            }
            
            setError('databaseError')
            return
          }

          // Call onLogin directly with the form data
          onLogin({
            id: authData.user.id,
            email: authData.user.email!,
            username: username,
            avatarColor: '#3B82F6'
          })
        }
      } else {
        // Login existing user
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          // Handle login specific errors
          if (authError.message === 'Invalid login credentials') {
            setError('incorrectCredentials')
            return
          }
          if (authError.message.includes('email')) {
            setError('invalidEmail')
            return
          }
          setError('unknownError')
          return
        }

        if (authData.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('username, avatar_color')
            .eq('user_id', authData.user.id)
            .single()

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              setError('userNotFound')
              return
            }
            setError('unknownError')
            return
          }

          if (!profileData) {
            setError('userNotFound')
            return
          }

          onLogin({
            id: authData.user.id,
            email: authData.user.email!,
            username: profileData.username,
            avatarColor: profileData.avatar_color || '#3B82F6'
          })
        }
      }
    } catch (err: any) {
      // Log the original error for debugging
      console.error('Original error:', err)
      setError('unknownError')
    } finally {
      setLoading(false)
    }
  }

  // Add this function to clear all input fields
  const clearInputFields = () => {
    setEmail('')
    setPassword('')
    setUsername('')
    setError('')
  }

  // Update the switch button click handler
  const handleSwitchMode = () => {
    clearInputFields() // Clear all fields when switching modes
    setIsRegistering(!isRegistering)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-container">
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg login-box">
        <div className="flex justify-end">
          <select
            onChange={(e) => changeLanguage(e.target.value)}
            value={router.locale}
            className="rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 language-select"
            title={t('switchLanguage')}
          >
            <option value="en">English</option>
            <option value="zh-TW">繁體中文</option>
            <option value="zh-CN">简体中文</option>
            <option value="ja">日本語</option>
          </select>
        </div>
        <div>
          <h2 className="text-center text-3xl font-extrabold login-title">
            {isRegistering ? t('createNewAccount') : t('welcomeBack')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded p-3 text-sm">
              {t(error)}
            </div>
          )}
          
          {isRegistering && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium login-label">
                {t('username')} <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-md focus:outline-none focus:border-blue-500 login-input"
                placeholder={t('username')}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium login-label">
              {t('email')} {isRegistering && <span className="text-red-500">*</span>}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md focus:outline-none focus:border-blue-500 login-input"
              placeholder={t('email')}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium login-label">
              {t('password')} {isRegistering && <span className="text-red-500">*</span>}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-md focus:outline-none focus:border-blue-500 login-input"
              placeholder={t('password')}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? t('loading') : isRegistering ? t('register') : t('signIn')}
            </button>
          </div>

          {isRegistering && (
            <p className="text-xs text-center login-text">
              {t('agreeToTerms')}
            </p>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={handleSwitchMode}
              className="text-blue-400 hover:text-blue-500"
            >
              {isRegistering ? t('alreadyHaveAccount') : t('needAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 