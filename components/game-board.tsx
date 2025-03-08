"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tilt_Neon } from "next/font/google"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, Check } from "lucide-react"

const tiltNeon = Tilt_Neon({ subsets: ["latin"] })

interface GameBoardProps {
  difficulty: "easy" | "medium" | "hard"
  onGameComplete: (score: number) => void
}

interface CardItem {
  id: number
  value: string
  flipped: boolean
  matched: boolean
}

const cardIcons = [
  "🎮",
  "🎧",
  "💻",
  "🤖",
  "👾",
  "🕹️",
  "📱",
  "⌚",
  "🔋",
  "💾",
  "📡",
  "🛰️",
  "🔌",
  "📟",
  "🖥️",
  "🖱️",
  "⌨️",
  "🎬",
]

export default function GameBoard({ difficulty, onGameComplete }: GameBoardProps) {
  const [cards, setCards] = useState<CardItem[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [moves, setMoves] = useState<number>(0)
  const [gameCompleted, setGameCompleted] = useState<boolean>(false)
  const [score, setScore] = useState<number>(0)

  const getGridConfig = () => {
    switch (difficulty) {
      case "easy":
        return { pairs: 6, cols: "grid-cols-3" }
      case "medium":
        return { pairs: 8, cols: "grid-cols-4" }
      case "hard":
        return { pairs: 12, cols: "grid-cols-4" }
    }
  }

  const { pairs, cols } = getGridConfig()

  useEffect(() => {
    initializeGame()
  }, [difficulty])

  const initializeGame = () => {
    const { pairs } = getGridConfig()

    // Select random icons based on difficulty
    const selectedIcons = [...cardIcons].sort(() => 0.5 - Math.random()).slice(0, pairs)

    // Create pairs of cards
    const newCards = [...selectedIcons, ...selectedIcons]
      .sort(() => 0.5 - Math.random())
      .map((value, index) => ({
        id: index,
        value,
        flipped: false,
        matched: false,
      }))

    setCards(newCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setGameCompleted(false)
  }

  const handleCardClick = (id: number) => {
    // Prevent clicking if two cards are already flipped or the card is already matched/flipped
    if (flippedCards.length === 2 || cards[id].matched || flippedCards.includes(id)) {
      return
    }

    // Flip the card
    const newCards = [...cards]
    newCards[id].flipped = true
    setCards(newCards)

    // Add to flipped cards
    const newFlippedCards = [...flippedCards, id]
    setFlippedCards(newFlippedCards)

    // Check for match if two cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves((prev) => prev + 1)

      const [firstId, secondId] = newFlippedCards
      if (cards[firstId].value === cards[secondId].value) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards]
          matchedCards[firstId].matched = true
          matchedCards[secondId].matched = true
          setCards(matchedCards)
          setFlippedCards([])
          setMatchedPairs((prev) => {
            const newMatchedPairs = prev + 1
            // Check if game is completed
            if (newMatchedPairs === pairs) {
              const calculatedScore = calculateScore()
              setScore(calculatedScore)
              setGameCompleted(true)
            }
            return newMatchedPairs
          })
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          const unflippedCards = [...cards]
          unflippedCards[firstId].flipped = false
          unflippedCards[secondId].flipped = false
          setCards(unflippedCards)
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const calculateScore = () => {
    // Base score depends on difficulty
    const baseScore = difficulty === "easy" ? 100 : difficulty === "medium" ? 200 : 300

    // Calculate penalty based on moves
    const minMoves = pairs
    const maxMoves = pairs * 3
    const movesPenalty = Math.max(0, Math.min(1, (moves - minMoves) / (maxMoves - minMoves)))

    // Final score
    return Math.round(baseScore * (1 - movesPenalty * 0.7))
  }

  const handleCompleteGame = () => {
    onGameComplete(score)
  }

  const handlePlayAgain = () => {
    initializeGame()
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {gameCompleted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900/80 border border-purple-500/30 rounded-xl p-8 text-center backdrop-blur-sm"
        >
          <div className="mb-6">
            <Check className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h2 className={`${tiltNeon.className} text-3xl font-bold mb-2 text-cyan-300`}>Nível Completo!</h2>
            <p className="text-gray-300 mb-6">Você completou o desafio em {moves} movimentos.</p>

            <div className="flex justify-center items-center mb-8">
              <div className="bg-gray-800/60 px-6 py-3 rounded-lg border border-purple-500/30 flex items-center">
                <Sparkles className="h-5 w-5 text-purple-400 mr-3" />
                <span className="text-purple-300 text-lg">Pontuação: </span>
                <span className={`${tiltNeon.className} ml-2 text-cyan-300 text-2xl`}>{score}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handlePlayAgain} className="bg-blue-600 hover:bg-blue-700 text-white">
                Jogar Novamente
              </Button>
              <Button onClick={handleCompleteGame} className="bg-purple-600 hover:bg-purple-700 text-white">
                Voltar ao Menu
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="bg-gray-800/60 px-4 py-2 rounded-lg border border-purple-500/30">
              <span className="text-gray-300">Movimentos: </span>
              <span className="text-cyan-300">{moves}</span>
            </div>
            <div className="bg-gray-800/60 px-4 py-2 rounded-lg border border-purple-500/30">
              <span className="text-gray-300">Pares: </span>
              <span className="text-cyan-300">
                {matchedPairs}/{pairs}
              </span>
            </div>
          </div>

          <div className={`grid ${cols} gap-4 md:gap-6`}>
            <AnimatePresence>
              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, rotateY: -180 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ duration: 0.5, delay: card.id * 0.05 }}
                  className="aspect-square"
                >
                  <div
                    className={cn(
                      "w-full h-full relative cursor-pointer transition-transform duration-500 transform-gpu preserve-3d",
                      card.flipped && "rotate-y-180",
                    )}
                    onClick={() => handleCardClick(card.id)}
                  >
                    {/* Card Back */}
                    <div className="absolute inset-0 backface-hidden">
                      <Card className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/60 transition-colors">
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold">?</span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Card Front */}
                    <div className="absolute inset-0 rotate-y-180 backface-hidden">
                      <Card
                        className={cn(
                          "w-full h-full flex items-center justify-center border-2",
                          card.matched
                            ? "bg-green-900/20 border-green-500/50"
                            : "bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-cyan-500/30",
                        )}
                      >
                        <span className="text-4xl">{card.value}</span>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

