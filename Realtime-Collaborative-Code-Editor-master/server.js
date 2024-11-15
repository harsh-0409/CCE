const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/actions/Actions');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io server
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(express.static('build'));

// In-memory store for rooms
const rooms = {};

// Create or join a room
app.post('/api/room', (req, res) => {
    const { roomId, username } = req.body;
    if (!rooms[roomId]) {
        rooms[roomId] = { users: [], code: '' };
    }
    rooms[roomId].users.push(username);
    res.status(200).json({ message: 'Joined room', users: rooms[roomId].users, code: rooms[roomId].code });
});

// Update code in a room
app.post('/api/room/:roomId/code', (req, res) => {
    const { roomId } = req.params;
    const { code } = req.body;
    if (rooms[roomId]) {
        rooms[roomId].code = code;
        res.status(200).json({ message: 'Code updated' });
    } else {
        res.status(404).json({ message: 'Room not found' });
    }
});

// Fetch code from a room
app.get('/api/room/:roomId/code', (req, res) => {
    const { roomId } = req.params;
    if (rooms[roomId]) {
        res.status(200).json({ code: rooms[roomId].code });
    } else {
        res.status(404).json({ message: 'Room not found' });
    }
});

// Serve React App for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Socket.io connection handling
const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    const { username, roomId } = socket.handshake.query;

    console.log('Socket connected:', socket.id);
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
            clients,
            username,
            socketId: socket.id,
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
    });
});

const PORT = process.env.SERVER_PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});