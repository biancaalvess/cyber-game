"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Tilt_Neon } from "next/font/google"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Rocket, Shield, Zap, Target, Sparkles, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"

const tiltNeon = Tilt_Neon({ subsets: ["latin"] })

// Tipos
type Enemy = {
  id: number
  x: number
  y: number
  width: number
  height: number
  speed: number
  health: number
  type: "standard" | "fast" | "tank"
  color: string
}

type Bullet = {
  id: number
  x: number
  y: number
  width: number
  height: number
  speed: number
}

type Powerup = {
  id: number
  x: number
  y: number
  width: number
  height: number
  speed: number
  type: "shield" | "rapidFire" | "multiShot"
}

type Particle = {
  id: number
  x: number
  y: number
  size: number
  color: string
  speedX: number
  speedY: number
  life: number
  maxLife: number
}

export default function Home() {
  // Client-side only flag to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false)

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const lastEnemySpawnRef = useRef<number>(0)
  const lastPowerupSpawnRef = useRef<number>(0)
  const lastShootTimeRef = useRef<number>(0)

  // Estado do jogo
  const [gameStarted, setGameStarted] = useState(false)
  const [gamePaused, setGamePaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [bestScore, setBestScore] = useState(0)

  // Estado do jogador
  const [playerX, setPlayerX] = useState(0)
  const [playerY, setPlayerY] = useState(0)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [playerShield, setPlayerShield] = useState(0)
  const [rapidFire, setRapidFire] = useState(false)
  const [multiShot, setMultiShot] = useState(false)

  // Estado dos objetos do jogo
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [powerups, setPowerups] = useState<Powerup[]>([])
  const [particles, setParticles] = useState<Particle[]>([])

  // Dimensões do jogo
  const [gameWidth, setGameWidth] = useState(0)
  const [gameHeight, setGameHeight] = useState(0)

  // Adicionar estas variáveis de estado para controles touch
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [autoShoot, setAutoShoot] = useState(false)
  const autoShootIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Constantes do jogo
  const PLAYER_WIDTH = 60
  const PLAYER_HEIGHT = 40
  const BULLET_WIDTH = 5
  const BULLET_HEIGHT = 15
  const BULLET_SPEED = 10
  const ENEMY_SPAWN_RATE = 1500 // ms
  const POWERUP_SPAWN_RATE = 10000 // ms
  const SHOOT_COOLDOWN = 300 // ms
  const RAPID_FIRE_COOLDOWN = 150 // ms
  const POWERUP_DURATION = 8000 // ms

  // Funções do jogo
  const handleShoot = () => {
    if (!gameStarted || gamePaused || gameOver) return

    const now = Date.now()
    if (now - lastShootTimeRef.current < (rapidFire ? RAPID_FIRE_COOLDOWN : SHOOT_COOLDOWN)) {
      return
    }

    lastShootTimeRef.current = now

    const bulletX = playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2
    const bulletY = playerY

    const createBullet = (xOffset = 0) => ({
      id: Date.now() + Math.random(),
      x: bulletX + xOffset,
      y: bulletY,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      speed: BULLET_SPEED,
    })

    let newBullets: Bullet[] = []

    if (multiShot) {
      newBullets = [createBullet(-10), createBullet(), createBullet(10)]
    } else {
      newBullets = [createBullet()]
    }

    setBullets((prev) => [...prev, ...newBullets])
    playSound("shoot")
  }

  const playSound = (type: "shoot" | "hit" | "explosion" | "powerup" | "start" | "gameOver" | "levelUp") => {
    if (!soundEnabled || !isMounted) return

    try {
      // Implementação básica de efeitos sonoros usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      switch (type) {
        case "shoot":
          oscillator.type = "square"
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.2)
          break
        case "hit":
          oscillator.type = "sawtooth"
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.1)
          break
        case "explosion":
          oscillator.type = "sawtooth"
          oscillator.frequency.setValueAtTime(100, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.5)
          break
        case "powerup":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.3)
          break
        case "start":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.5)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.6)
          break
        case "gameOver":
          oscillator.type = "sawtooth"
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 1)
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 1)
          break
        case "levelUp":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2)
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.4)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.4)
          break
      }
    } catch (error) {
      console.error("Error playing sound:", error)
    }
  }

  const endGame = () => {
    setGameStarted(false)
    setGameOver(true)
    setGamePaused(false)

    // Play game over sound
    playSound("gameOver")

    // Save best score
    if (score > bestScore) {
      setBestScore(score)
      localStorage.setItem("space-shooter-best-score", score.toString())
    }

    // Reset game state
    setEnemies([])
    setBullets([])
    setPowerups([])
    setParticles([])
    setPlayerHealth(100)
    setPlayerShield(0)
    setRapidFire(false)
    setMultiShot(false)
    setLevel(1)
    setScore(0)
  }

  const pauseGame = () => {
    setGamePaused((prev) => !prev)
  }

  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setGamePaused(false)
    setPlayerHealth(100)
    setScore(0)
    setEnemies([])
    setBullets([])
    setPowerups([])
    setParticles([])

    // Play start sound
    playSound("start")
  }

  // Handlers de eventos
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || gamePaused || gameOver) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    setPlayerX(x - PLAYER_WIDTH / 2)
  }

  const handleClick = () => {
    if (!isTouchDevice) {
      handleShoot()
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameStarted || gamePaused || gameOver) return

    const touch = e.touches[0]
    if (!touch) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left

    setTouchStartX(x)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!gameStarted || gamePaused || gameOver) return

    const touch = e.touches[0]
    if (!touch) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left

    if (touchStartX !== null) {
      const deltaX = x - touchStartX
      setPlayerX((prevX) => Math.max(0, Math.min(prevX + deltaX, gameWidth - PLAYER_WIDTH)))
      setTouchStartX(x)
    }
  }

  const handleTouchEnd = () => {
    setTouchStartX(null)
  }

  // Set isMounted to true after initial render to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)

    // Load best score from localStorage
    const savedBestScore = localStorage.getItem("space-shooter-best-score")
    if (savedBestScore) {
      setBestScore(Number.parseInt(savedBestScore, 10))
    }
  }, [])

  // Inicialização do jogo
  useEffect(() => {
    if (!isMounted) return

    // Carregar high score do localStorage
    const savedHighScore = localStorage.getItem("cyberpunk-shooter-highscore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }

    // Configurar dimensões do canvas
    const updateDimensions = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const container = canvas.parentElement
        if (container) {
          // Usar window.innerWidth/Height para dispositivos móveis
          const { width, height } = container.getBoundingClientRect()

          // Ajustar altura para dispositivos móveis em modo paisagem
          const aspectRatio = window.innerWidth / window.innerHeight
          const isMobile = window.innerWidth <= 768
          const isLandscape = aspectRatio > 1

          const gameW = width
          const gameH = isMobile && isLandscape ? window.innerHeight * 0.7 : height

          setGameWidth(gameW)
          setGameHeight(gameH)
          canvas.width = gameW
          canvas.height = gameH

          // Atualizar posição inicial do jogador
          setPlayerX(gameW / 2 - PLAYER_WIDTH / 2)
          setPlayerY(gameH - PLAYER_HEIGHT - 20)
        }
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [isMounted])

  // Adicionar esta função para detectar dispositivos touch após o useEffect de inicialização
  useEffect(() => {
    if (!isMounted) return

    // Detectar se é um dispositivo touch
    const detectTouchDevice = () => {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
    }

    detectTouchDevice()

    // Configurar intervalo de tiro automático para dispositivos móveis
    if (gameStarted && !gamePaused && !gameOver && autoShoot) {
      autoShootIntervalRef.current = setInterval(
        () => {
          handleShoot()
        },
        rapidFire ? RAPID_FIRE_COOLDOWN : SHOOT_COOLDOWN,
      )
    }

    return () => {
      if (autoShootIntervalRef.current) {
        clearInterval(autoShootIntervalRef.current)
      }
    }
  }, [gameStarted, gamePaused, gameOver, autoShoot, rapidFire, isMounted])

  // Atualizar high score quando o score mudar
  useEffect(() => {
    if (!isMounted) return

    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem("cyberpunk-shooter-highscore", score.toString())
    }
  }, [score, highScore, isMounted])

  // Controle de nível baseado na pontuação
  useEffect(() => {
    if (!isMounted) return

    const newLevel = Math.floor(score / 1000) + 1
    if (newLevel !== level) {
      setLevel(newLevel)
      createParticles(gameWidth / 2, gameHeight / 2, 30, ["#9333ea", "#3b82f6", "#06b6d4"])
      playSound("levelUp")
    }
  }, [score, level, gameWidth, gameHeight, isMounted])

  // Efeitos de powerup
  useEffect(() => {
    if (!isMounted) return

    if (rapidFire) {
      const timer = setTimeout(() => {
        setRapidFire(false)
      }, POWERUP_DURATION)
      return () => clearTimeout(timer)
    }
  }, [rapidFire, isMounted])

  useEffect(() => {
    if (!isMounted) return

    if (multiShot) {
      const timer = setTimeout(() => {
        setMultiShot(false)
      }, POWERUP_DURATION)
      return () => clearTimeout(timer)
    }
  }, [multiShot, isMounted])

  useEffect(() => {
    if (!isMounted) return

    if (playerShield > 0) {
      const timer = setTimeout(() => {
        setPlayerShield(0)
      }, POWERUP_DURATION)
      return () => clearTimeout(timer)
    }
  }, [playerShield, isMounted])

  // Loop principal do jogo
  useEffect(() => {
    if (!isMounted || !gameStarted || gamePaused || gameOver) return

    let lastTime = 0
    const targetFPS = isTouchDevice ? 30 : 60 // Lower FPS target for mobile
    const frameInterval = 1000 / targetFPS

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
        lastTime = timestamp
      }

      const deltaTime = timestamp - lastTime

      // Only update if enough time has passed (frame limiting)
      if (deltaTime >= frameInterval) {
        lastTime = timestamp - (deltaTime % frameInterval)

        // Limpar o canvas
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Desenhar fundo
        drawBackground(ctx)

        // Desenhar jogador
        drawPlayer(ctx)

        // Atualizar e desenhar balas
        updateBullets()
        drawBullets(ctx)

        // Gerar inimigos - reduced spawn rate
        const enemySpawnRate = ENEMY_SPAWN_RATE / (level * 0.4)
        if (timestamp - lastEnemySpawnRef.current > enemySpawnRate) {
          spawnEnemy()
          lastEnemySpawnRef.current = timestamp
        }

        // Atualizar e desenhar inimigos
        updateEnemies(deltaTime)
        drawEnemies(ctx)

        // Gerar powerups - reduced spawn rate
        if (timestamp - lastPowerupSpawnRef.current > POWERUP_SPAWN_RATE * 1.5) {
          spawnPowerup()
          lastPowerupSpawnRef.current = timestamp
        }

        // Atualizar e desenhar powerups
        updatePowerups(deltaTime)
        drawPowerups(ctx)

        // Verificar colisões
        checkCollisions()

        // Atualizar e desenhar partículas
        updateParticles(deltaTime)
        drawParticles(ctx)

        // Desenhar UI
        drawUI(ctx)
      }

      // Continuar o loop
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [
    isMounted,
    gameStarted,
    gamePaused,
    gameOver,
    playerX,
    playerY,
    gameWidth,
    gameHeight,
    level,
    playerHealth,
    playerShield,
    rapidFire,
    multiShot,
  ])

  // Funções de desenho
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Gradiente de fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight)
    gradient.addColorStop(0, "#0f172a")
    gradient.addColorStop(1, "#1e1b4b")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, gameWidth, gameHeight)

    // Grade de fundo - reduced number of lines
    ctx.strokeStyle = "rgba(147, 51, 234, 0.1)"
    ctx.lineWidth = 1

    // Linhas horizontais - increased spacing
    const gridSpacing = isTouchDevice ? 80 : 60
    for (let y = 0; y < gameHeight; y += gridSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(gameWidth, y)
      ctx.stroke()
    }

    // Linhas verticais - increased spacing
    for (let x = 0; x < gameWidth; x += gridSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, gameHeight)
      ctx.stroke()
    }

    // Estrelas - reduced count
    const starCount = isTouchDevice ? 30 : 50
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * gameWidth
      const y = Math.random() * gameHeight
      const size = Math.random() * 2
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    // Desenhar nave do jogador
    ctx.save()

    // Corpo principal da nave
    ctx.fillStyle = "#3b82f6"
    ctx.beginPath()
    ctx.moveTo(playerX + PLAYER_WIDTH / 2, playerY)
    ctx.lineTo(playerX + PLAYER_WIDTH, playerY + PLAYER_HEIGHT)
    ctx.lineTo(playerX, playerY + PLAYER_HEIGHT)
    ctx.closePath()
    ctx.fill()

    // Detalhes da nave
    ctx.fillStyle = "#9333ea"
    ctx.beginPath()
    ctx.moveTo(playerX + PLAYER_WIDTH / 2, playerY + 5)
    ctx.lineTo(playerX + PLAYER_WIDTH - 10, playerY + PLAYER_HEIGHT - 5)
    ctx.lineTo(playerX + 10, playerY + PLAYER_HEIGHT - 5)
    ctx.closePath()
    ctx.fill()

    // Efeito de propulsor
    ctx.fillStyle = "#f97316"
    ctx.beginPath()
    ctx.moveTo(playerX + PLAYER_WIDTH / 2 - 10, playerY + PLAYER_HEIGHT)
    ctx.lineTo(playerX + PLAYER_WIDTH / 2, playerY + PLAYER_HEIGHT + 10 + Math.random() * 5)
    ctx.lineTo(playerX + PLAYER_WIDTH / 2 + 10, playerY + PLAYER_HEIGHT)
    ctx.closePath()
    ctx.fill()

    // Brilho da nave
    ctx.shadowColor = "#3b82f6"
    ctx.shadowBlur = 10
    ctx.strokeStyle = "#38bdf8"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playerX + PLAYER_WIDTH / 2, playerY)
    ctx.lineTo(playerX + PLAYER_WIDTH, playerY + PLAYER_HEIGHT)
    ctx.lineTo(playerX, playerY + PLAYER_HEIGHT)
    ctx.closePath()
    ctx.stroke()

    // Desenhar escudo se ativo
    if (playerShield > 0) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(playerX + PLAYER_WIDTH / 2, playerY + PLAYER_HEIGHT / 2, PLAYER_WIDTH * 0.8, 0, Math.PI * 2)
      ctx.stroke()

      // Efeito de pulso do escudo
      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(
        playerX + PLAYER_WIDTH / 2,
        playerY + PLAYER_HEIGHT / 2,
        PLAYER_WIDTH * 0.9 + Math.sin(Date.now() / 200) * 5,
        0,
        Math.PI * 2,
      )
      ctx.stroke()
    }

    ctx.restore()
  }

  const drawBullets = (ctx: CanvasRenderingContext2D) => {
    ctx.save()

    bullets.forEach((bullet) => {
      // Gradiente para o tiro
      const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bullet.height)
      gradient.addColorStop(0, "#9333ea")
      gradient.addColorStop(1, "#3b82f6")

      ctx.fillStyle = gradient
      ctx.shadowColor = "#9333ea"
      ctx.shadowBlur = 10
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)

      // Brilho do tiro
      ctx.strokeStyle = "#38bdf8"
      ctx.lineWidth = 1
      ctx.strokeRect(bullet.x, bullet.y, bullet.width, bullet.height)
    })

    ctx.restore()
  }

  const drawEnemies = (ctx: CanvasRenderingContext2D) => {
    ctx.save()

    enemies.forEach((enemy) => {
      // Cores baseadas no tipo de inimigo
      let mainColor = "#ef4444"
      let secondaryColor = "#b91c1c"
      let glowColor = "#f87171"

      if (enemy.type === "fast") {
        mainColor = "#22c55e"
        secondaryColor = "#15803d"
        glowColor = "#4ade80"
      } else if (enemy.type === "tank") {
        mainColor = "#f97316"
        secondaryColor = "#c2410c"
        glowColor = "#fb923c"
      }

      // Corpo do inimigo
      ctx.fillStyle = mainColor
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 10

      if (enemy.type === "standard") {
        // Inimigo padrão (triangular)
        ctx.beginPath()
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height)
        ctx.lineTo(enemy.x + enemy.width, enemy.y)
        ctx.lineTo(enemy.x, enemy.y)
        ctx.closePath()
        ctx.fill()

        // Detalhes
        ctx.fillStyle = secondaryColor
        ctx.beginPath()
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height - 5)
        ctx.lineTo(enemy.x + enemy.width - 10, enemy.y + 5)
        ctx.lineTo(enemy.x + 10, enemy.y + 5)
        ctx.closePath()
        ctx.fill()
      } else if (enemy.type === "fast") {
        // Inimigo rápido (diamante)
        ctx.beginPath()
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y)
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height / 2)
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height)
        ctx.lineTo(enemy.x, enemy.y + enemy.height / 2)
        ctx.closePath()
        ctx.fill()

        // Detalhes
        ctx.fillStyle = secondaryColor
        ctx.beginPath()
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + 5)
        ctx.lineTo(enemy.x + enemy.width - 5, enemy.y + enemy.height / 2)
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height - 5)
        ctx.lineTo(enemy.x + 5, enemy.y + enemy.height / 2)
        ctx.closePath()
        ctx.fill()
      } else if (enemy.type === "tank") {
        // Inimigo tanque (hexágono)
        ctx.beginPath()
        ctx.moveTo(enemy.x + enemy.width * 0.25, enemy.y)
        ctx.lineTo(enemy.x + enemy.width * 0.75, enemy.y)
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.5)
        ctx.lineTo(enemy.x + enemy.width * 0.75, enemy.y + enemy.height)
        ctx.lineTo(enemy.x + enemy.width * 0.25, enemy.y + enemy.height)
        ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.5)
        ctx.closePath()
        ctx.fill()

        // Detalhes
        ctx.fillStyle = secondaryColor
        ctx.beginPath()
        ctx.moveTo(enemy.x + enemy.width * 0.35, enemy.y + 5)
        ctx.lineTo(enemy.x + enemy.width * 0.65, enemy.y + 5)
        ctx.lineTo(enemy.x + enemy.width - 5, enemy.y + enemy.height * 0.5)
        ctx.lineTo(enemy.x + enemy.width * 0.65, enemy.y + enemy.height - 5)
        ctx.lineTo(enemy.x + enemy.width * 0.35, enemy.y + enemy.height - 5)
        ctx.lineTo(enemy.x + 5, enemy.y + enemy.height * 0.5)
        ctx.closePath()
        ctx.fill()
      }

      // Barra de vida
      const healthPercentage = enemy.health / (enemy.type === "standard" ? 1 : enemy.type === "fast" ? 1 : 3)
      const barWidth = enemy.width * healthPercentage

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4)

      ctx.fillStyle = mainColor
      ctx.fillRect(enemy.x, enemy.y - 8, barWidth, 4)
    })

    ctx.restore()
  }

  const drawPowerups = (ctx: CanvasRenderingContext2D) => {
    ctx.save()

    powerups.forEach((powerup) => {
      let color = "#3b82f6" // Azul para escudo
      let icon = "🛡️"

      if (powerup.type === "rapidFire") {
        color = "#9333ea" // Roxo para tiro rápido
        icon = "⚡"
      } else if (powerup.type === "multiShot") {
        color = "#06b6d4" // Ciano para tiro múltiplo
        icon = "🔥"
      }

      // Desenhar fundo do powerup
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, powerup.width / 2, 0, Math.PI * 2)
      ctx.fill()

      // Desenhar borda
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, powerup.width / 2, 0, Math.PI * 2)
      ctx.stroke()

      // Desenhar ícone
      ctx.fillStyle = "white"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(icon, powerup.x + powerup.width / 2, powerup.y + powerup.height / 2)
    })

    ctx.restore()
  }

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    ctx.save()

    particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.restore()
  }

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    ctx.save()

    // Barra de vida
    const healthBarWidth = 200
    const healthBarHeight = 10
    const healthPercentage = Math.max(0, playerHealth / 100)

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(20, 20, healthBarWidth, healthBarHeight)

    const healthGradient = ctx.createLinearGradient(
      20,
      20,
      20 + healthBarWidth * healthPercentage,
      20 + healthBarHeight,
    )
    healthGradient.addColorStop(0, "#22c55e")
    healthGradient.addColorStop(1, "#4ade80")

    ctx.fillStyle = healthGradient
    ctx.fillRect(20, 20, healthBarWidth * healthPercentage, healthBarHeight)

    ctx.strokeStyle = "white"
    ctx.lineWidth = 1
    ctx.strokeRect(20, 20, healthBarWidth, healthBarHeight)

    // Texto de vida
    ctx.fillStyle = "white"
    ctx.font = "14px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`HP: ${Math.max(0, playerHealth)}`, 20, 45)

    // Pontuação
    ctx.font = "bold 20px Arial"
    ctx.textAlign = "right"
    ctx.fillText(`Pontuação: ${score}`, gameWidth - 20, 30)

    // Nível
    ctx.font = "16px Arial"
    ctx.fillText(`Nível: ${level}`, gameWidth - 20, 55)

    // Indicadores de powerup
    let powerupY = 80

    if (playerShield > 0) {
      ctx.fillStyle = "#3b82f6"
      ctx.fillText("Escudo Ativo", gameWidth - 20, powerupY)
      powerupY += 25
    }

    if (rapidFire) {
      ctx.fillStyle = "#9333ea"
      ctx.fillText("Tiro Rápido", gameWidth - 20, powerupY)
      powerupY += 25
    }

    if (multiShot) {
      ctx.fillStyle = "#06b6d4"
      ctx.fillText("Tiro Múltiplo", gameWidth - 20, powerupY)
    }

    ctx.restore()
  }

  // Funções de atualização
  const updateBullets = () => {
    setBullets((prev) => {
      // Process all bullets in a single update
      const updatedBullets = prev
        .map((bullet) => ({
          ...bullet,
          y: bullet.y - bullet.speed,
        }))
        .filter((bullet) => bullet.y + bullet.height > 0)

      return updatedBullets
    })
  }

  const updateEnemies = (deltaTime: number) => {
    setEnemies((prev) => {
      // Process all enemies in a single update
      const updatedEnemies = prev
        .map((enemy) => ({
          ...enemy,
          y: enemy.y + enemy.speed * (deltaTime / 16),
        }))
        .filter((enemy) => enemy.y < gameHeight + enemy.height)

      return updatedEnemies
    })
  }

  const updatePowerups = (deltaTime: number) => {
    setPowerups((prev) =>
      prev
        .map((powerup) => ({
          ...powerup,
          y: powerup.y + powerup.speed * (deltaTime / 16),
        }))
        .filter((powerup) => powerup.y < gameHeight),
    )
  }

  const updateParticles = (deltaTime: number) => {
    setParticles((prev) => {
      // Process all particles in a single update
      const updatedParticles = prev
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.speedX * (deltaTime / 16),
          y: particle.y + particle.speedY * (deltaTime / 16),
          life: particle.life - deltaTime / 16,
        }))
        .filter((particle) => particle.life > 0)

      return updatedParticles
    })
  }

  // Funções de geração
  const spawnEnemy = () => {
    // Limit max enemies based on device
    const maxEnemies = isTouchDevice ? 5 : 10
    if (enemies.length >= maxEnemies) return

    const types: ("standard" | "fast" | "tank")[] = ["standard", "fast", "tank"]
    const weights = [0.6, 0.3, 0.1] // Probabilidades de cada tipo

    // Ajustar probabilidades com base no nível
    if (level > 3) {
      weights[0] = 0.5
      weights[1] = 0.3
      weights[2] = 0.2
    }
    if (level > 6) {
      weights[0] = 0.4
      weights[1] = 0.3
      weights[2] = 0.3
    }

    // Selecionar tipo com base nas probabilidades
    const random = Math.random()
    let cumulativeProbability = 0
    let selectedType: "standard" | "fast" | "tank" = "standard"

    for (let i = 0; i < types.length; i++) {
      cumulativeProbability += weights[i]
      if (random < cumulativeProbability) {
        selectedType = types[i]
        break
      }
    }

    // Configurar propriedades com base no tipo
    let width = 40
    let height = 40
    let speed = 1.5 + level * 0.15 // Reduced base speed
    let health = 1

    // Ajustar tamanho para dispositivos móveis
    const scaleFactor = isTouchDevice ? 0.8 : 1
    width *= scaleFactor
    height *= scaleFactor

    if (selectedType === "fast") {
      width = 30 * scaleFactor
      height = 30 * scaleFactor
      speed = 2 + level * 0.2 // Reduced speed scaling
      health = 1
    } else if (selectedType === "tank") {
      width = 50 * scaleFactor
      height = 50 * scaleFactor
      speed = 0.8 + level * 0.08 // Reduced speed scaling
      health = 3
    }

    // Reduzir velocidade ligeiramente em dispositivos móveis para compensar telas menores
    if (isTouchDevice) {
      speed *= 0.8
    }

    const newEnemy: Enemy = {
      id: Date.now() + Math.random(),
      x: Math.random() * (gameWidth - width),
      y: -height,
      width,
      height,
      speed,
      health,
      type: selectedType,
      color: selectedType === "standard" ? "#ef4444" : selectedType === "fast" ? "#22c55e" : "#f97316",
    }

    setEnemies((prev) => [...prev, newEnemy])
  }

  const spawnPowerup = () => {
    const types: ("shield" | "rapidFire" | "multiShot")[] = ["shield", "rapidFire", "multiShot"]
    const randomType = types[Math.floor(Math.random() * types.length)]

    const newPowerup: Powerup = {
      id: Date.now() + Math.random(),
      x: Math.random() * (gameWidth - 30),
      y: -30,
      width: 30,
      height: 30,
      speed: 1.5,
      type: randomType,
    }

    setPowerups((prev) => [...prev, newPowerup])
  }

  // Optimize particle generation - reduce count and complexity
  const createParticles = (x: number, y: number, count: number, colors: string[]) => {
    // Limit the number of particles based on device performance
    const actualCount = Math.min(count, isTouchDevice ? 5 : 10)
    const newParticles: Particle[] = []

    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 2 + 0.5 // Reduced speed
      const size = Math.random() * 3 + 1 // Slightly smaller particles
      const color = colors[Math.floor(Math.random() * colors.length)]
      const life = Math.random() * 20 + 10 // Shorter lifespan

      newParticles.push({
        id: Date.now() + Math.random(),
        x,
        y,
        size,
        color,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        life,
        maxLife: life,
      })
    }

    // Use functional update to avoid race conditions
    setParticles((prev) => {
      // Limit total particles
      const maxParticles = isTouchDevice ? 30 : 60
      return [...newParticles, ...prev].slice(0, maxParticles)
    })
  }

  // Funções de colisão
  const checkCollisions = () => {
    // Only check collisions for bullets that are in the visible area
    const activeBullets = bullets.filter((bullet) => bullet.y > 0 && bullet.y < gameHeight)

    // Only check collisions for enemies that are in the visible area
    const activeEnemies = enemies.filter((enemy) => enemy.y > -enemy.height && enemy.y < gameHeight)

    // Colisão entre balas e inimigos - optimized to reduce checks
    activeBullets.forEach((bullet) => {
      for (let i = 0; i < activeEnemies.length; i++) {
        const enemy = activeEnemies[i]
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          // Remover bala
          setBullets((prev) => prev.filter((b) => b.id !== bullet.id))

          // Reduzir vida do inimigo
          setEnemies((prev) =>
            prev
              .map((e) => {
                if (e.id === enemy.id) {
                  return {
                    ...e,
                    health: e.health - 1,
                  }
                }
                return e
              })
              .filter((e) => e.health > 0),
          )

          // Criar partículas - reduced count
          createParticles(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 5, [
            enemy.color,
            "#ffffff",
            "#38bdf8",
          ])

          // Aumentar pontuação
          setScore((prev) => prev + (enemy.type === "standard" ? 10 : enemy.type === "fast" ? 20 : 30))

          // Efeito sonoro
          playSound("hit")

          // Break early after collision is found
          break
        }
      }
    })

    // Colisão entre jogador e inimigos
    if (playerShield <= 0) {
      // Only check if player doesn't have shield
      for (let i = 0; i < activeEnemies.length; i++) {
        const enemy = activeEnemies[i]
        if (
          playerX < enemy.x + enemy.width &&
          playerX + PLAYER_WIDTH > enemy.x &&
          playerY < enemy.y + enemy.height &&
          playerY + PLAYER_HEIGHT > enemy.y
        ) {
          // Remover inimigo
          setEnemies((prev) => prev.filter((e) => e.id !== enemy.id))

          // Reduzir vida do jogador
          const damage = enemy.type === "standard" ? 10 : enemy.type === "fast" ? 15 : 25
          setPlayerHealth((prev) => {
            const newHealth = prev - damage
            if (newHealth <= 0) {
              endGame()
            }
            return newHealth
          })

          // Criar partículas - reduced count
          createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 10, [
            enemy.color,
            "#ffffff",
            "#ef4444",
          ])

          // Efeito sonoro
          playSound("explosion")
          break
        }
      }
    }

    // Colisão entre jogador e powerups - only check if there are powerups
    if (powerups.length > 0) {
      for (let i = 0; i < powerups.length; i++) {
        const powerup = powerups[i]
        if (
          playerX < powerup.x + powerup.width &&
          playerX + PLAYER_WIDTH > powerup.x &&
          playerY < powerup.y + powerup.height &&
          playerY + PLAYER_HEIGHT > powerup.y
        ) {
          // Remover powerup
          setPowerups((prev) => prev.filter((p) => p.id !== powerup.id))

          // Aplicar efeito
          if (powerup.type === "shield") {
            setPlayerShield(100)
          } else if (powerup.type === "rapidFire") {
            setRapidFire(true)
          } else if (powerup.type === "multiShot") {
            setMultiShot(true)
          }

          // Criar partículas - reduced count
          const color = powerup.type === "shield" ? "#3b82f6" : powerup.type === "rapidFire" ? "#9333ea" : "#06b6d4"
          createParticles(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 8, [
            color,
            "#ffffff",
            "#38bdf8",
          ])

          // Efeito sonoro
          playSound("powerup")
          break
        }
      }
    }
  }

  // Optimize the rocket animation on the home screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-blue-950 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10 z-0">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Cabeçalho */}
      <header className="w-full p-4 flex justify-between items-center relative z-10">
        <div className="flex items-center">
          <Rocket className="h-6 w-6 text-purple-400 mr-2" />
          <h1
            className={`${tiltNeon.className} text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-300 to-blue-400`}
          >
            CYBER SHOOTER
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>

          {gameStarted && !gameOver && (
            <Button
              variant="outline"
              size="sm"
              onClick={pauseGame}
              className="border-purple-500 text-purple-300 hover:bg-purple-900/30"
            >
              {gamePaused ? "Continuar" : "Pausar"}
            </Button>
          )}
        </div>
      </header>

      {/* Área do jogo */}
      <main className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center relative z-10 p-4">
        {!gameStarted ? (
          <div className="w-full flex flex-col items-center relative">
            {/* Foguete decolando com animação - simplified */}
            <div className="absolute w-full h-full overflow-hidden -z-5 pointer-events-none">
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2"
                initial={{ y: 100 }}
                animate={{
                  y: [-50, -200, -350],
                  transition: {
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    ease: "easeInOut",
                  },
                }}
              >
                {/* Foguete estilizado - simplified */}
                <div className="relative w-40 h-64 md:w-48 md:h-80">
                  {/* Corpo do foguete */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-40 md:w-24 md:h-48 bg-gradient-to-b from-gray-100 to-gray-300 rounded-t-full"></div>

                  {/* Ponta do foguete */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-full"></div>

                  {/* Janela do foguete */}
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-cyan-300 to-blue-500 rounded-full border-2 border-gray-400"></div>

                  {/* Asas do foguete */}
                  <div className="absolute bottom-10 left-0 w-8 h-16 md:w-10 md:h-20 bg-gradient-to-r from-purple-500 to-purple-600 skew-y-[30deg] rounded-b-lg"></div>
                  <div className="absolute bottom-10 right-0 w-8 h-16 md:w-10 md:h-20 bg-gradient-to-l from-purple-500 to-purple-600 skew-y-[-30deg] rounded-b-lg"></div>

                  {/* Base do foguete */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 md:w-28 md:h-10 bg-gradient-to-r from-gray-400 to-gray-600 rounded-b-lg"></div>

                  {/* Efeito de propulsão animado - simplified */}
                  <motion.div
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-16 h-32 md:w-20 md:h-40"
                    animate={{
                      scaleY: [0.8, 1.2, 0.8],
                      transition: {
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                      },
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-t from-orange-600 via-yellow-400 to-transparent rounded-b-full opacity-80"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-24 md:w-12 md:h-32 bg-gradient-to-t from-yellow-300 via-yellow-100 to-transparent rounded-b-full opacity-60"></div>
                  </motion.div>
                </div>

                {/* Partículas de propulsão - reduced count */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 md:w-48 md:h-48">
                  {Array.from({ length: isTouchDevice ? 8 : 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: Math.random() * 6 + 2 + "px",
                        height: Math.random() * 6 + 2 + "px",
                        backgroundColor: `rgba(${255}, ${Math.floor(Math.random() * 200 + 55)}, ${Math.floor(Math.random() * 100)}, ${Math.random() * 0.7 + 0.3})`,
                        left: `calc(50% + ${Math.random() * 30 - 15}px)`,
                        bottom: `${Math.random() * 40}px`,
                      }}
                      animate={{
                        y: [0, 40],
                        opacity: [1, 0],
                        transition: {
                          duration: Math.random() * 2 + 1,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: Math.random() * 2,
                        },
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Estrelas em movimento - reduced count */}
              <div className="absolute inset-0">
                {Array.from({ length: isTouchDevice ? 30 : 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: Math.random() * 3 + 1 + "px",
                      height: Math.random() * 3 + 1 + "px",
                      top: Math.random() * 100 + "%",
                      left: Math.random() * 100 + "%",
                      opacity: Math.random() * 0.7 + 0.3,
                    }}
                    animate={{
                      y: [0, "100vh"],
                      transition: {
                        duration: Math.random() * 10 + 20,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      },
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Tela inicial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 mt-20"
            >
              <h1 className={`${tiltNeon.className} text-5xl md:text-7xl font-bold mb-4 relative`}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-300 to-blue-400 animate-pulse">
                  CYBER SHOOTER
                </span>
              </h1>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent my-6"></div>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Pilote sua nave através do ciberespaço, destrua inimigos e colete powerups neste jogo de tiro futurista.
              </p>
            </motion.div>

            {/* Instruções */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 w-full">
              <div className="bg-gray-900/80 border border-purple-500/30 rounded-lg p-6 backdrop-blur-sm">
                <h2 className={`${tiltNeon.className} text-2xl font-bold mb-4 text-purple-300`}>Como Jogar</h2>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">•</span>
                    <span>
                      {isTouchDevice ? "Deslize para controlar sua nave" : "Mova o mouse para controlar sua nave"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">•</span>
                    <span>{isTouchDevice ? "Toque para atirar nos inimigos" : "Clique para atirar nos inimigos"}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">•</span>
                    <span>Colete powerups para melhorar suas habilidades</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">•</span>
                    <span>Evite colisões com inimigos</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-900/80 border border-purple-500/30 rounded-lg p-6 backdrop-blur-sm">
                <h2 className={`${tiltNeon.className} text-2xl font-bold mb-4 text-purple-300`}>Powerups</h2>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-300">Escudo - Proteção temporária contra danos</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-300">Tiro Rápido - Aumenta a velocidade de disparo</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center mr-3">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-300">Tiro Múltiplo - Dispara três projéteis de uma vez</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pontuação e botão de início */}
            <div className="flex flex-col items-center gap-6">
              {highScore > 0 && (
                <div className="flex items-center gap-2 text-yellow-300">
                  <BarChart3 className="h-5 w-5" />
                  <span className={`${tiltNeon.className} text-xl`}>Melhor Pontuação: {highScore}</span>
                </div>
              )}

              {gameOver && (
                <div className="flex items-center gap-2 text-purple-300 mb-4">
                  <Sparkles className="h-5 w-5" />
                  <span className={`${tiltNeon.className} text-xl`}>Pontuação Final: {score}</span>
                </div>
              )}

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={startGame}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 px-10 rounded-lg shadow-lg shadow-purple-500/20 border border-purple-400/20"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  <span className={`${tiltNeon.className} text-xl`}>
                    {gameOver ? "JOGAR NOVAMENTE" : "INICIAR JOGO"}
                  </span>
                </Button>
              </motion.div>

              {isTouchDevice && (
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoShoot"
                    checked={autoShoot}
                    onChange={() => setAutoShoot(!autoShoot)}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <label htmlFor="autoShoot" className="text-gray-300">
                    Tiro automático (recomendado para dispositivos móveis)
                  </label>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-[70vh] md:h-[70vh] relative">
            {/* Overlay de pausa */}
            {gamePaused && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                <div className="text-center">
                  <h2 className={`${tiltNeon.className} text-3xl font-bold mb-6 text-purple-300`}>Jogo Pausado</h2>
                  <Button
                    onClick={pauseGame}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* Canvas do jogo */}
            <canvas
              ref={canvasRef}
              className="w-full h-full bg-gray-900/80"
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            ></canvas>
          </div>
        )}
      </main>
    </div>
  )
}

