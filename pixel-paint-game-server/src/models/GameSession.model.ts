import { Modes } from "./GameConfig"

export interface Game {
  roomId: string
  score: number
  timeLeft: number
  players: string[]
  gameMode: number
  usedPresets: string[]
}

export class GameSession implements Game {
  roomId: string = ""
  score: number = -1
  timeLeft: number = 0
  players: string[] = []
  gameMode: number = 0
  usedPresets: string[] = []
  host: string = ""

  constructor(roomId: string, players: string[], gameMode: number) {
    this.host = players[0]
    this.roomId = roomId
    this.players = players
    this.gameMode = gameMode
    if (
      gameMode === Modes.CO_OP ||
      gameMode === Modes.CO_OP_MEM ||
      gameMode === Modes.CO_OP_PAINT
    )
      //if COOP
      this.timeLeft = 1200
    else this.timeLeft = 1500
  }

  incrementScore(): void {
    this.score++
  }

  addPlayer(playerId: string) {
    this.players.push(playerId)
  }

  removePlayer(playerId: string) {
    const index = this.players.findIndex((player) => player === playerId)
    if (index !== -1) {
      this.players.splice(index, 1)
    }
  }

  decrementTime() {
    if (this.timeLeft > 0) this.timeLeft--
  }

  addTime(timeToAdd?: number) {
    if (!timeToAdd || timeToAdd === 0) return
    if (this.gameMode !== Modes.CO_OP) {
      if (timeToAdd > 3) {
        this.timeLeft += 3
        return
      }
      if (timeToAdd < 3) {
        this.timeLeft += timeToAdd
        return
      }
    } else {
      if (timeToAdd > 3) {
        this.timeLeft += 2
        return
      }
      if (timeToAdd < 3) {
        this.timeLeft += timeToAdd
        return
      }
    }
  }

  addUsedPreset(preset: string) {
    this.usedPresets.push(preset)
  }
}
