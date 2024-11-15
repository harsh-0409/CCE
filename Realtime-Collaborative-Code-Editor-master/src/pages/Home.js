import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast';
import {Link} from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = async (e) => {
        e.preventDefault();
        if (!username.trim()) {
            toast.error('Username is required to create a room');
            return;
        }
        try {
            const response = await fetch('/api/room/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Created a new room');
                navigate(`/editor/${data.roomId}`, {
                    state: { username },
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error creating room:', error);
            toast.error('Failed to create a new room');
        }
    };

    const joinRoom = async () => {
        if (!roomId.trim() || !username.trim()) {
            toast.error('ROOM ID & Username are required');
            return;
        }

        try {
            const response = await fetch('/api/room/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, username }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Joined the room');
                navigate(`/editor/${data.roomId}`, {
                    state: { username },
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error joining room:', error);
            toast.error('Failed to join the room');
        }
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <img
                    className="homePageLogo"
                    src="/logo.png"
                    alt="code-sync-logo"
                />
                <h4 className="mainLabel">Generate a new room or paste an invitation ROOM ID</h4>
                <div className="inputGroup">
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="ROOM ID"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="USERNAME"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        onKeyUp={handleInputEnter}
                    />
                    <button className="btn joinBtn" onClick={joinRoom}>
                        Join
                    </button>
                    <span className="createInfo">
                        If you don't have an invite, create &nbsp;
                        <button
                            onClick={createNewRoom}
                            className="createNewBtn"
                        >
                            a new room
                        </button>
                    </span>
                </div>
            </div>
            <footer>
                <h4>
                    Built by &nbsp;
                    <Link to="https://github.com/Mohitur669" target="_blank" rel="noopener noreferrer">Mohd Mohitur Rahaman</Link>
                </h4>
            </footer>
        </div>
    );
};

export default Home;