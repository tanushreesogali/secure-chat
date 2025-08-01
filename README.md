# 🔐 Secure Chat – Real-Time Encrypted Messaging

Welcome to **Secure Chat**, a modern, full-stack real-time chat application that prioritizes **security**, **privacy**, and **integrity** using powerful cryptographic techniques.

Built with `Node.js`, `MongoDB`, and `Socket.IO`, Secure Chat enables users to exchange messages with **end-to-end AES encryption** and **RSA digital signatures**, ensuring that every message remains confidential and verifiable.

---

## 🚀 Project Highlights

### 🛡️ End-to-End Security
- **AES-CBC encryption**: Messages are symmetrically encrypted before transmission.
- **RSA-PSS signatures**: Messages are digitally signed to prevent tampering and ensure authenticity.
- **bcrypt**: Passwords are securely hashed before storage.

### 🌐 Real-Time Chat with WebSockets
- Built on **Socket.IO**, the app supports real-time two-way communication.
- Instant updates on message send/receive, user joins/leaves.

### 🧠 Smart Verification Logic
- Public key exchange is handled seamlessly.
- Messages are verified on arrival — warnings are shown if tampered or unverifiable.
- Graceful retry system for missing public keys during verification.

### 👤 User Management
- Secure user registration and login system.
- Public keys are linked to authenticated usernames in the MongoDB database.
