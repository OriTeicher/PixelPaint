import { Server, Socket } from 'socket.io'
import { SocketEvents } from './SocketEvents'
import uniqid from 'uniqid'
import { generateTiles } from '../utils'
import { MapData, Tile } from '../models'

export class SocketManager {
    private static _activeGames: Record<string, GameSession> = {}


    public static init(io: Server, socket: Socket) {
        return new SocketManager(io, socket)
    }

    private get rooms() {
        return this._io.sockets.adapter.rooms
    }
    
    private _roomExists(roomId: string) {
        return this.rooms.get(roomId)
    }


    constructor(private _io: Server, private _socket: Socket) {
        const onHandlers: { [key: string]: any } = {
            ['disconnect']: () => {
                console.log('user disconnected')
            },
            [SocketEvents.PING]: this._onPing.bind(this),
            [SocketEvents.CREATE_ROOM]: this._createRoom.bind(this),
            [SocketEvents.JOIN_ROOM]: this._joinRoom.bind(this),
            [SocketEvents.GENERATE_PRESET]: this._generatePreset.bind(this),
            [SocketEvents.SELECT_TILE]: this._selectTile.bind(this),
        }

        Object.entries(onHandlers).forEach(([key, value]) =>
            this._socket.on(key, value)
        )

        // send socket connected to client
        this._socket.emit(SocketEvents.CONNECTED, { message: 'connected' })
    }

    private _onPing() {
        this._socket.emit(SocketEvents.PONG, { message: 'pong' })
    }

    private _createRoom() {
        const roomId = uniqid('room-')

        SocketManager._activeGames[roomId] = {}
        this._socket.join(roomId.toString())
        this._socket.emit(SocketEvents.ROOM_CREATED, { roomId })
    }

    
    private _joinRoom(roomId: string, playerId: string) {
        if (!roomId || !playerId) {
            this._sendError('joinRoom', 'There was an issue, please try again', 'Missing Variables')
            return
        }
        if (!this._roomExists(roomId)) {
            this._sendError('joinRoom', 'There was an issue, please try again', `This room ${roomId} does not exist.`)
            return
        }

        this._socket.join(roomId)

        this._io.sockets.in(roomId).emit(SocketEvents.ROOM_JOINED, playerId)
    }

    private _generatePreset(roomId: string, playerId: string, mapData: MapData) {
        // if (!roomId) {
        //     this._sendError('generatePreset', 'There was an issue, please try again', 'Missing Variables')
        //     return
        // }
        // if (!this._roomExists(roomId)) {
        //     this._sendError('generatePreset', 'There was an issue, please try again', `This room ${roomId} does not exist.`)
        //     return
        // }

        if (playerId !== SocketManager._activeGames[roomId].host) {
            return
        }

        const preset = generateTiles(mapData)
        SocketManager._activeGames[roomId].usedPresets.push(preset.name)
        this._io.sockets.in(roomId).emit(SocketEvents.PRESET_GENERATED, preset)
    }

    private _selectTile(roomId: string, player: string, tile: Tile) {
        // if (!roomId || !player || !tile) {
        //     this._sendError('selectTile', 'There was an issue, please try again', 'Missing Variables')
        //     return
        // }
        // if (!this._roomExists(roomId)) {
        //     this._sendError('selectTile', 'There was an issue, please try again', `This room ${roomId} does not exist.`)
        //     return
        // }

        this._io.sockets.in(roomId).emit(SocketEvents.TILE_SELECTED, { player, tile })
    }

    
    private _sendError(where?: string, message?: string, error?: unknown) {
        this._socket.emit(SocketEvents.ERROR, where, message ?? `There was an issue`, error)
    }
}