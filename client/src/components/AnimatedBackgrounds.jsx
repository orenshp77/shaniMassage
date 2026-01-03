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
    birthday: BirthdayBackground
  }

  const BackgroundComponent = backgrounds[theme] || HitechBackground

  return <BackgroundComponent />
}

export default AnimatedBackground
