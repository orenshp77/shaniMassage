import { useEffect, useState } from 'react'
import './AnimatedBackgrounds.css'

// Theme configurations
export const THEMES = {
  hitech: {
    id: 'hitech',
    name: 'הייטק',
    icon: '💻',
    description: 'טכנולוגי ומודרני'
  },
  love: {
    id: 'love',
    name: 'אהבה',
    icon: '❤️',
    description: 'רומנטי וחם'
  },
  food: {
    id: 'food',
    name: 'אוכל',
    icon: '🍕',
    description: 'טעים ומזין'
  },
  coffee: {
    id: 'coffee',
    name: 'הפסקת קפה',
    icon: '☕',
    description: 'רגוע ונעים'
  },
  racing: {
    id: 'racing',
    name: 'מירוצים',
    icon: '🏎️',
    description: 'מהיר ומרגש'
  },
  victory: {
    id: 'victory',
    name: 'ניצחנו!',
    icon: '🏆',
    description: 'חגיגי ומנצח'
  },
  managerLove: {
    id: 'managerLove',
    name: 'המנהלת אוהבת',
    icon: '👩‍💼💕',
    description: 'חיובי ומעודד'
  },
  managerSad: {
    id: 'managerSad',
    name: 'המנהלת מאוכזבת',
    icon: '👩‍💼😔',
    description: 'רציני ומחשבתי'
  },
  beach: {
    id: 'beach',
    name: 'חוף הים',
    icon: '🏖️',
    description: 'רגוע וקיצי'
  },
  sports: {
    id: 'sports',
    name: 'ספורט',
    icon: '⚽',
    description: 'אנרגטי ופעיל'
  }
}

// Hi-Tech Background
function HitechBackground() {
  return (
    <div className="animated-bg-container hitech-bg">
      {/* Matrix-like falling code */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="code-rain"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 2}s`
          }}
        >
          {['0', '1', '<', '>', '/', '{', '}', '(', ')'][Math.floor(Math.random() * 9)]}
        </div>
      ))}
      {/* Glowing circuits */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`circuit-${i}`}
          className="circuit-line"
          style={{
            top: `${10 + i * 12}%`,
            animationDelay: `${i * 0.3}s`
          }}
        />
      ))}
      {/* Floating tech icons */}
      {['💻', '🖥️', '📱', '⚙️', '🔧', '💡'].map((icon, i) => (
        <div
          key={`tech-${i}`}
          className="floating-tech-icon"
          style={{
            left: `${10 + i * 15}%`,
            animationDelay: `${i * 0.5}s`
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  )
}

// Love Background
function LoveBackground() {
  return (
    <div className="animated-bg-container love-bg">
      {/* Floating hearts */}
      {[...Array(25)].map((_, i) => (
        <div
          key={i}
          className="floating-heart"
          style={{
            left: `${Math.random() * 100}%`,
            fontSize: `${20 + Math.random() * 40}px`,
            animationDuration: `${4 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 3}s`
          }}
        >
          {['❤️', '💕', '💖', '💗', '💓', '💘'][Math.floor(Math.random() * 6)]}
        </div>
      ))}
      {/* Sparkles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="sparkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }}
        >
          ✨
        </div>
      ))}
    </div>
  )
}

// Food Background
function FoodBackground() {
  const foods = ['🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩', '🍪', '🎂', '🍰', '🥗', '🍜', '🍝', '🍣', '🍤']
  return (
    <div className="animated-bg-container food-bg">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="floating-food"
          style={{
            left: `${Math.random() * 100}%`,
            fontSize: `${30 + Math.random() * 30}px`,
            animationDuration: `${5 + Math.random() * 5}s`,
            animationDelay: `${Math.random() * 3}s`
          }}
        >
          {foods[Math.floor(Math.random() * foods.length)]}
        </div>
      ))}
      {/* Steam effects */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`steam-${i}`}
          className="steam"
          style={{
            left: `${10 + i * 12}%`,
            animationDelay: `${i * 0.4}s`
          }}
        />
      ))}
    </div>
  )
}

// Coffee Background
function CoffeeBackground() {
  return (
    <div className="animated-bg-container coffee-bg">
      {/* Coffee cups */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="floating-coffee"
          style={{
            left: `${Math.random() * 100}%`,
            fontSize: `${35 + Math.random() * 25}px`,
            animationDuration: `${6 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 3}s`
          }}
        >
          {['☕', '🍵', '🧋'][Math.floor(Math.random() * 3)]}
        </div>
      ))}
      {/* Rising steam */}
      {[...Array(15)].map((_, i) => (
        <div
          key={`steam-${i}`}
          className="coffee-steam"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
      {/* Coffee beans */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`bean-${i}`}
          className="coffee-bean"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`
          }}
        >
          🫘
        </div>
      ))}
    </div>
  )
}

// Racing Background
function RacingBackground() {
  return (
    <div className="animated-bg-container racing-bg">
      {/* Speed lines */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="speed-line"
          style={{
            top: `${Math.random() * 100}%`,
            animationDuration: `${0.3 + Math.random() * 0.5}s`,
            animationDelay: `${Math.random() * 1}s`
          }}
        />
      ))}
      {/* Racing cars */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`car-${i}`}
          className="racing-car"
          style={{
            top: `${15 + i * 18}%`,
            animationDuration: `${1.5 + Math.random() * 1}s`,
            animationDelay: `${i * 0.3}s`
          }}
        >
          🏎️
        </div>
      ))}
      {/* Checkered flags */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`flag-${i}`}
          className="checkered-flag"
          style={{
            left: `${10 + i * 16}%`,
            animationDelay: `${i * 0.2}s`
          }}
        >
          🏁
        </div>
      ))}
    </div>
  )
}

// Victory Background
function VictoryBackground() {
  return (
    <div className="animated-bg-container victory-bg">
      {/* Confetti */}
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ffa500'][Math.floor(Math.random() * 6)],
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
      {/* Trophies and medals */}
      {['🏆', '🥇', '🥈', '🥉', '🎖️', '🏅'].map((icon, i) => (
        <div
          key={`trophy-${i}`}
          className="floating-trophy"
          style={{
            left: `${5 + i * 16}%`,
            animationDelay: `${i * 0.3}s`
          }}
        >
          {icon}
        </div>
      ))}
      {/* Fireworks */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`firework-${i}`}
          className="firework"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 50}%`,
            animationDelay: `${Math.random() * 2}s`
          }}
        >
          🎆
        </div>
      ))}
    </div>
  )
}

// Manager Love Background
function ManagerLoveBackground() {
  return (
    <div className="animated-bg-container manager-love-bg">
      {/* Positive emojis */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="floating-positive"
          style={{
            left: `${Math.random() * 100}%`,
            fontSize: `${25 + Math.random() * 30}px`,
            animationDuration: `${4 + Math.random() * 4}s`,
            animationDelay: `${Math.random() * 3}s`
          }}
        >
          {['⭐', '🌟', '💫', '✨', '💖', '🌈', '🦋', '🌸'][Math.floor(Math.random() * 8)]}
        </div>
      ))}
      {/* Thumbs up */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`thumb-${i}`}
          className="floating-thumb"
          style={{
            left: `${10 + i * 12}%`,
            animationDelay: `${i * 0.4}s`
          }}
        >
          👍
        </div>
      ))}
      {/* Glowing orbs */}
      {[...Array(10)].map((_, i) => (
        <div
          key={`orb-${i}`}
          className="glow-orb positive"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  )
}

// Manager Sad Background
function ManagerSadBackground() {
  return (
    <div className="animated-bg-container manager-sad-bg">
      {/* Rain drops */}
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="rain-drop"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
            animationDelay: `${Math.random() * 1}s`
          }}
        />
      ))}
      {/* Clouds */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`cloud-${i}`}
          className="sad-cloud"
          style={{
            left: `${i * 22}%`,
            animationDelay: `${i * 0.5}s`
          }}
        >
          ☁️
        </div>
      ))}
      {/* Thinking emoji */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`think-${i}`}
          className="floating-think"
          style={{
            left: `${10 + i * 15}%`,
            animationDelay: `${i * 0.6}s`
          }}
        >
          🤔
        </div>
      ))}
    </div>
  )
}

// Beach Background
function BeachBackground() {
  return (
    <div className="animated-bg-container beach-bg">
      {/* Waves */}
      <div className="wave wave1" />
      <div className="wave wave2" />
      <div className="wave wave3" />
      {/* Sun */}
      <div className="beach-sun">☀️</div>
      {/* Beach items */}
      {['🏖️', '🌴', '🐚', '🦀', '🐠', '🌊', '⛱️', '🩴'].map((icon, i) => (
        <div
          key={`beach-${i}`}
          className="floating-beach-item"
          style={{
            left: `${5 + i * 12}%`,
            animationDelay: `${i * 0.4}s`
          }}
        >
          {icon}
        </div>
      ))}
      {/* Seagulls */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`bird-${i}`}
          className="seagull"
          style={{
            top: `${10 + i * 8}%`,
            animationDelay: `${i * 0.8}s`
          }}
        >
          🐦
        </div>
      ))}
    </div>
  )
}

// Sports Background
function SportsBackground() {
  const sports = ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🎿']
  return (
    <div className="animated-bg-container sports-bg">
      {/* Bouncing balls */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="bouncing-ball"
          style={{
            left: `${Math.random() * 100}%`,
            fontSize: `${30 + Math.random() * 30}px`,
            animationDuration: `${1 + Math.random() * 1}s`,
            animationDelay: `${Math.random() * 2}s`
          }}
        >
          {sports[Math.floor(Math.random() * sports.length)]}
        </div>
      ))}
      {/* Energy lines */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`energy-${i}`}
          className="energy-line"
          style={{
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
      {/* Athletes */}
      {['🏃', '🏊', '🚴', '🤸', '⛹️'].map((icon, i) => (
        <div
          key={`athlete-${i}`}
          className="floating-athlete"
          style={{
            left: `${10 + i * 18}%`,
            animationDelay: `${i * 0.5}s`
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  )
}

// Main component that renders the selected background
function AnimatedBackground({ theme = 'hitech' }) {
  const backgrounds = {
    hitech: HitechBackground,
    love: LoveBackground,
    food: FoodBackground,
    coffee: CoffeeBackground,
    racing: RacingBackground,
    victory: VictoryBackground,
    managerLove: ManagerLoveBackground,
    managerSad: ManagerSadBackground,
    beach: BeachBackground,
    sports: SportsBackground
  }

  const BackgroundComponent = backgrounds[theme] || HitechBackground

  return <BackgroundComponent />
}

export default AnimatedBackground
