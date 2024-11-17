import { useTranslation } from 'next-i18next'

export default function LoadingScreen() {
  const { t } = useTranslation('common')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 loading-container">
      {/* Loading animation */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl animate-pulse">
            <div className="w-full h-full bg-blue-500 rounded-2xl animate-ping opacity-75"></div>
          </div>
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i}
            className="absolute inset-0 animate-spin" 
            style={{ animationDuration: '3s', animationDelay: `${-i}s` }}
          >
            <div className={`absolute ${
              i === 0 ? 'top-0 left-1/2 -translate-x-1/2' :
              i === 1 ? 'bottom-0 left-1/2 -translate-x-1/2' :
              i === 2 ? 'left-0 top-1/2 -translate-y-1/2' :
              'right-0 top-1/2 -translate-y-1/2'
            } w-3 h-3`}>
              <div className="w-full h-full loading-dot rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading text */}
      <div className="mt-8 text-lg font-medium relative loading-text">
        <span className="inline-block">
          {t('loading')}
        </span>
        <span className="inline-flex ml-1">
          <span className="animate-bounce delay-0 mx-0.5">.</span>
          <span className="animate-bounce delay-100 mx-0.5">.</span>
          <span className="animate-bounce delay-200 mx-0.5">.</span>
        </span>
      </div>
      
      {/* Connecting message */}
      <div className="mt-4 text-sm animate-pulse loading-subtext">
        {t('connectingToChat')}
      </div>
    </div>
  )
} 