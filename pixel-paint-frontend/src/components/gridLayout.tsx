import { useState, useEffect, FC, useRef } from 'react'
import { Tile } from '../models'
import styles from './styles.module.scss'
import { clone, cloneDeep } from 'lodash'
import { Modes } from '../utils/GameConstants'
import { Colors } from '../utils/ColorsConstants'
import ColorPicker from './ColorPicker'
import EventsManager from '../services/EventsManager'
import { SocketEvents } from '../services/SocketEvents.model'
import { TileSelectedPayload } from '../payloads/TileSelectedPayload'
import '../assets/GameBoardStyle.scss'
interface GridLayoutProps {
    rows: number
    columns: number
    picture: boolean
    showPicture?: boolean
    score?: number
    clickableCanvas?: boolean
    puzzle: Tile[]
    gameMode?: number
    onTileClicked?: Function
    onClearClicked?: Function
}

const GridLayout: FC<GridLayoutProps> = ({
    rows,
    columns,
    picture,
    showPicture,
    score,
    clickableCanvas,
    puzzle,
    onTileClicked,
    onClearClicked,
    gameMode
}: GridLayoutProps) => {
    // todo: Dont be a bad js developer
    var prevColor = ''
    const [canvas, setCanvas] = useState(cloneDeep(puzzle))
    const [tempColor, setTempColor] = useState(Colors.TILE_COLOR_A)
    const [color, setColor] = useState(Colors.TILE_COLOR_A)
    const [tileSize, setTileSize] = useState(getTileSize())
    const [picTileSize, setPicTileSize] = useState(getPicTileSize())
    const stateRef = useRef<any>()
    stateRef.current = canvas

    useEffect(() => {
        function handleResize() {
            setTileSize(getTileSize())
            setPicTileSize(getPicTileSize())
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        const newCanvas = cloneDeep(puzzle)
        if (!picture) {
            for (const tile of newCanvas) {
                tile.highlighted = false
                tile.color = ''
            }
        }
        setCanvas(newCanvas)
    }, [puzzle])

    useEffect(() => {
        function handleResize() {
            setTileSize(getTileSize())
            setPicTileSize(getPicTileSize())
        }

        const handleColorChange = ({ detail: color }: any) => {
            changeColor(color)
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('color-change' as any, handleColorChange)

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('color-change' as any, handleColorChange)
        }
    }, [])

    function getTileSize() {
        return '100%'
    }

    function getPicTileSize() {
        return '25px'
    }

    const handleMouseUp = (index: number) => {
        if (clickableCanvas) {
            let toHighlight = false
            let toColor = ''

            if (gameMode === Modes.PAINT || gameMode === Modes.CO_OP_PAINT) {
                if (!canvas[index].highlighted) {
                    toHighlight = true
                    toColor = ''
                } else if (
                    canvas[index].highlighted &&
                    canvas[index].color === color
                ) {
                    toHighlight = false
                    toColor = ''
                } else {
                    if (canvas[index].color !== color) toHighlight = true
                }
                prevColor = canvas[index].color || ''
                toColor = color
            } else {
                toHighlight = !canvas[index].highlighted
            }

            if (onTileClicked) {
                onTileClicked(index, toHighlight, toColor, prevColor)
            }
        }
    }

    const changeColor = (color: string) => {
        if (clickableCanvas) {
            setTempColor(color)
        }
    }

    const onTileSelected = (tileSelected: TileSelectedPayload) => {
        const { tileIndex, highlighted, color, prevColor } = tileSelected

        stateRef.current[tileIndex].highlighted = highlighted
        stateRef.current[tileIndex].color = !highlighted ? '' : color

        setCanvas(cloneDeep(stateRef.current))
    }

    useEffect(() => {
        if (!picture) {
            // Attach the event listener
            EventsManager.instance.on(
                SocketEvents.TILE_SELECTED,
                `GridLayout-${picture ? 'picture' : 'template'}`,
                onTileSelected
            )

            // Cleanup the event listener
            return () => {
                EventsManager.instance.off(
                    SocketEvents.TILE_SELECTED,
                    `GridLayout-${picture ? 'picture' : 'template'}`
                )
            }
        }
    }, [])

    useEffect(() => {
        if (
            score !== undefined &&
            score < 3 &&
            (tempColor === Colors.TILE_COLOR_D ||
                tempColor === Colors.TILE_COLOR_E ||
                tempColor === Colors.TILE_COLOR_F)
        )
            return
        if (
            score !== undefined &&
            score < 10 &&
            (tempColor === Colors.TILE_COLOR_E ||
                tempColor === Colors.TILE_COLOR_F)
        )
            return
        if (
            score !== undefined &&
            score < 20 &&
            tempColor === Colors.TILE_COLOR_F
        )
            return
        setColor(tempColor)
    }, [tempColor])

    const handleMouseDown = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.preventDefault()
    }

    const clearHighlightedTiles = () => {
        if (!picture) {
            const newCanvas = cloneDeep(stateRef.current)
            for (const tile of newCanvas) {
                tile.highlighted = false
                tile.color = ''
            }
            setCanvas(newCanvas)
            if (onClearClicked) {
                onClearClicked()
            }
        }
    }

    const handleClearClicked = () => {
        if (!picture)
            EventsManager.instance.trigger(SocketEvents.ON_CLEAR_CLICK, {
                picture
            })
    }
    // onMount
    useEffect(() => {
        if (!picture)
            EventsManager.instance.on(
                SocketEvents.CLEAR_CLICKED,
                'gridLayout',
                clearHighlightedTiles
            )
    }, [])
    // onBeforeDestroy
    useEffect(
        () => () => {
            if (!picture)
                EventsManager.instance.off(
                    SocketEvents.CLEAR_CLICKED,
                    'gridLayout'
                )
        },
        []
    )

    return (
        <>
            {picture &&
                (gameMode === Modes.PAINT ||
                    gameMode === Modes.CO_OP_PAINT) && (
                    <ColorPicker score={score} />
                )}
            <div className={picture ? 'preset-container' : 'board-container'}>
                {Array.from({ length: rows }, (_, i) => {
                    return (
                        <>
                            {Array.from({ length: columns }, (_, j) => {
                                const index = i * columns + j
                                const currTile = canvas[index]
                                const isHighlighted = currTile?.highlighted
                                return (
                                    <div
                                        className={
                                            picture
                                                ? 'preset-tile'
                                                : 'board-tile'
                                        }
                                        key={`${i}-${j}`}
                                        style={{
                                            backgroundColor: isHighlighted
                                                ? currTile.color
                                                    ? currTile.color
                                                    : Colors.TILE_COLOR_HIGHLIGHTED
                                                : Colors.TILE_COLOR_DEFAULT,

                                            visibility: showPicture
                                                ? 'visible'
                                                : 'hidden'
                                        }}
                                        onMouseDown={handleMouseDown}
                                        onMouseUp={() => handleMouseUp(index)}
                                    ></div>
                                )
                            })}
                        </>
                    )
                })}
            </div>
        </>
    )
}

export default GridLayout
