import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { Chatbot } from './chatbot';
import { ChatMessage } from './types';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize chatbot
const chatbot = new Chatbot();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('chat_message', async (data) => {
    try {
      const { message, history } = data;
      console.log('Received message:', message);
      
      // Convert history to proper format
      const chatHistory: ChatMessage[] = history || [];
      
      // Get response from chatbot
      const response = await chatbot.chat(message, chatHistory);
      
      // Send response back to client
      socket.emit('chat_response', { response });
      
    } catch (error) {
      console.error('Error processing chat message:', error);
      socket.emit('chat_response', { 
        error: 'Sorry, I encountered an error processing your message.' 
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} to start chatting`);
});
