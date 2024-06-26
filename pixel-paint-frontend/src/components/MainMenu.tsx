import { useState, useEffect, FC, ChangeEvent } from 'react'
import { Modes } from '../utils/GameConstants'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import styles from './styles.module.scss'
import DropdownMenu from './GameModeMenu'
import MsgModal from './MsgModal'
import svgLogo from '../../public/PixelPaintLogo.png'
import EventsManager from '../services/EventsManager'
import { SocketEvents } from '../services/SocketEvents.model'
import { CreateRoomPayload } from '../payloads/CreateRoomPayload'
import { Errors } from '../utils/CommonErrors'

interface MainMenuProps {
    setGameMode: Function
    setPlayerID: Function
}

const MainMenu: FC<MainMenuProps> = ({
    setGameMode,
    setPlayerID
}: MainMenuProps) => {
    const [mode, setMode] = useState(0)
    const [name, setName] = useState<string>('')

    const [modalMsg, setModalMsg] = useState<string>('')
    const [showModal, setShowModal] = useState(false)
    const [isNameError, setIsNameError] = useState(false)
    const [isModeError, setIsModeError] = useState(false)

    const navigate = useNavigate()

    const handleChange = (selectedOption: string) => {
        switch (selectedOption) {
            case 'Classic':
                setMode(Modes.CLASSIC)
                break
            case 'Memory':
                setMode(Modes.MEMORY)
                break
            case 'Paint':
                setMode(Modes.PAINT)
                break
            case 'CO-OP Classic':
                setMode(Modes.CO_OP)
                break
            case 'CO-OP Memory':
                setMode(Modes.CO_OP_MEM)
                break
            case 'CO-OP Paint':
                setMode(Modes.CO_OP_PAINT)
                break
        }
    }

    const checkName = (name: string): boolean => {
        const englishAndNumbersRegex = /^[A-Za-z0-9]+$/

        return englishAndNumbersRegex.test(name)
    }

    const handleClick = () => {
        if (!name && !mode) {
            setIsNameError(true)
            setIsModeError(true)
        } else if (!checkName(name)) {
            setShowModal(true)
            setModalMsg(Errors.INVALID_NAME)
            setIsNameError(true)
            setIsModeError(false)
        } else if (name.length < 3) {
            setShowModal(true)
            setModalMsg(Errors.SHORT_NAME)
            setIsNameError(true)
            setIsModeError(false)
        } else if (name.length > 8) {
            setShowModal(true)
            setModalMsg(Errors.LONG_NAME)
            setIsNameError(true)
            setIsModeError(false)
        } else if (!mode) {
            setIsNameError(false)
            setIsModeError(true)
        } else if (!isModeError && !isNameError) {
            EventsManager.instance.trigger(SocketEvents.CREATE_ROOM, {
                playerId: name,
                gameMode: mode
            })
        }

        setTimeout(() => {
            setIsNameError(false)
            setIsModeError(false)
        }, 1000)
    }

    const onRoomCreated = (p: CreateRoomPayload) => {
        console.log(p)
        setGameMode(p.gameMode)
        setPlayerID(p.host)

        if (
            p.gameMode === Modes.CO_OP ||
            p.gameMode === Modes.CO_OP_MEM ||
            p.gameMode === Modes.CO_OP_PAINT
        ) {
            setTimeout(() => {
                navigate(`/create?roomId=${p.roomId}`)
            }, 1000)
        } else {
            setTimeout(() => {
                navigate('/game')
            }, 1000)
        }
    }

    // onMount
    useEffect(() => {
        EventsManager.instance.on(
            SocketEvents.ROOM_CREATED,
            'MainMenu',
            onRoomCreated
        )
    }, [])

    // onBeforeDestroy
    useEffect(
        () => () => {
            EventsManager.instance.on(
                SocketEvents.ROOM_CREATED,
                'MainMenu',
                onRoomCreated
            )
        },
        []
    )

    const handleCloseModal = () => {
        setShowModal(false)
        setModalMsg('')
    }

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value)
    }

    return (
        <>
            {showModal && (
                <MsgModal onClose={handleCloseModal} msg={modalMsg} />
            )}
            <section className={`${styles.mainMenuContainer}`}>
                <div className={`${styles.logoContainer}`}>
                    <img src={svgLogo} alt="Logo" className={styles.logo} />
                </div>

                <h1 style={{ color: 'white', textShadow: '1px 1px 1px black' }}>
                    Welcome to{' '}
                    <span
                        style={{
                            color: '#e0b0b0',
                            textShadow: 'black 1px 1px 1px'
                        }}
                    >
                        Pixel
                    </span>
                    Paint !
                </h1>
                <button onClick={handleClick}>
                    {mode !== Modes.CO_OP ? 'Start Game' : 'Create Game'}
                </button>
                <form>
                    <input
                        className={isNameError ? styles.inputError : ''}
                        name="players-name"
                        type="text"
                        placeholder="Enter your name..."
                        value={name}
                        maxLength={8}
                        minLength={3}
                        onChange={handleNameChange}
                    ></input>
                </form>
                <DropdownMenu
                    onSelectOption={handleChange}
                    isModeSelected={isModeError}
                />
            </section>
        </>
    )
}

export default MainMenu
