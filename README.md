# CodeTogether

**Real-time Collaborative Code Editor** — Code with your friends, teammates, or classmates in real time.

Built with ❤️ to make pair programming and group coding sessions seamless.

![Demo](https://img.shields.io/badge/Live%20Demo-Visit-brightgreen)

## ✨ Live Demo

👉 **[Try it now](https://code-together-e48f.onrender.com)**

---

## Features

- **Real-time Collaboration** — Multiple users can edit the same document simultaneously
- **Live Cursor Tracking** — See where others are typing with colored cursors
- **Multi-language Support** — JavaScript, Python, C++, Java, TypeScript
- **Instant Code Execution** — Run your code directly in the browser
- **Room Sharing** — Simple shareable links
- **Beautiful & Responsive UI** — Works great on desktop and mobile

## Tech Stack

- **Frontend**: React.js + Monaco Editor (VS Code powered) + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Database**: MongoDB Atlas
- **Real-time**: Socket.io
- **Deployment**: Render

## How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/CodeCrusherG/Code-Together.git
   cd Code-Together

2. Install Dependencies
   ```bash
   # Client
    cd client
    npm install

    # Server
    cd ../server
    npm install
3. Setup Environment Variables
    ```bash
    Create a .env file inside the server folder:
    MONGO_URI=your_mongodb_connection_string_here
    PORT=5001
    Get MONGO_URI from MongoDB Atlas.

4. Run the Application
   ```bash
     cd server
     npm run dev

     cd client
     npm start



   
Project Structure




collab-editor/
├── client/          # React frontend
├── server/          # Node.js + Express backend
├── Procfile         # For Render deployment
└── README.md




