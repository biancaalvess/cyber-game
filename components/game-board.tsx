"use client"

import { useEffect, useState } from "react"
import SpaceShooter from "@/components/space-shooter"

interface GameBoardProps {
  difficulty: "easy" | "medium" | "hard"
  onGameComplete: (score: number) => void
}

export default function GameBoard({ difficulty, onGameComplete }: GameBoardProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render until client-side hydration is complete
  if (!isMounted) {
    return null
  }

  return (
    <div className="w-full">
      <SpaceShooter difficulty={difficulty} onGameComplete={onGameComplete} />
    </div>
  )
}
