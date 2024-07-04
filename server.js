const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const cors = require('cors')

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
      origin: "*"
    }
  });

app.use(express.static('public'));

// Define a route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle chat message event
    socket.on('joinRoom', ({ roomId, offer }) => {
        console.log('roomId:' + roomId);

        socket.join(roomId);
    });

    socket.on('offer', ({ roomId, offer }) => {
        socket.to(roomId).emit("offer", { roomId: roomId, offer: offer });
    })

    socket.on('answer', ({ roomId, answer }) => {
        socket.to(roomId).emit("answer", { roomId: roomId, answer: answer });
    })

    socket.on('ice-candidate', ({ roomId, iceCanditate }) => {
        socket.to(roomId).emit("ice-candidate", { roomId: roomId, iceCanditate: iceCanditate });
    })

    // Handle disconnect event
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});