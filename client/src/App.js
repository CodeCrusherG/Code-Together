import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Menu, X, ArrowRight } from "lucide-react";
import Editor from "./components/Editor";

// Shared hero UI (video background, nav, name input + CTA) used both for
// "/" (start a brand-new room) and "/document/:id" (join an existing room
// via a shared link). `ctaLabel` and `onSubmit` are the only things that
// differ between the two usages.
function EntryScreen({ ctaLabel, onSubmit }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [roomId, setRoomId] = useState("");
  const [videoFailed, setVideoFailed] = useState(false);

  const handleCreateRoom = () => {
    localStorage.setItem("username", username);
    navigate(`/document/${uuidv4()}`);
};

const handleJoinRoom = () => {
    localStorage.setItem("username", username);
    navigate(`/document/${roomId}`);
};
  const handleStart = () => {
  if (!username.trim()) {
    alert("Enter your name");
    return;
  }

  localStorage.setItem("username", username);
  onSubmit(username);
};

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-geist">

      {/* Video Background */}
      {!videoFailed && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "70% center" }}
          onError={() => setVideoFailed(true)}
        >
          {/*
            NOTE: Pixabay's cdn.pixabay.com links are not stable long-term
            URLs — they expire. Replace this src with a video you host
            yourself (e.g. public/hero-bg.mp4) or a stable hosted URL.
          */}
          <source
            src="https://cdn.pixabay.com/video/2024/05/08/211405_large.mp4"
            type="video/mp4"
          />
        </video>
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Navbar */}
      <nav className="relative z-30 flex items-center justify-between px-6 py-5 md:px-12 lg:px-16">
        <div className="flex items-center gap-10">
          <span className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            CodeTogether
          </span>
          <div className="hidden md:flex items-center gap-8">
  <a
    href="#"
    className="text-sm text-white/80 hover:text-white transition-colors"
  >
    Home
  </a>
</div>
        </div>

        {/* Desktop CTA */}
        <button
          onClick={handleStart}
          disabled={!username.trim()}
          className="hidden md:block rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {ctaLabel}
        </button>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="relative z-50 flex h-10 w-10 items-center justify-center md:hidden"
        >
          <span
            className={`absolute transition-all duration-300 ${
              mobileMenuOpen
                ? "rotate-90 opacity-100 scale-100"
                : "rotate-0 opacity-0 scale-75"
            }`}
          >
            <X size={22} color="white" />
          </span>
          <span
            className={`absolute transition-all duration-300 ${
              mobileMenuOpen
                ? "-rotate-90 opacity-0 scale-75"
                : "rotate-0 opacity-100 scale-100"
            }`}
          >
            <Menu size={22} color="white" />
          </span>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`absolute inset-x-0 top-0 z-20 bg-black/98 backdrop-blur-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mobileMenuOpen
            ? "h-screen opacity-100"
            : "h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex h-full flex-col justify-center px-8 transition-all duration-500 delay-100 ${
            mobileMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <a
  href="#"
  onClick={() => setMobileMenuOpen(false)}
  className="py-4 text-3xl font-medium text-white/90 hover:text-white transition-colors"
>
  Home
</a>
          <button
            onClick={() => { setMobileMenuOpen(false); handleStart(); }}
            disabled={!username.trim()}
            className="mt-6 rounded-full bg-white px-8 py-3.5 text-base font-medium text-black hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 grid h-[calc(100vh-80px)] grid-cols-1 lg:grid-cols-2 items-center gap-16 px-6 pb-10 pt-12 sm:pb-12 sm:pt-16 md:px-12 md:pb-16 md:pt-20 lg:px-16">

        {/* Top */}
        <div className="max-w-3xl">
          <p
            className="mb-4 text-xs sm:text-sm text-white/90 sm:mb-6"
            style={{ animation: "fadeSlideUp 0.8s ease 0.2s both" }}
          >
            Real-time Collaboration · Multi-language Code Execution
          </p>
          <h1
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight text-white"
            style={{ animation: "fadeSlideUp 0.8s ease 0.4s both" }}
          >
            Code together, <br />
            in real time, <br />
            from anywhere.
          </h1>
        </div>

        {/* Bottom */}
        <div>
          <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">

  <h2 className="text-2xl font-semibold text-white">
    Collaboration Hub
  </h2>

  <p className="text-white/60 text-sm mt-2 mb-6">
    Create a room or join an existing one.
  </p>

  <label className="text-white/70 text-sm">
    Your Name
  </label>

  <input
    value={username}
    onChange={(e) => {
      setUsername(e.target.value);
      localStorage.setItem("username", e.target.value);
    }}
    className="mt-2 mb-5 w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
  />

  <button
    onClick={handleStart}
    className="w-full rounded-lg bg-white py-3 font-semibold text-black hover:scale-[1.02] transition"
  >
    + Create New Room
  </button>

  <div className="my-6 flex items-center">
    <div className="flex-1 border-t border-white/10"></div>
    <span className="mx-4 text-xs text-white/40">OR</span>
    <div className="flex-1 border-t border-white/10"></div>
  </div>

  <label className="text-white/70 text-sm">
    Room ID
  </label>

  <input
    value={roomId}
    onChange={(e) => setRoomId(e.target.value)}
    placeholder="Paste Room ID..."
    className="mt-2 mb-5 w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
  />

  <button
    onClick={handleJoinRoom}
    className="w-full rounded-lg border border-white/20 py-3 text-white hover:bg-white/10 transition"
  >
    Join Room
  </button>

  <div className="mt-8 space-y-3 text-sm text-white/60">
    <div>✓ Live Collaboration</div>
    <div>✓ 5 Programming Languages</div>
    <div>✓ Instant Code Execution</div>
    <div>✓ Cursor Synchronization</div>
  </div>

</div>

          {/* Name input + CTA */}
          
        </div>
      </div>
    </div>
  );
}

// "/" — start a brand-new room with a fresh random ID.
function Landing() {
  const navigate = useNavigate();

  return (
    <EntryScreen
      ctaLabel="Start Session"
      onSubmit={() => navigate(`/document/${uuidv4()}`)}
    />
  );
}

// "/document/:id" — joining an existing room (own link, teammate's shared
// link, or the address bar). Shows the SAME hero/home UI first; once a
// name is entered it renders the Editor for THIS id (never a new one).
function DocumentEntry() {
  return <Editor username={localStorage.getItem("username") || ""} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/document/:id" element={<DocumentEntry />} />
      </Routes>
    </Router>
  );
}

export default App;