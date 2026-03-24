require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const initSocket = require('./src/sockets');
const connectDB = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');

// Connect to MongoDB & Redis
connectDB();
connectRedis();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
