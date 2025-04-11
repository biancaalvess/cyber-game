"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tilt_Neon } from 'next/font/google'
import { Sparkles, Trophy } from 'lucide-react'

const tiltNeon = Tilt_Neon({ subsets: ["latin"] })

interface SpaceShooterProps {
    difficulty: "easy" | "medium" | "hard"
    onGameComplete: (score: number) => void
    }

    interface GameObject {
    x: number
    y: number
    width: number
    height: number
    speed: number
    active: boolean
    }

    interface Ship extends GameObject {
    lives: number
    }

    interface Enemy extends GameObject {
    type: "small" | "medium" | "large"
    points: number
    }

    interface Bullet extends GameObject {
    direction: "up" | "down"
    }

    interface Star {
    x: number
    y: number
    size: number
    speed: number
    }

    export default function SpaceShooter({ difficulty, onGameComplete }: SpaceShooterProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    
    // Game state refs to avoid dependency issues in animation loop
    const shipRef = useRef<Ship | null>(null)
    const enemiesRef = useRef<Enemy[]>([])
    const bulletsRef = useRef<Bullet[]>([])
    const starsRef = useRef<Star[]>([])
    const keysRef = useRef<{ [key: string]: boolean }>({})
    const lastEnemySpawnRef = useRef<number>(0)
    const animationFrameRef = useRef<number>(0)
    const gameOverRef = useRef<boolean>(false)
    const scoreRef = useRef<number>(0)
    const isPausedRef = useRef<boolean>(false)
    
    // Difficulty settings
    const difficultySettings = {
        easy: {
        enemySpawnRate: 1500,
        enemySpeed: 2,
        bulletSpeed: 7,
        maxEnemies: 10,
        },
        medium: {
        enemySpawnRate: 1000,
        enemySpeed: 3,
        bulletSpeed: 8,
        maxEnemies: 15,
        },
        hard: {
        enemySpawnRate: 700,
        enemySpeed: 4,
        bulletSpeed: 9,
        maxEnemies: 20,
        },
    }
    
    const settings = difficultySettings[difficulty]

    // Initialize game
    useEffect(() => {
        setIsMounted(true)
        
        // Initialize game only after component is mounted
        if (!canvasRef.current) return
        
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        
        // Set canvas dimensions
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        
        // Initialize ship
        shipRef.current = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 100,
        width: 50,
        height: 50,
        speed: 5,
        active: true,
        lives: 3,
        }
        
        // Initialize stars
        starsRef.current = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1,
        }))
        
        // Event listeners
        const handleKeyDown = (e: KeyboardEvent) => {
        keysRef.current[e.key] = true
        
        // Space to shoot
        if (e.key === " " && !isPausedRef.current && !gameOverRef.current) {
            fireBullet()
        }
        
        // P to pause
        if (e.key === "p") {
            togglePause()
        }
        }
        
        const handleKeyUp = (e: KeyboardEvent) => {
        keysRef.current[e.key] = false
        }
        
        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)
        
        // Start game loop
        gameLoop(0)
        
        // Cleanup
        return () => {
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
        cancelAnimationFrame(animationFrameRef.current)
        }
    }, [difficulty])
    
    // Update refs when state changes
    useEffect(() => {
        gameOverRef.current = gameOver
        scoreRef.current = score
        isPausedRef.current = isPaused
    }, [gameOver, score, isPaused])
    
    const togglePause = () => {
        setIsPaused(prev => !prev)
    }
    
    const fireBullet = () => {
        if (!shipRef.current || gameOverRef.current) return
        
        const ship = shipRef.current
        
        const bullet: Bullet = {
        x: ship.x + ship.width / 2 - 2,
        y: ship.y,
        width: 4,
        height: 10,
        speed: settings.bulletSpeed,
        active: true,
        direction: "up",
        }
        
        bulletsRef.current.push(bullet)
    }
    
    const spawnEnemy = () => {
        if (!canvasRef.current) return
        
        const canvas = canvasRef.current
        const enemyTypes = [
        { type: "small", width: 30, height: 30, points: 100 },
        { type: "medium", width: 40, height: 40, points: 50 },
        { type: "large", width: 50, height: 50, points: 25 },
        ]
        
        const typeIndex = Math.floor(Math.random() * enemyTypes.length)
        const enemyType = enemyTypes[typeIndex]
        
        const enemy: Enemy = {
        x: Math.random() * (canvas.width - enemyType.width),
        y: -enemyType.height,
        width: enemyType.width,
        height: enemyType.height,
        speed: settings.enemySpeed,
        active: true,
        type: enemyType.type as "small" | "medium" | "large",
        points: enemyType.points,
        }
        
        enemiesRef.current.push(enemy)
    }
    
    const checkCollisions = () => {
        if (!shipRef.current) return
        
        const ship = shipRef.current
        const bullets = bulletsRef.current
        const enemies = enemiesRef.current
        
        // Check bullet-enemy collisions
        bullets.forEach(bullet => {
        if (!bullet.active) return
        
        enemies.forEach(enemy => {
            if (!enemy.active) return
            
            if (
            bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y
            ) {
            // Collision detected
            bullet.active = false
            enemy.active = false
            setScore(prev => prev + enemy.points)
            scoreRef.current += enemy.points
            }
        })
        })
        
        // Check ship-enemy collisions
        enemies.forEach(enemy => {
        if (!enemy.active || !ship.active) return
        
        if (
            ship.x < enemy.x + enemy.width &&
            ship.x + ship.width > enemy.x &&
            ship.y < enemy.y + enemy.height &&
            ship.y + ship.height > enemy.y
        ) {
            // Collision detected
            enemy.active = false
            ship.lives -= 1
            
            if (ship.lives <= 0) {
            ship.active = false
            setGameOver(true)
            gameOverRef.current = true
            }
        }
        })
    }
    
    const updateGameObjects = (deltaTime: number) => {
        if (!canvasRef.current || !shipRef.current) return
        
        const canvas = canvasRef.current
        const ship = shipRef.current
        
        // Update ship position
        if (keysRef.current["ArrowLeft"] || keysRef.current["a"]) {
        ship.x = Math.max(0, ship.x - ship.speed)
        }
        if (keysRef.current["ArrowRight"] || keysRef.current["d"]) {
        ship.x = Math.min(canvas.width - ship.width, ship.x + ship.speed)
        }
        if (keysRef.current["ArrowUp"] || keysRef.current["w"]) {
        ship.y = Math.max(canvas.height / 2, ship.y - ship.speed)
        }
        if (keysRef.current["ArrowDown"] || keysRef.current["s"]) {
        ship.y = Math.min(canvas.height - ship.height, ship.y + ship.speed)
        }
        
        // Update bullets
        bulletsRef.current.forEach(bullet => {
        if (!bullet.active) return
        
        if (bullet.direction === "up") {
            bullet.y -= bullet.speed
            
            // Remove bullets that go off screen
            if (bullet.y + bullet.height < 0) {
            bullet.active = false
            }
        } else {
            bullet.y += bullet.speed
            
            // Remove bullets that go off screen
            if (bullet.y > canvas.height) {
            bullet.active = false
            }
        }
        })
        
        // Update enemies
        enemiesRef.current.forEach(enemy => {
        if (!enemy.active) return
        
        enemy.y += enemy.speed
        
        // Remove enemies that go off screen
        if (enemy.y > canvas.height) {
            enemy.active = false
        }
        })
        
        // Update stars
        starsRef.current.forEach(star => {
        star.y += star.speed
        
        // Reset stars that go off screen
        if (star.y > canvas.height) {
            star.y = 0
            star.x = Math.random() * canvas.width
        }
        })
        
        // Clean up inactive objects
        bulletsRef.current = bulletsRef.current.filter(bullet => bullet.active)
        enemiesRef.current = enemiesRef.current.filter(enemy => enemy.active)
        
        // Spawn new enemies
        if (
        Date.now() - lastEnemySpawnRef.current > settings.enemySpawnRate &&
        enemiesRef.current.length < settings.maxEnemies
        ) {
        spawnEnemy()
        lastEnemySpawnRef.current = Date.now()
        }
        
        // Check collisions
        checkCollisions()
    }
    
    const renderGame = () => {
        if (!canvasRef.current || !shipRef.current) return
        
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        
        // Clear canvas
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw stars
        starsRef.current.forEach(star => {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
        })
        
        // Draw ship
        const ship = shipRef.current
        if (ship.active) {
        ctx.fillStyle = "#3b82f6" // Blue
        ctx.beginPath()
        ctx.moveTo(ship.x + ship.width / 2, ship.y)
        ctx.lineTo(ship.x, ship.y + ship.height)
        ctx.lineTo(ship.x + ship.width, ship.y + ship.height)
        ctx.closePath()
        ctx.fill()
        
        // Draw ship engine
        ctx.fillStyle = "#ef4444" // Red
        ctx.beginPath()
        ctx.moveTo(ship.x + ship.width / 3, ship.y + ship.height)
        ctx.lineTo(ship.x + ship.width / 2, ship.y + ship.height + 10)
        ctx.lineTo(ship.x + (2 * ship.width) / 3, ship.y + ship.height)
        ctx.closePath()
        ctx.fill()
        }
        
        // Draw bullets
        ctx.fillStyle = "#22c55e" // Green
        bulletsRef.current.forEach(bullet => {
        if (bullet.active) {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
        }
        })
        
        // Draw enemies
        enemiesRef.current.forEach(enemy => {
        if (!enemy.active) return
        
        switch (enemy.type) {
            case "small":
            ctx.fillStyle = "#ef4444" // Red
            break
            case "medium":
            ctx.fillStyle = "#f97316" // Orange
            break
            case "large":
            ctx.fillStyle = "#8b5cf6" // Purple
            break
        }
        
        ctx.beginPath()
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height)
        ctx.lineTo(enemy.x, enemy.y)
        ctx.lineTo(enemy.x + enemy.width, enemy.y)
        ctx.closePath()
        ctx.fill()
        })
        
        // Draw UI
        ctx.fillStyle = "#fff"
        ctx.font = "20px Arial"
        ctx.textAlign = "left"
        ctx.fillText(`Score: ${scoreRef.current}`, 20, 30)
        
        ctx.textAlign = "right"
        ctx.fillText(`Lives: ${ship.lives}`, canvas.width - 20, 30)
        
        // Draw pause screen
        if (isPausedRef.current) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = "#fff"
        ctx.font = "30px Arial"
        ctx.textAlign = "center"
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2)
        ctx.font = "20px Arial"
        ctx.fillText("Press 'P' to continue", canvas.width / 2, canvas.height / 2 + 40)
        }
        
        // Draw game over screen
        if (gameOverRef.current) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = "#fff"
        ctx.font = "30px Arial"
        ctx.textAlign = "center"
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20)
        ctx.font = "20px Arial"
        ctx.fillText(`Final Score: ${scoreRef.current}`, canvas.width / 2, canvas.height / 2 + 20)
        }
    }
    
    const gameLoop = (timestamp: number) => {
        if (!isPausedRef.current && !gameOverRef.current) {
        updateGameObjects(timestamp)
        }
        
        renderGame()
        
        animationFrameRef.current = requestAnimationFrame(gameLoop)
    }
    
    const restartGame = () => {
        if (!canvasRef.current) return
        
        const canvas = canvasRef.current
        
        // Reset game state
        shipRef.current = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 100,
        width: 50,
        height: 50,
        speed: 5,
        active: true,
        lives: 3,
        }
        
        enemiesRef.current = []
        bulletsRef.current = []
        lastEnemySpawnRef.current = 0
        
        setScore(0)
        scoreRef.current = 0
        setGameOver(false)
        gameOverRef.current = false
    }
    
    const handleGameComplete = () => {
        onGameComplete(score)
    }
    
    // Don't render until client-side hydration is complete
    if (!isMounted) {
        return null
    }

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="w-full relative">
            <canvas
            ref={canvasRef}
            className="w-full h-[600px] bg-black rounded-lg border border-purple-500/30"
            />
            
            {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
                <h2 className={`${tiltNeon.className} text-3xl font-bold mb-4 text-cyan-300`}>Game Over</h2>
                
                <div className="flex items-center mb-6">
                <div className="bg-gray-800/60 px-6 py-3 rounded-lg border border-purple-500/30 flex items-center">
                    <Sparkles className="h-5 w-5 text-purple-400 mr-3" />
                    <span className="text-purple-300 text-lg">Final Score: </span>
                    <span className={`${tiltNeon.className} ml-2 text-cyan-300 text-2xl`}>{score}</span>
                </div>
                </div>
                
                <div className="flex gap-4">
                <Button
                    onClick={restartGame}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Play Again
                </Button>
                <Button
                    onClick={handleGameComplete}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    Back to Menu
                </Button>
                </div>
            </div>
            )}
        </div>
        
        <div className="mt-6 w-full flex justify-between items-center">
            <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-gray-300">Controls: Arrow keys to move, Space to shoot, P to pause</span>
            </div>
        </div>
        </div>
    )
}
