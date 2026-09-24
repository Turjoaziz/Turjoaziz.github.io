import { useEffect, useRef, useState, useCallback } from 'react'

// ── Custom Cursor ──────────────────────────────────────────────
function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const raf = useRef<number>(0)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (dot.current) {
        dot.current.style.left = `${e.clientX}px`
        dot.current.style.top = `${e.clientY}px`
      }
    }
    const hover = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      const isHoverable = el.closest('a, button, [data-hover]')
      dot.current?.classList.toggle('hovered', !!isHoverable)
      ring.current?.classList.toggle('hovered', !!isHoverable)
    }
    const animate = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.12
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.12
      if (ring.current) {
        ring.current.style.left = `${ringPos.current.x}px`
        ring.current.style.top = `${ringPos.current.y}px`
      }
      raf.current = requestAnimationFrame(animate)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', hover)
    raf.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', hover)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  )
}

// ── Text Scramble ──────────────────────────────────────────────
function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text)
  const chars = '!<>-_\\/[]{}—=+*^?#@$%&'
  const raf = useRef<number>(0)

  const scramble = useCallback(() => {
    let iteration = 0
    cancelAnimationFrame(raf.current)
    const animate = () => {
      setDisplay(
        text
          .split('')
          .map((char, idx) => {
            if (char === ' ') return ' '
            if (idx < iteration) return text[idx]
            return chars[Math.floor(Math.random() * chars.length)]
          })
          .join('')
      )
      if (iteration < text.length) {
        iteration += 0.4
        raf.current = requestAnimationFrame(animate)
      }
    }
    raf.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf.current)
  }, [text])

  useEffect(() => {
    const cleanup = scramble()
    return cleanup
  }, [scramble])

  return (
    <span className={className} onMouseEnter={scramble} style={{ fontFamily: 'inherit' }}>
      {display}
    </span>
  )
}

// ── Typewriter ─────────────────────────────────────────────────
function Typewriter({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[idx]
    const speed = deleting ? 40 : 90
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1))
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), 1800)
      } else {
        setText(word.slice(0, text.length - 1))
        if (text.length === 0) {
          setDeleting(false)
          setIdx((i) => (i + 1) % words.length)
        }
      }
    }, speed)
    return () => clearTimeout(timeout)
  }, [text, deleting, idx, words])

  return (
    <span>
      <span className="text-gradient">{text}</span>
      <span className="blink" style={{ color: '#00ff87' }}>|</span>
    </span>
  )
}

// ── Scroll Reveal ──────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ── Counter ────────────────────────────────────────────────────
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        let start = 0
        const step = Math.ceil(target / 60)
        const timer = setInterval(() => {
          start += step
          if (start >= target) { setCount(target); clearInterval(timer) }
          else setCount(start)
        }, 20)
      }
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

// ── Tilt Card ──────────────────────────────────────────────────
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const card = useRef<HTMLDivElement>(null)

  const handleMove = (e: React.MouseEvent) => {
    const rect = card.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16
    card.current!.style.transform = `perspective(700px) rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`
  }
  const handleLeave = () => {
    card.current!.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) scale(1)'
  }

  return (
    <div
      ref={card}
      className={`tilt-card ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  )
}

// ── Globe with London Pin ──────────────────────────────────────
function GlobeLondon() {
  const uid = Math.random().toString(36).slice(2, 7)
  const ids = { clip: `gc-${uid}`, grad: `gg-${uid}`, atm: `atm-${uid}`, spec: `spec-${uid}`, beam: `beam-${uid}` }
  const size = 160
  const cx = 80, cy = 80, r = 68

  // London: 51.5°N 0°W projected onto front-facing globe
  const latRad = (51.5 * Math.PI) / 180
  const pinX = cx // lon=0, so no x offset
  const pinY = cy - r * Math.sin(latRad)

  // Latitude ellipses
  const latDegs = [-60, -30, 0, 30, 60]
  // Longitude ellipses (as flat ellipses with rx proportional to cos(lon))
  const lonDegs = [-75, -45, -15, 15, 45, 75]

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      fill="none" xmlns="http://www.w3.org/2000/svg"
      onClick={() => window.open('https://www.google.com/maps/place/London,+UK', '_blank', 'noopener,noreferrer')}
      data-hover
      style={{ cursor: 'pointer', display: 'block', filter: 'drop-shadow(0 0 18px rgba(0,255,135,0.18))' }}
    >
      <defs>
        <clipPath id={ids.clip}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>

        {/* Deep space radial gradient */}
        <radialGradient id={ids.grad} cx="38%" cy="32%" r="70%">
          <stop offset="0%"   stopColor="#0d2b1f" />
          <stop offset="45%"  stopColor="#061510" />
          <stop offset="100%" stopColor="#020808" />
        </radialGradient>

        {/* Atmosphere glow gradient */}
        <radialGradient id={ids.atm} cx="50%" cy="50%" r="50%">
          <stop offset="75%"  stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,255,135,0.18)" />
        </radialGradient>

        {/* Specular highlight */}
        <radialGradient id={ids.spec} cx="33%" cy="28%" r="45%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.09)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Scanline gradient for the rotating beam */}
        <linearGradient id={ids.beam} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(0,255,135,0)" />
          <stop offset="50%"  stopColor="rgba(0,255,135,0.12)" />
          <stop offset="100%" stopColor="rgba(0,255,135,0)" />
        </linearGradient>
      </defs>

      {/* Outer atmosphere halo */}
      <circle cx={cx} cy={cy} r={r + 8} fill={`url(#${ids.atm})`} />

      {/* Globe base */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${ids.grad})`} />

      {/* Clipped grid */}
      <g clipPath={`url(#${ids.clip})`}>

        {/* Latitude bands — subtle fill alternation */}
        {latDegs.map((deg, i) => {
          const a = (deg * Math.PI) / 180
          const ry = Math.abs(r * Math.cos(a)) * 0.3
          const ey = cy - r * Math.sin(a)
          return (
            <ellipse key={`lat-${i}`}
              cx={cx} cy={ey} rx={r} ry={ry}
              stroke="rgba(0,255,135,0.22)" strokeWidth="0.7" fill="none"
              strokeDasharray="3 4"
            />
          )
        })}

        {/* Equator — brighter solid */}
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.3}
          stroke="rgba(0,255,135,0.5)" strokeWidth="0.9" fill="none" />

        {/* Prime meridian (lon=0) */}
        <ellipse cx={cx} cy={cy} rx={r * 0.04} ry={r}
          stroke="rgba(0,255,135,0.5)" strokeWidth="0.9" fill="none" />

        {/* Other longitude ellipses */}
        {lonDegs.map((deg, i) => {
          const a = (deg * Math.PI) / 180
          const rx2 = Math.abs(r * Math.cos(a)) * 0.22
          const ex = cx + r * Math.sin(a)
          return (
            <ellipse key={`lon-${i}`}
              cx={ex} cy={cy} rx={rx2} ry={r}
              stroke="rgba(0,255,135,0.15)" strokeWidth="0.6" fill="none"
              strokeDasharray="2 5"
            />
          )
        })}

        {/* Rotating scan beam */}
        <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={`url(#${ids.beam})`}>
          <animateTransform
            attributeName="transform" type="rotate"
            from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`}
            dur="8s" repeatCount="indefinite"
          />
        </rect>

        {/* Inner glow ring near equator */}
        <ellipse cx={cx} cy={cy} rx={r * 0.55} ry={r * 0.16}
          stroke="rgba(0,255,135,0.08)" strokeWidth="6" fill="none" />
      </g>

      {/* Specular sheen on top-left */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${ids.spec})`} />

      {/* Crisp border with subtle glow */}
      <circle cx={cx} cy={cy} r={r}
        stroke="rgba(0,255,135,0.45)" strokeWidth="1.2" fill="none" />
      <circle cx={cx} cy={cy} r={r + 1.5}
        stroke="rgba(0,255,135,0.08)" strokeWidth="2" fill="none" />

      {/* London pin — triple pulse rings */}
      <circle cx={pinX} cy={pinY} r={3} fill="rgba(0,255,135,0.08)">
        <animate attributeName="r"       values="3;14;3"           dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0;0.35"      dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={pinX} cy={pinY} r={3} fill="rgba(0,255,135,0.12)">
        <animate attributeName="r"       values="3;9;3"            dur="3s" begin="0.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4"        dur="3s" begin="0.5s" repeatCount="indefinite" />
      </circle>

      {/* Pin dot */}
      <circle cx={pinX} cy={pinY} r={3} fill="#00ff87">
        <animate attributeName="r" values="3;3.6;3" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Pin stem + head */}
      <line x1={pinX} y1={pinY - 3} x2={pinX} y2={pinY - 13}
        stroke="#00ff87" strokeWidth="1" strokeLinecap="round" />
      <circle cx={pinX} cy={pinY - 15} r={3.5} fill="#00ff87" />
      <circle cx={pinX} cy={pinY - 15} r={1.5} fill="#080808" />

      {/* LONDON label */}
      <rect x={pinX + 6} y={pinY - 22} width={44} height={12} rx={2}
        fill="rgba(0,255,135,0.1)" stroke="rgba(0,255,135,0.3)" strokeWidth="0.6" />
      <text x={pinX + 9} y={pinY - 13}
        fill="#00ff87" fontSize="6.5"
        fontFamily="JetBrains Mono, monospace" letterSpacing="1.2"
        fontWeight="500"
      >
        LONDON
      </text>

      {/* "Open map" hint arc at bottom */}
      <text x={cx} y={cy + r - 8}
        fill="rgba(0,255,135,0.35)" fontSize="5"
        fontFamily="JetBrains Mono, monospace" letterSpacing="1.5"
        textAnchor="middle"
      >
        CLICK · OPEN MAP
      </text>
    </svg>
  )
}

// ── Particle Canvas ────────────────────────────────────────────
function ParticleCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    let w = (c.width = window.innerWidth)
    let h = (c.height = window.innerHeight)

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.35 + 0.1,
    }))

    let mx = -1000, my = -1000
    const onMouse = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', onMouse)
    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight }
    window.addEventListener('resize', resize)

    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        const dx = p.x - mx, dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) { p.vx += dx / dist * 0.08; p.vy += dy / dist * 0.08 }
        p.vx *= 0.98; p.vy *= 0.98
        p.x = (p.x + p.vx + w) % w
        p.y = (p.y + p.vy + h) % h
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,135,${p.alpha})`
        ctx.fill()
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0,255,135,${0.07 * (1 - d / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvas} className="absolute inset-0 w-full h-full pointer-events-none" />
}

// ── Real Data ──────────────────────────────────────────────────
const GITHUB_AVATAR = 'https://avatars.githubusercontent.com/u/197599230?v=4'
const AVATAR = GITHUB_AVATAR

const projects = [
  {
    title: 'AI Traffic Control for Dhaka',
    tag: 'AI / Reinforcement Learning',
    desc: 'AI-driven traffic management for Dhaka City using Reinforcement Learning and SUMO simulation to reduce congestion through intelligent signal control.',
    tech: ['Python', 'SUMO', 'TraCI', 'DQN'],
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop&auto=format',
    color: '#00ff87',
    year: '2024',
    link: 'https://github.com/Turjoaziz/AI-Traffic-Dhaka',
  },
  {
    title: 'Tic-Tac-Toe Q-Learning',
    tag: 'Embedded AI / Arduino',
    desc: 'Tic Tac Toe powered by a Q-Learning AI agent running on Arduino Nano 33 BLE Sense with OLED display and gesture-based input sensor.',
    tech: ['C++', 'Arduino', 'Q-Learning', 'OLED'],
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop&auto=format',
    color: '#7b5ea7',
    year: '2024',
    link: 'https://github.com/Turjoaziz/tic-tac-toe-qlearning-arduino',
  },
  {
    title: 'Adda_Box',
    tag: 'Full-Stack / Real-Time',
    desc: 'Real-time chat platform built with Node.js, Express, Socket.IO, and MongoDB. Features JWT authentication and room-based messaging at scale.',
    tech: ['Node.js', 'Express', 'MongoDB', 'Socket.IO', 'JWT'],
    img: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=600&h=400&fit=crop&auto=format',
    color: '#ff006e',
    year: '2024',
    link: 'https://github.com/Turjoaziz/Adda_Box-Chat-App',
  },
  {
    title: 'Football Data Analytics',
    tag: 'Data Science / R',
    desc: 'R-based football match data analysis for Ulster University\'s COM692 module. Statistical modelling, data wrangling, and visual storytelling over match datasets.',
    tech: ['R', 'ggplot2', 'dplyr', 'Statistical Modelling'],
    img: 'https://images.unsplash.com/photo-1551958219-acbc630e2914?w=600&h=400&fit=crop&auto=format',
    color: '#ffbe0b',
    year: '2025',
    link: 'https://github.com/Turjoaziz/Football-Data-Analytics-Insights-from-the-English-Premier-League',
  },
]

const skills = [
  { name: 'Python & AI / ML', level: 88 },
  { name: 'Java', level: 82 },
  { name: 'Full-Stack (Node.js / Express)', level: 78 },
  { name: 'C++ & Embedded Systems', level: 72 },
  { name: 'Data Analytics (R)', level: 70 },
  { name: 'HTML / CSS / JavaScript', level: 80 },
]

const marqueeItems = [
  'PYTHON', 'JAVA', 'NODE.JS', 'C++', 'ARDUINO', 'MONGODB',
  'REINFORCEMENT LEARNING', 'R', 'SOCKET.IO', 'SUMO', 'JWT', 'EXPRESS',
  'PYTHON', 'JAVA', 'NODE.JS', 'C++', 'ARDUINO', 'MONGODB',
  'REINFORCEMENT LEARNING', 'R', 'SOCKET.IO', 'SUMO', 'JWT', 'EXPRESS',
]

// ── SkillBar ───────────────────────────────────────────────────
function SkillBar({ name, level, delay }: { name: string; level: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setActive(true), delay); obs.disconnect() }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [delay])

  return (
    <div ref={ref} className="mb-6">
      <div className="flex justify-between mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <span style={{ color: '#f0ede8', fontSize: '0.78rem', letterSpacing: '0.05em' }}>{name}</span>
        <span style={{ color: '#00ff87', fontSize: '0.78rem' }}>{level}%</span>
      </div>
      <div style={{ height: '2px', background: '#1e1e1e', borderRadius: '1px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, #00ff87, #7b5ea7)`,
            width: active ? `${level}%` : '0%',
            transition: `width 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
            borderRadius: '1px',
          }}
        />
      </div>
    </div>
  )
}

// ── Contact Form ───────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const [loading, setLoading] = useState(false)

  const [status, setStatus] = useState('')


  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0d0d0d',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#f0ede8',
    padding: '1rem 1.25rem',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 300,
    outline: 'none',
    borderRadius: '0',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  }


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setStatus('OPENING YOUR EMAIL APP...')

    const cleanSubject = form.subject.trim() || 'Portfolio enquiry'
    const cleanBody = [
      'Hi Rahmatul,',
      '',
      form.message.trim(),
      '',
      `From: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
    ].join('\n')

    window.location.href =
      `mailto:ektidaraziz@gmail.com?subject=${encodeURIComponent(cleanSubject)}&body=${encodeURIComponent(cleanBody)}`

    setTimeout(() => {
      setStatus('EMAIL READY TO SEND ✓')
      setLoading(false)
    }, 400)
  }


  return (
    <form
      className="reveal contact-form"
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
        background: 'rgba(255,255,255,0.04)',
      }}
    >

      <div
        className="contact-name-email"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px',
        }}
      >

        <input
          style={inputStyle}
          placeholder="Your Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
          required
        />


        <input
          style={inputStyle}
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
          required
        />

      </div>


      <input
        style={inputStyle}
        placeholder="Subject"
        value={form.subject}
        onChange={(e) =>
          setForm({
            ...form,
            subject: e.target.value,
          })
        }
        required
      />


      <textarea
        style={{
          ...inputStyle,
          minHeight: '140px',
          resize: 'vertical',
        }}
        placeholder="Tell me about your project or opportunity..."
        value={form.message}
        onChange={(e) =>
          setForm({
            ...form,
            message: e.target.value,
          })
        }
        required
      />


      {status && (
        <div
          style={{
            padding: '0.8rem 1rem',
            background: '#0d0d0d',
            color: status.includes('SUCCESSFULLY')
              ? '#00ff87'
              : '#9b9b9b',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
          }}
        >
          {status}
        </div>
      )}


      <button
        type="submit"
        disabled={loading}
        data-hover
        style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '1.1rem',
          letterSpacing: '0.15em',
          padding: '1.1rem',
          background: '#00ff87',
          color: '#080808',
          border: 'none',
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading
          ? 'SENDING...'
          : 'SEND MESSAGE'}
      </button>

    </form>
  )
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const [navScrolled, setNavScrolled] = useState(false)
  useReveal()

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="noise" style={{ background: '#080808', minHeight: '100vh' }}>
      <Cursor />

      {/* ── NAV ── */}
      <nav className="site-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '1.25rem 3rem',
        background: navScrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(12px)' : 'none',
        borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'all 0.4s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div
          onClick={() => scrollTo('home')}
          data-hover
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: '1.3rem', letterSpacing: '0.12em', color: '#00ff87',
            cursor: 'pointer',
          }}
        >
          RE<span style={{ color: '#f0ede8' }}>.</span>Aziz
        </div>
        <div className="nav-menu" style={{ display: 'flex', gap: '2.5rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.12em' }}>
          {['home', 'about', 'projects', 'skills', 'contact'].map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className="nav-link"
              style={{
                background: 'none', border: 'none', padding: '0.2rem 0',
                color: '#6b6b6b', textTransform: 'uppercase', transition: 'color 0.3s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = '#00ff87' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = '#6b6b6b' }}
            >
              {s}
            </button>
          ))}
        </div>
        {/* Social icons */}
        <div className="nav-socials" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <a
            href="https://github.com/Turjoaziz"
            target="_blank"
            rel="noopener noreferrer"
            data-hover
            title="GitHub Profile"
            aria-label="GitHub Profile"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px',
              border: '1px solid rgba(0,255,135,0.3)',
              borderRadius: '50%',
              color: '#00ff87',
              textDecoration: 'none',
              transition: 'all 0.25s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#00ff87'; el.style.borderColor = '#00ff87'; el.style.color = '#080808' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.borderColor = 'rgba(0,255,135,0.3)'; el.style.color = '#00ff87' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>

          <a
            href="mailto:ektidaraziz@gmail.com"
            data-hover
            title="Email Rahmatul Aziz"
            aria-label="Email Rahmatul Aziz"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px',
              border: '1px solid rgba(240,237,232,0.25)',
              borderRadius: '50%',
              color: '#f0ede8',
              textDecoration: 'none',
              transition: 'all 0.25s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#f0ede8'; el.style.borderColor = '#f0ede8'; el.style.color = '#080808' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.borderColor = 'rgba(240,237,232,0.25)'; el.style.color = '#f0ede8' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M4 7L12 13L20 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>

          <a
            href="https://www.linkedin.com/in/rahmatul-ektidar-aziz-95904627b/"
            target="_blank"
            rel="noopener noreferrer"
            data-hover
            title="LinkedIn Profile"
            aria-label="LinkedIn Profile"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', padding: 0,
              border: '1px solid rgba(123,94,167,0.4)',
              borderRadius: '50%',
              color: '#7b5ea7',
              textDecoration: 'none',
              transition: 'all 0.25s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#7b5ea7'; el.style.borderColor = '#7b5ea7'; el.style.color = '#f0ede8' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.borderColor = 'rgba(123,94,167,0.4)'; el.style.color = '#7b5ea7' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" className="grid-bg hero-section" style={{
        position: 'relative', height: '100vh',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        padding: '0 3rem',
        overflow: 'hidden',
      }}>
        <ParticleCanvas />
        <div className="scanline" />

        {/* ── Left: Text ── */}
        <div className="hero-copy" style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="hero-title" style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(3rem, 8vw, 8rem)',
            lineHeight: 0.88,
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
            color: '#f0ede8',
          }}>
            <div className="glitch-wrapper" data-text="RAHMATUL">
              <ScrambleText text="RAHMATUL" />
            </div>
            <br />
            <div className="glitch-wrapper" data-text="AZIZ" style={{ color: '#00ff87' }}>
              <ScrambleText text="AZIZ" />
            </div>
          </h1>

          <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(0.85rem, 1.8vw, 1.2rem)',
            color: '#6b6b6b', marginTop: '1.75rem', marginBottom: '2.5rem', fontWeight: 300,
          }}>
            Computing Science Graduate &amp; Full-Stack Developer —&nbsp;
            <Typewriter words={[
              'I build full-stack applications.',
              'I work with intelligent systems.',
              'I build real-time applications.',
              'I turn data into useful insights.',
              'I experiment with embedded systems.',
            ]} />
          </div>

          <div className="hero-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => scrollTo('projects')}
              data-hover
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.68rem', letterSpacing: '0.15em',
                padding: '0.85rem 2rem',
                background: '#00ff87', color: '#080808',
                border: 'none', fontWeight: 600, textTransform: 'uppercase',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = '#f0ede8' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = '#00ff87' }}
            >
              View Projects
            </button>
            <button
              onClick={() => scrollTo('contact')}
              data-hover
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.68rem', letterSpacing: '0.15em',
                padding: '0.85rem 2rem',
                background: 'transparent', color: '#f0ede8',
                border: '1px solid rgba(240,237,232,0.2)',
                textTransform: 'uppercase', transition: 'all 0.25s',
              }}
              onMouseEnter={e => { const el = e.target as HTMLElement; el.style.borderColor = '#00ff87'; el.style.color = '#00ff87' }}
              onMouseLeave={e => { const el = e.target as HTMLElement; el.style.borderColor = 'rgba(240,237,232,0.2)'; el.style.color = '#f0ede8' }}
            >
              Contact Me
            </button>
          </div>
        </div>

        {/* ── Right: Photo + Status + Globe ── */}
        <div className="hero-visual" style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '1.5rem',
        }}>
          {/* Profile picture */}
          <div className="hero-avatar-wrap" style={{ position: 'relative' }}>
            {/* Rotating accent ring */}
            <div style={{
              position: 'absolute', inset: '-6px', borderRadius: '50%',
              background: 'conic-gradient(#00ff87, #7b5ea7, #ff006e, #00ff87)',
              animation: 'borderSpin 4s linear infinite',
              padding: '2px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }} />
            <img
              src={GITHUB_AVATAR}
              alt="Rahmatul Aziz"
              className="hero-avatar"
              style={{
                width: '220px', height: '220px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #080808',
                display: 'block',
              }}
            />
            {/* Online dot */}
            <div style={{
              position: 'absolute', bottom: '12px', right: '12px',
              width: '14px', height: '14px', borderRadius: '50%',
              background: '#00ff87', border: '3px solid #080808',
            }} />
          </div>

          {/* Available for opportunities */}
          <div className="hero-availability" style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'rgba(0,255,135,0.06)',
            border: '1px solid rgba(0,255,135,0.2)',
            padding: '0.5rem 1.1rem',
            borderRadius: '999px',
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#00ff87',
              boxShadow: '0 0 6px #00ff87',
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem', color: '#00ff87',
              letterSpacing: '0.14em',
            }}>
              AVAILABLE FOR OPPORTUNITIES
            </span>
          </div>

          {/* Globe */}
          <div className="hero-globe" style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '1rem 1.5rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          }}>
            <GlobeLondon />
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem', color: '#6b6b6b',
              letterSpacing: '0.2em',
            }}>
              BASED IN LONDON, UK
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll" style={{
          position: 'absolute', bottom: '2.5rem', left: '3rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.62rem', color: '#6b6b6b', letterSpacing: '0.2em',
          zIndex: 2,
        }}>
          <div style={{ position: 'relative', width: '20px', height: '20px' }}>
            <div className="pulse-ring" style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '1px solid rgba(0,255,135,0.4)',
            }} />
            <div style={{ position: 'absolute', inset: '4px', borderRadius: '50%', background: '#00ff87' }} />
          </div>
          SCROLL TO EXPLORE
        </div>

        {/* Stats bottom-right */}
        <div className="hero-stats" style={{
          position: 'absolute', right: '3rem', bottom: '3rem',
          display: 'flex', gap: '2.5rem', zIndex: 2,
        }}>
          {[
            { n: 9, s: '', label: 'GitHub Repos' },
            { n: 5, s: '+', label: 'Major Projects' },
            { n: 2025, s: '', label: 'Graduate Year' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '2.2rem', color: '#f0ede8', lineHeight: 1 }}>
                <Counter target={stat.n} suffix={stat.s} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: '#6b6b6b', letterSpacing: '0.15em', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ background: '#00ff87', padding: '0.85rem 0', overflow: 'hidden' }}>
        <div className="marquee-track" style={{ display: 'flex', gap: '3rem', width: 'max-content' }}>
          {marqueeItems.map((item, i) => (
            <span key={i} style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: '0.8rem', color: '#080808',
              letterSpacing: '0.15em', whiteSpace: 'nowrap',
            }}>
              {item} <span style={{ opacity: 0.3 }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section id="about" className="about-section" style={{ padding: '8rem 3rem', position: 'relative', overflow: 'hidden' }}>
        <div className="about-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}>

          {/* Profile Image */}
          <div className="reveal-left about-photo" style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: '-10px',
              background: 'linear-gradient(135deg, #00ff87, #7b5ea7)',
              opacity: 0.15,
            }} />
            <img
              src={AVATAR}
              alt="Rahmatul Aziz — Computing Science Graduate and Full-Stack Developer"
              style={{
                width: '100%', aspectRatio: '1/1', objectFit: 'cover',
                position: 'relative', zIndex: 1,
                filter: 'grayscale(15%)',
              }}
            />
            {/* Floating badge */}
            <div className="float-1 grad-border about-badge" style={{
              position: 'absolute', bottom: '-1.5rem', right: '-1.5rem',
              background: '#111', padding: '1.2rem 1.5rem', zIndex: 2,
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#6b6b6b', letterSpacing: '0.15em', marginBottom: '0.3rem' }}>
                GRADUATED
              </div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: '2rem', color: '#00ff87', lineHeight: 1 }}>
                2025
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: '#6b6b6b', letterSpacing: '0.1em', marginTop: '0.2rem' }}>
                ULSTER UNIVERSITY
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <div className="reveal" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#00ff87', letterSpacing: '0.3em', marginBottom: '1rem' }}>
              {'// ABOUT ME'}
            </div>
            <h2 className="reveal" style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(2.2rem, 4vw, 4rem)',
              color: '#f0ede8', lineHeight: 0.95, letterSpacing: '-0.02em',
              marginBottom: '2rem',
            }}>
              DEVELOPER.<br />
              BUILDER.<br />
              <span className="text-gradient">PROBLEM SOLVER.</span>
            </h2>
            <div className="reveal" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.98rem', color: '#9b9b9b', lineHeight: 1.85, marginBottom: '1.5rem', fontWeight: 300 }}>
              I'm Rahmatul Aziz — a Computing Science graduate based in London with a strong interest in full-stack software development, artificial intelligence, data analytics, and embedded systems. My projects include reinforcement-learning traffic control, real-time web applications, embedded AI, and football data analytics.
            </div>
            <div className="reveal" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.98rem', color: '#9b9b9b', lineHeight: 1.85, marginBottom: '2.5rem', fontWeight: 300 }}>
              I enjoy turning ideas into practical software and learning through hands-on development. I'm currently focused on strengthening my software engineering skills and exploring graduate and junior opportunities where I can contribute, learn, and build useful products.
            </div>
            <div className="reveal" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['Open to Opportunities', 'London, UK', 'Full-Stack Development', 'BSc Graduate 2025'].map((tag) => (
                <span key={tag} style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.62rem', letterSpacing: '0.1em',
                  padding: '0.4rem 0.9rem',
                  border: '1px solid rgba(0,255,135,0.25)',
                  color: '#00ff87',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section id="projects" className="projects-section" style={{ padding: '8rem 3rem', background: '#0a0a0a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="reveal projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#00ff87', letterSpacing: '0.3em', marginBottom: '1rem' }}>
                {'// SELECTED WORK'}
              </div>
              <h2 style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 5rem)',
                color: '#f0ede8', lineHeight: 0.95, letterSpacing: '-0.02em',
              }}>
                PROJECTS
              </h2>
            </div>
            <a
              href="https://github.com/Turjoaziz?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              data-hover
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem', color: '#6b6b6b', letterSpacing: '0.12em',
                borderBottom: '1px solid rgba(107,107,107,0.4)',
                paddingBottom: '2px', textDecoration: 'none', transition: 'color 0.3s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = '#00ff87' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = '#6b6b6b' }}
            >
              ALL REPOS ↗
            </a>
          </div>

          <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5px', background: 'rgba(255,255,255,0.04)' }}>
            {projects.map((p) => (
              <TiltCard key={p.title} className="reveal">
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-hover
                  className="project-card-link"
                  style={{
                    display: 'block', background: '#0d0d0d',
                    overflow: 'hidden', position: 'relative',
                    aspectRatio: '4/3', textDecoration: 'none',
                  }}
                >
                  <img
                    src={p.img}
                    alt={p.title}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      opacity: 0.35, transition: 'opacity 0.5s ease, transform 0.6s ease',
                    }}
                    onMouseEnter={e => { const img = e.target as HTMLImageElement; img.style.opacity = '0.55'; img.style.transform = 'scale(1.06)' }}
                    onMouseLeave={e => { const img = e.target as HTMLImageElement; img.style.opacity = '0.35'; img.style.transform = 'scale(1)' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${p.color}0a, transparent)` }} />
                  <div className="project-card-content" style={{
                    position: 'absolute', inset: 0, padding: '2rem',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    background: 'linear-gradient(to top, rgba(8,8,8,0.96) 0%, transparent 60%)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.18em', color: p.color }}>
                        {p.tag}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#6b6b6b', letterSpacing: '0.1em' }}>
                        {p.year}
                      </span>
                    </div>
                    <h3 className="project-card-title" style={{
                      fontFamily: "'Anton', sans-serif",
                      fontSize: '2rem', color: '#f0ede8',
                      letterSpacing: '0.02em', lineHeight: 1,
                      marginBottom: '0.75rem',
                    }}>
                      {p.title}
                    </h3>
                    <p className="project-card-desc" style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '0.82rem', color: '#9b9b9b',
                      lineHeight: 1.65, fontWeight: 300, marginBottom: '1rem',
                    }}>
                      {p.desc}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {p.tech.map((t) => (
                        <span key={t} style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.58rem', color: '#6b6b6b', letterSpacing: '0.08em',
                          padding: '0.2rem 0.55rem',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </a>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section id="skills" className="skills-section" style={{ padding: '8rem 3rem' }}>
        <div className="skills-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8rem', alignItems: 'start' }}>
          <div>
            <div className="reveal" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#00ff87', letterSpacing: '0.3em', marginBottom: '1rem' }}>
              {'// EXPERTISE'}
            </div>
            <h2 className="reveal" style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(2.5rem, 4vw, 4.5rem)',
              color: '#f0ede8', lineHeight: 0.95, letterSpacing: '-0.02em',
              marginBottom: '1.5rem',
            }}>
              WHAT I<br /><span className="text-gradient">BRING</span>
            </h2>
            <p className="reveal" style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '0.98rem', color: '#9b9b9b', lineHeight: 1.8, fontWeight: 300,
              marginBottom: '3rem',
            }}>
              My technical work spans full-stack development, real-time applications, reinforcement learning, data analytics, and embedded systems. I focus on practical projects that connect software concepts with real-world problems.
            </p>
            <div className="reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {['Full-Stack Development', 'Real-Time Systems', 'Data Analytics', 'Reinforcement Learning', 'REST APIs', 'Embedded Systems'].map((tag, i) => (
                <span
                  key={tag}
                  className={`float-${(i % 3) + 1}`}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.62rem', letterSpacing: '0.1em',
                    padding: '0.5rem 1rem',
                    background: 'rgba(0,255,135,0.04)',
                    border: '1px solid rgba(0,255,135,0.14)',
                    color: '#f0ede8',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="reveal" style={{ paddingTop: '1rem' }}>
            {skills.map((s, i) => (
              <SkillBar key={s.name} name={s.name} level={s.level} delay={i * 120} />
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE CTA ── */}
      <div className="cta-marquee" style={{ padding: '5rem 3rem', overflow: 'hidden', background: '#0a0a0a' }}>
        <div style={{ overflow: 'hidden' }}>
          <div className="marquee-track" style={{ display: 'flex', gap: '2rem', width: 'max-content', alignItems: 'center' }}>
            {Array(8).fill(0).map((_, i) => (
              <span key={i} style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 'clamp(3rem, 7vw, 7rem)',
                color: i % 2 === 0 ? 'transparent' : '#f0ede8',
                WebkitTextStroke: i % 2 === 0 ? '1px rgba(240,237,232,0.15)' : 'none',
                letterSpacing: '-0.02em', whiteSpace: 'nowrap',
              }}>
                OPEN TO OPPORTUNITIES · LET'S BUILD SOMETHING USEFUL &nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTACT ── */}
      <section id="contact" className="contact-section" style={{ padding: '8rem 3rem', background: '#080808', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', bottom: '-2rem', right: '-2rem',
          fontFamily: "'Anton', sans-serif",
          fontSize: '18vw', color: 'rgba(0,255,135,0.025)',
          letterSpacing: '-0.04em', pointerEvents: 'none', lineHeight: 1, userSelect: 'none',
        }}>
          CONNECT
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="reveal" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#00ff87', letterSpacing: '0.3em', marginBottom: '1rem' }}>
            {'// GET IN TOUCH'}
          </div>
          <h2 className="reveal" style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(3rem, 7vw, 7rem)',
            color: '#f0ede8', lineHeight: 0.9, letterSpacing: '-0.02em',
            marginBottom: '2rem',
          }}>
            LET'S<br />BUILD<br /><span className="text-gradient">TOGETHER.</span>
          </h2>
          <p className="reveal" style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '1.05rem', color: '#9b9b9b', lineHeight: 1.8, fontWeight: 300,
            marginBottom: '3rem',
          }}>
            Open to graduate and junior software development roles, technical projects, and opportunities across full-stack development, AI, data, and embedded systems. If you have an opportunity or project in mind, let's talk.
          </p>

          <ContactForm />

          <div
            className="reveal contact-links"
            style={{
              marginTop: '4rem',
              paddingTop: '3rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '2.5rem',
            }}
          >
            {[
              {
                label: 'GITHUB',
                value: 'github.com/Turjoaziz',
                href: 'https://github.com/Turjoaziz',
              },
              {
                label: 'GMAIL',
                value: 'ektidaraziz@gmail.com',
                href: 'mailto:ektidaraziz@gmail.com',
              },
              {
                label: 'LINKEDIN',
                value: 'Rahmatul Aziz',
                href: 'https://www.linkedin.com/in/rahmatul-ektidar-aziz-95904627b/',
              },
              {
                label: 'LOCATION',
                value: 'London, UK',
                href: 'https://www.google.com/maps/place/London,+UK',
              },
            ].map((link) => (
              <div key={link.label}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6rem',
                    color: '#6b6b6b',
                    letterSpacing: '0.2em',
                    marginBottom: '0.45rem',
                  }}
                >
                  {link.label === 'GMAIL' && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#00ff87" strokeWidth="1.8"/>
                      <path d="M4 7L12 13L20 7" stroke="#00ff87" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {link.label}
                </div>

                <a
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  data-hover
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '0.9rem',
                    color: '#f0ede8',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(240,237,232,0.15)',
                    paddingBottom: '1px',
                    transition: 'color 0.3s, border-color 0.3s',
                    wordBreak: 'break-word',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.color = '#00ff87'
                    el.style.borderColor = '#00ff87'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.color = '#f0ede8'
                    el.style.borderColor = 'rgba(240,237,232,0.15)'
                  }}
                >
                  {link.value}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="site-footer" style={{
        padding: '2rem 3rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#080808',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={AVATAR} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', opacity: 0.6 }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: '#6b6b6b', letterSpacing: '0.1em' }}>
            © {new Date().getFullYear()} RAHMATUL AZIZ — BUILT WITH INTENTION
          </span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: '#6b6b6b', letterSpacing: '0.1em' }}>
          LONDON, UK
        </div>
      </footer>
    </div>
  )
}