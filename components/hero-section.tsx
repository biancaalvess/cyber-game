"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tilt_Neon } from "next/font/google"
import { Sparkles, Trophy, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const tiltNeon = Tilt_Neon({ subsets: ["latin"] })

interface HeroSectionProps {
  startGame: () => void
  difficulty: "easy" | "medium" | "hard"
  setDifficulty: (difficulty: "easy" | "medium" | "hard") => void
  score: number
  bestScore: number
}

export default function HeroSection({ startGame, difficulty, setDifficulty, score, bestScore }: HeroSectionProps) {
  const [glitchText, setGlitchText] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchText(true)
      setTimeout(() => setGlitchText(false), 200)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] relative">
      <div className="absolute top-0 right-0 left-0 h-40 bg-gradient-to-b from-purple-600/10 to-transparent"></div>
      <div className="absolute bottom-0 right-0 left-0 h-40 bg-gradient-to-t from-blue-600/10 to-transparent"></div>

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-purple-500/70"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.5 + 0.3,
          }}
          animate={{
            y: [null, Math.random() * -100, Math.random() * 100],
            x: [null, Math.random() * -100, Math.random() * 100],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 relative"
      >
        <h1
          className={cn(
            "text-5xl md:text-7xl font-bold mb-4 relative",
            tiltNeon.className,
            glitchText && "animate-glitch",
          )}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-300 to-blue-400">
            CYBER MEMORY
          </span>
        </h1>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent my-6"></div>
        <p className="text-gray-300 text-lg max-w-2xl">
          Teste sua memória neste desafio cyberpunk. Combine os cartões e desbloqueie sua pontuação máxima em um mundo
          de neon e tecnologia.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 w-full max-w-4xl">
        <Card className="bg-gray-900/60 border-purple-500/30 backdrop-blur-sm overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 group-hover:opacity-100 opacity-0 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <h2 className={`${tiltNeon.className} text-2xl font-bold mb-4 text-purple-300`}>Como Jogar</h2>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">1.</span>
                  <span>Clique em um cartão para virá-lo</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">2.</span>
                  <span>Tente encontrar o par correspondente</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">3.</span>
                  <span>Combine todos os cartões para completar o nível</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">4.</span>
                  <span>Quanto menos tentativas, maior sua pontuação</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/60 border-purple-500/30 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6">
            <h2 className={`${tiltNeon.className} text-2xl font-bold mb-4 text-purple-300`}>Dificuldade</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Button
                variant={difficulty === "easy" ? "default" : "outline"}
                onClick={() => setDifficulty("easy")}
                className={cn(
                  "border-cyan-500/50",
                  difficulty === "easy"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10",
                )}
              >
                Fácil
              </Button>
              <Button
                variant={difficulty === "medium" ? "default" : "outline"}
                onClick={() => setDifficulty("medium")}
                className={cn(
                  "border-purple-500/50",
                  difficulty === "medium"
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-gray-400 hover:text-purple-300 hover:bg-purple-500/10",
                )}
              >
                Médio
              </Button>
              <Button
                variant={difficulty === "hard" ? "default" : "outline"}
                onClick={() => setDifficulty("hard")}
                className={cn(
                  "border-blue-500/50",
                  difficulty === "hard"
                    ? "bg-blue-500/20 text-blue-300"
                    : "text-gray-400 hover:text-blue-300 hover:bg-blue-500/10",
                )}
              >
                Difícil
              </Button>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-gray-300">Melhor Pontuação:</span>
              </div>
              <span className={`${tiltNeon.className} text-xl text-yellow-300`}>{bestScore}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 text-purple-400 mr-2" />
                <span className="text-gray-300">Pontuação Atual:</span>
              </div>
              <span className={`${tiltNeon.className} text-xl text-purple-300`}>{score}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={startGame}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 px-10 rounded-lg shadow-lg shadow-purple-500/20 border border-purple-400/20"
        >
          <Zap className="mr-2 h-5 w-5" />
          <span className={`${tiltNeon.className} text-xl`}>INICIAR JOGO</span>
        </Button>
      </motion.div>
    </div>
  )
}

