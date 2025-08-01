const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

mongoose.connect('mongodb://localhost:27017/crypto');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  publicKey: { type: Array }
});

const User = mongoose.model('users', UserSchema);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve('./public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    res.status(200).json({ message: 'Login successful', username: username });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

let onlineUsers = 0;
const userMap = new Map();
const publicKeyMap = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('set-username', (username) => {
    onlineUsers++;
    userMap.set(socket.id, username);
    io.emit('user-joined', { count: onlineUsers, username: username });
    console.log(`${username} joined the chat`);
  });

  socket.on('register-public-key', async (data) => {
    try {
      const { username, publicKey } = data;
      publicKeyMap.set(username, publicKey);
      await User.updateOne(
        { username },
        { $set: { publicKey } },
        { upsert: true }
      );
      console.log(`Registered public key for ${username}`);
      
      socket.broadcast.emit('public-key', {
        username: username,
        publicKey: publicKey
      });

      const existingUsers = Array.from(publicKeyMap.keys());
      for (const user of existingUsers) {
        if (user !== username) {
          socket.emit('public-key', {
            username: user,
            publicKey: publicKeyMap.get(user)
          });
        }
      }
    } catch (err) {
      console.error('Error handling public key registration:', err);
    }
  });

  socket.on('disconnect', () => {
    if (userMap.has(socket.id)) {
      onlineUsers--;
      const username = userMap.get(socket.id);
      io.emit('user-left', { count: onlineUsers, username: username });
      userMap.delete(socket.id);
      console.log(`${username} left the chat`);
    }
  });

  socket.on('user-message', (data) => {
    const username = userMap.get(socket.id) || 'Anonymous';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    console.log(`Encrypted message from ${username} with RSA-PSS signature: ${data.text}`);
    io.emit('message', {
      text: data.text,
      signature: data.signature,
      username: username,
      timestamp: timestamp
    });
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});