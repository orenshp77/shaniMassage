import './AnimatedBackgrounds.css'

// Theme configurations - Professional themes for customer service center
export const THEMES = {
  // Animated themes
  hitech: {
    id: 'hitech',
    name: 'הייטק',
    icon: '💻',
    category: 'animated'
  },
  success: {
    id: 'success',
    name: 'הצלחה',
    icon: '✓',
    category: 'animated'
  },
  alert: {
    id: 'alert',
    name: 'התראה',
    icon: '⚡',
    category: 'animated'
  },
  celebration: {
    id: 'celebration',
    name: 'חגיגה',
    icon: '🎉',
    category: 'animated'
  },
  focus: {
    id: 'focus',
    name: 'ריכוז',
    icon: '🎯',
    category: 'animated'
  },
  calm: {
    id: 'calm',
    name: 'רגוע',
    icon: '🌊',
    category: 'animated'
  },
  birthday: {
    id: 'birthday',
    name: 'יום הולדת',
    icon: '🎂',
    category: 'animated'
  },
  love: {
    id: 'love',
    name: 'אהבה',
    icon: '💕',
    category: 'animated'
  },
  gifts: {
    id: 'gifts',
    name: 'מתנות',
    icon: '🎁',
    category: 'animated'
  },
  confettiExplosion: {
    id: 'confettiExplosion',
    name: 'קונפטי',
    icon: '🎊',
    category: 'animated'
  },
  redHearts: {
    id: 'redHearts',
    name: 'לבבות',
    icon: '❤️',
    category: 'animated'
  },
  // Solid color themes (no animation)
  solidBlue: {
    id: 'solidBlue',
    name: 'כחול',
    icon: '',
    category: 'solid',
    color: '#1a365d'
  },
  solidGreen: {
    id: 'solidGreen',
    name: 'ירוק',
    icon: '',
    category: 'solid',
    color: '#1a4d2e'
  },
  solidPurple: {
    id: 'solidPurple',
    name: 'סגול',
    icon: '',
    category: 'solid',
    color: '#2d1b4e'
  },
  solidDark: {
    id: 'solidDark',
    name: 'כהה',
    icon: '',
    category: 'solid',
    color: '#1a1a2e'
  }
}

// Hi-Tech Background - Original vibrant design with cyan, purple, pink particles
function HitechBackground() {
  const colors = [
    { color: 'rgba(0, 255, 255, 0.8)', shadow: 'rgba(0, 255, 255, 0.6)' },   // Cyan
    { color: 'rgba(138, 43, 226, 0.8)', shadow: 'rgba(138, 43, 226, 0.6)' }, // Purple
    { color: 'rgba(255, 0, 128, 0.8)', shadow: 'rgba(255, 0, 128, 0.6)' },   // Pink
    { color: 'rgba(0, 200, 255, 0.8)', shadow: 'rgba(0, 200, 255, 0.6)' },   // Light Cyan
    { color: 'rgba(180, 100, 255, 0.8)', shadow: 'rgba(180, 100, 255, 0.6)' } // Light Purple
  ]

  return (
    <div className="animated-bg-container hitech-bg-original">
      <div className="hitech-breathing-gradient" />
      {[...Array(50)].map((_, i) => {
        const colorSet = colors[i % colors.length]
        return (
          <div
            key={i}
            className="hitech-particle-original"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: colorSet.color,
              boxShadow: `0 0 15px ${colorSet.shadow}, 0 0 30px ${colorSet.shadow}`,
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        )
      })}
    </div>
  )
}

// Success Background - Green tones with upward movement
function SuccessBackground() {
  return (
    <div className="animated-bg-container success-bg">
      <div className="success-gradient" />
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="success-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${3 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
      <div className="success-glow" />
    </div>
  )
}

// Alert Background - Orange/Red urgent tones
function AlertBackground() {
  return (
    <div className="animated-bg-container alert-bg">
      <div className="alert-gradient" />
      <div className="alert-pulse" />
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="alert-line"
          style={{
            top: `${Math.random() * 100}%`,
            animationDuration: `${1 + Math.random() * 1}s`,
            animationDelay: `${Math.random() * 1}s`
          }}
        />
      ))}
    </div>
  )
}

// Celebration Background - Professional confetti
function CelebrationBackground() {
  return (
    <div className="animated-bg-container celebration-bg">
      <div className="celebration-gradient" />
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="celebration-particle"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#ffd700', '#00d4aa', '#4a90d9', '#9b59b6'][Math.floor(Math.random() * 4)],
            animationDuration: `${3 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 3}s`
          }}
        />
      ))}
      <div className="celebration-shimmer" />
    </div>
  )
}

// Focus Background - Clean, minimal with subtle pulse
function FocusBackground() {
  return (
    <div className="animated-bg-container focus-bg">
      <div className="focus-gradient" />
      <div className="focus-ring ring-1" />
      <div className="focus-ring ring-2" />
      <div className="focus-ring ring-3" />
    </div>
  )
}

// Calm Background - Gentle waves
function CalmBackground() {
  return (
    <div className="animated-bg-container calm-bg">
      <div className="calm-gradient" />
      <div className="calm-wave wave-1" />
      <div className="calm-wave wave-2" />
      <div className="calm-wave wave-3" />
    </div>
  )
}

// Birthday Background - Colorful confetti and balloons
function BirthdayBackground() {
  const confettiColors = [
    '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d',
    '#c44dff', '#ff914d', '#00d4aa', '#ff4757', '#2ed573'
  ]

  return (
    <div className="animated-bg-container birthday-bg">
      <div className="birthday-gradient" />
      {/* Confetti pieces */}
      {[...Array(60)].map((_, i) => (
        <div
          key={`confetti-${i}`}
          className={`birthday-confetti confetti-${i % 3}`}
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: confettiColors[i % confettiColors.length],
            animationDuration: `${3 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`
          }}
        />
      ))}
      {/* Balloons */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`balloon-${i}`}
          className="birthday-balloon"
          style={{
            left: `${10 + i * 12}%`,
            backgroundColor: confettiColors[i % confettiColors.length],
            animationDelay: `${i * 0.5}s`
          }}
        />
      ))}
      <div className="birthday-sparkle" />
    </div>
  )
}

// Love Background - Pink with floating hearts
function LoveBackground() {
  return (
    <div className="animated-bg-container love-bg">
      <div className="love-gradient" />
      {/* Floating hearts */}
      {[...Array(30)].map((_, i) => (
        <div
          key={`heart-${i}`}
          className="love-heart"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${4 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 5}s`,
            fontSize: `${20 + Math.random() * 30}px`,
            opacity: 0.4 + Math.random() * 0.4
          }}
        >
          {['💕', '💖', '💗', '💓', '❤️'][i % 5]}
        </div>
      ))}
      <div className="love-shimmer" />
    </div>
  )
}

// Gifts Background - 3D rotating gift boxes on sides
function GiftsBackground() {
  const giftColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da']

  return (
    <div className="animated-bg-container gifts-bg">
      <div className="gifts-gradient" />
      {/* Left gift box */}
      <div className="gift-box gift-left">
        <div className="gift-cube" style={{ '--gift-color': giftColors[0], '--ribbon-color': '#ffd700' }}>
          <div className="gift-face gift-front"></div>
          <div className="gift-face gift-back"></div>
          <div className="gift-face gift-right"></div>
          <div className="gift-face gift-left-face"></div>
          <div className="gift-face gift-top"></div>
          <div className="gift-face gift-bottom"></div>
          <div className="gift-ribbon gift-ribbon-h"></div>
          <div className="gift-ribbon gift-ribbon-v"></div>
          <div className="gift-bow"></div>
        </div>
      </div>
      {/* Right gift box */}
      <div className="gift-box gift-right-box">
        <div className="gift-cube" style={{ '--gift-color': giftColors[1], '--ribbon-color': '#ff69b4' }}>
          <div className="gift-face gift-front"></div>
          <div className="gift-face gift-back"></div>
          <div className="gift-face gift-right"></div>
          <div className="gift-face gift-left-face"></div>
          <div className="gift-face gift-top"></div>
          <div className="gift-face gift-bottom"></div>
          <div className="gift-ribbon gift-ribbon-h"></div>
          <div className="gift-ribbon gift-ribbon-v"></div>
          <div className="gift-bow"></div>
        </div>
      </div>
      {/* Sparkles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="gift-sparkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`
          }}
        />
      ))}
    </div>
  )
}

// Confetti Explosion Background - 3D confetti from sides
function ConfettiExplosionBackground() {
  const confettiColors = [
    '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d',
    '#c44dff', '#ff914d', '#00d4aa', '#ff4757', '#2ed573'
  ]

  return (
    <div className="animated-bg-container confetti-explosion-bg">
      <div className="confetti-explosion-gradient" />
      {/* Left explosion */}
      <div className="confetti-cannon confetti-cannon-left">
        {[...Array(25)].map((_, i) => (
          <div
            key={`left-${i}`}
            className="confetti-piece confetti-from-left"
            style={{
              backgroundColor: confettiColors[i % confettiColors.length],
              animationDelay: `${Math.random() * 2}s`,
              '--end-x': `${50 + Math.random() * 50}vw`,
              '--end-y': `${-20 + Math.random() * 140}vh`,
              '--rotate': `${Math.random() * 1080}deg`
            }}
          />
        ))}
      </div>
      {/* Right explosion */}
      <div className="confetti-cannon confetti-cannon-right">
        {[...Array(25)].map((_, i) => (
          <div
            key={`right-${i}`}
            className="confetti-piece confetti-from-right"
            style={{
              backgroundColor: confettiColors[i % confettiColors.length],
              animationDelay: `${Math.random() * 2}s`,
              '--end-x': `${-50 - Math.random() * 50}vw`,
              '--end-y': `${-20 + Math.random() * 140}vh`,
              '--rotate': `${-Math.random() * 1080}deg`
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Red Hearts Background - Red gradient with 3D rotating hearts on sides
function RedHeartsBackground() {
  return (
    <div className="animated-bg-container red-hearts-bg">
      <div className="red-hearts-gradient" />
      {/* Left 3D heart */}
      <div className="heart-3d heart-3d-left">
        <div className="heart-shape">❤️</div>
      </div>
      {/* Right 3D heart */}
      <div className="heart-3d heart-3d-right">
        <div className="heart-shape">❤️</div>
      </div>
      {/* Floating small hearts */}
      {[...Array(15)].map((_, i) => (
        <div
          key={`small-heart-${i}`}
          className="small-floating-heart"
          style={{
            left: `${10 + Math.random() * 80}%`,
            animationDuration: `${5 + Math.random() * 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            fontSize: `${12 + Math.random() * 18}px`
          }}
        >
          ❤️
        </div>
      ))}
      <div className="red-shimmer" />
    </div>
  )
}

// Solid Color Backgrounds (no animation)
function SolidBackground({ color }) {
  return (
    <div
      className="animated-bg-container solid-bg"
      style={{ background: color }}
    />
  )
}

// Main component that renders the selected background
function AnimatedBackground({ theme = 'hitech' }) {
  const themeConfig = THEMES[theme]

  // Handle solid color themes
  if (themeConfig?.category === 'solid') {
    return <SolidBackground color={themeConfig.color} />
  }

  const backgrounds = {
    hitech: HitechBackground,
    success: SuccessBackground,
    alert: AlertBackground,
    celebration: CelebrationBackground,
    focus: FocusBackground,
    calm: CalmBackground,
    birthday: BirthdayBackground,
    love: LoveBackground,
    gifts: GiftsBackground,
    confettiExplosion: ConfettiExplosionBackground,
    redHearts: RedHeartsBackground
  }

  const BackgroundComponent = backgrounds[theme] || HitechBackground

  return <BackgroundComponent />
}

export default AnimatedBackground
