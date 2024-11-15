import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { language, cmtheme } from '../atoms';
import { useRecoilState } from 'recoil';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import ACTIONS from '../actions/Actions';
import { initSocket } from '../socket';

const EditorPage = () => {
    const [lang, setLang] = useRecoilState(language);
    const [theme, setTheme] = useRecoilState(cmtheme);
    const [clients, setClients] = useState([]);
    const socketRef = useRef(null);
    const codeRef = useRef('');
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId } = useParams();

    useEffect(() => {
        const init = async () => {
            try {
                socketRef.current = initSocket();

                socketRef.current.on('connect_error', (err) => handleErrors(err));
                socketRef.current.on('connect_failed', (err) => handleErrors(err));

                function handleErrors(e) {
                    console.log('Socket error:', e);
                    toast.error('Socket connection failed, try again later.');
                    navigate('/');
                }

                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                });

                // Listening for joined event
                socketRef.current.on(
                    ACTIONS.JOINED,
                    ({ clients, username, socketId }) => {
                        if (username !== location.state?.username) {
                            toast.success(`${username} joined the room.`);
                            console.log(`${username} joined`);
                        }
                        setClients(clients);
                        socketRef.current.emit(ACTIONS.SYNC_CODE, {
                            code: codeRef.current,
                            socketId,
                        });
                    }
                );

                // Listening for disconnected
                socketRef.current.on(
                    ACTIONS.DISCONNECTED,
                    ({ socketId, username }) => {
                        toast.success(`${username} left the room.`);
                        setClients((prev) => prev.filter(
                            (client) => client.socketId !== socketId
                        ));
                    }
                );

                // Listening for code change
                socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                    if (code !== null) {
                        codeRef.current = code;
                        // Optionally, you can update the editor directly here
                    }
                });

            } catch (error) {
                console.error('Error initializing socket:', error);
            }
        };

        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.CODE_CHANGE);
                socketRef.current.disconnect();
            }
        };
    }, [roomId, location.state, navigate]);

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    };

    const leaveRoom = () => {
        navigate('/');
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img className="logoImage" src="/logo.png" alt="logo" />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>

                <label>
                    Select Language:
                    <select
                        value={lang}
                        onChange={(e) => { setLang(e.target.value); window.location.reload(); }}
                        className="seLang"
                    >
                        {/* Language options */}
                        <option value="javascript">JavaScript</option>
                        {/* Add other options as needed */}
                    </select>
                </label>

                <label>
                    Select Theme:
                    <select
                        value={theme}
                        onChange={(e) => { setTheme(e.target.value); window.location.reload(); }}
                        className="seLang"
                    >
                        {/* Theme options */}
                        <option value="default">Default</option>
                        <option value="monokai">Monokai</option>
                        {/* Add other options as needed */}
                    </select>
                </label>

                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>

            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                        socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
                    }}
                    language={lang}
                    theme={theme}
                />
            </div>
        </div>
    );
};

export default EditorPage;