import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import { io } from "socket.io-client";
import axios from "axios";

import {
  Home,
  Play,
  Share2,
  Wifi,
  Loader2,
  Copy,
} from "lucide-react";

import { toast, Toaster } from "react-hot-toast";

import "./Editor.css";

const SERVER_URL = window.location.origin;
const COLORS = [
  "#FF6B6B", "#378984", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"
];

function getColor(id) {
  const index = id.charCodeAt(0) % COLORS.length;
  return COLORS[index];
}

export default function EditorPage({ username }) {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [status, setStatus] = useState("connecting...");
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [stdin, setStdin] = useState("");
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ignoreNextChange = useRef(false);
  const decorationsRef = useRef([]);
  const emitTimeoutRef = useRef(null);
  const pendingValueRef = useRef(null);

  useEffect(() => {
    const s = io(SERVER_URL);
    socketRef.current = s;

    s.on("connect", () => {
      setStatus("connected");
      s.emit("join-document", { documentId, username });
    });

    s.on("disconnect", () => setStatus("disconnected"));

    s.on("load-document", ({ content }) => {
      ignoreNextChange.current = true;
      setCode(content || "");
      setStatus("synced");
    });

    s.on("receive-changes", ({ value }) => {
      ignoreNextChange.current = true;
      setCode(value);
    });

    s.on("online-users", (users) => setOnlineUsers(users));

    s.on("cursor-update", ({ userId, username: uname, position }) => {
      if (!editorRef.current || !monacoRef.current) return;
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      const color = getColor(userId);

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column + 1
            ),
            options: {
              beforeContentClassName: `remote-cursor-${userId}`,
              stickiness:
                monaco.editor.TrackedRangeStickiness
                  .NeverGrowsWhenTypingAtEdges,
            },
          },
        ]
      );

      const styleId = `cursor-style-${userId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        .remote-cursor-${userId}::before {
          content: "${uname}";
          background: ${color};
          color: #111;
          font-size: 11px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
          position: absolute;
          top: -20px;
          left: 0;
          white-space: nowrap;
          pointer-events: none;
          z-index: 100;
        }
        .remote-cursor-${userId} {
          border-left: 2px solid ${color} !important;
          margin-left: -1px;
        }
      `;
    });

    return () => {
      s.disconnect();
      if (emitTimeoutRef.current) {
        clearTimeout(emitTimeoutRef.current);
        emitTimeoutRef.current = null;
      }
    };
  }, [documentId, username]);

  // Monaco throws an internal "Canceled" rejection whenever an in-flight
  // validation/tokenization request is superseded by a newer one (e.g. rapid
  // typing or incoming collaborative edits). This is expected internal
  // control flow, not a real error, so we quietly swallow just that one
  // specific rejection message and let everything else surface normally.
  useEffect(() => {
    const handleRejection = (event) => {
      if (event.reason && event.reason.message === "Canceled") {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();

    editor.onDidChangeCursorPosition((e) => {
      if (socketRef.current) {
        socketRef.current.emit("cursor-move", {
          documentId,
          position: e.position,
        });
      }
    });
  };

  const handleChange = (value) => {
    setCode(value);

    if (ignoreNextChange.current) {
      ignoreNextChange.current = false;
      return;
    }

    pendingValueRef.current = value;

    // Throttle outgoing emits to at most once every 60ms so a burst of fast
    // typing doesn't flood the socket (and every collaborator's Monaco
    // instance) with a full content reset on every keystroke.
    if (!emitTimeoutRef.current) {
      emitTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && pendingValueRef.current !== null) {
          socketRef.current.emit("send-changes", {
            value: pendingValueRef.current,
            documentId,
          });
        }
        emitTimeoutRef.current = null;
      }, 60);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Room link copied!");
  };

  const handleRun = async () => {
    setRunning(true);
    setShowOutput(true);
    setOutput(null);
    try {
      const res = await axios.post(`${SERVER_URL}/run`, {
        code,
        language,
        stdin,
      });
      setOutput(res.data);
    } catch (err) {
      setOutput({ error: "Failed to run code. Try again." });
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Toaster position="bottom-right" />

      <div className="editor-container">
        <div className="toolbar">

          <div className="toolbar-left">

            <button
              className="home-btn"
              onClick={() => navigate("/")}
            >
              <Home size={17} />
              Home
            </button>

            <div className="brand">
              <span className="logo-dot" />
              <span className="brand-name">
                CodeTogether
              </span>

              <span className="room-badge">
                {documentId.slice(0, 6)}

                <Copy
                  size={13}
                  onClick={async () => {
                    await navigator.clipboard.writeText(documentId);
                    toast.success("Room ID copied!");
                  }}
                  style={{ cursor: "pointer" }}
                />
              </span>
            </div>

          </div>

          <div className="toolbar-right">

            <span className="status" data-status={status}>

              <Wifi size={13} />

              {status === "synced" || status === "connected"
                ? "LIVE"
                : status.toUpperCase()}

            </span>

            <div className="online-users">

              {onlineUsers.map(user => (

                <div
                  key={user.id}
                  className="avatar"
                  title={user.username}
                  style={{
                    background: getColor(user.id)
                  }}
                >

                  {user.username[0].toUpperCase()}

                </div>

              ))}

            </div>

            <select
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="typescript">TypeScript</option>
            </select>

            <button
              className="run-btn"
              onClick={handleRun}
              disabled={running}
            >

              {running ?

                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Running
                </>

                :

                <>
                  <Play size={15} />
                  Run
                </>

              }

            </button>

            <button
              className="copy-btn"
              onClick={handleCopyLink}
            >

              <Share2 size={15} />

              Share

            </button>

          </div>
        </div>

        <div className="editor-body">
          <div className="editor-wrapper">
            <MonacoEditor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onMount={handleEditorMount}
              onChange={handleChange}
              options={{
                fontSize: 15,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {showOutput && (
            <div className="output-panel">
              <div className="output-tabs">
                <div className="input-section">
                  <label className="input-label">Input (stdin)</label>
                  <textarea
                    className="stdin-box"
                    placeholder="Enter input for your program here..."
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                  />
                </div>

                <div className="output-section">
                  <div className="output-header">
                    <span>Output</span>
                    <button
                      className="close-output"
                      onClick={() => setShowOutput(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="output-content">
                    {running && (
                      <div className="output-loading">
                        Running code...
                      </div>
                    )}

                    {!running && output && (
                      <>
                        {output.error && (
                          <div className="output-error">{output.error}</div>
                        )}

                        {output.compile_output && (
                          <div className="output-error">
                            {output.compile_output}
                          </div>
                        )}

                        {output.stderr && (
                          <div className="output-error">
                            {output.stderr}
                          </div>
                        )}

                        {output.stdout && (
                          <pre className="output-stdout">
                            {output.stdout}
                          </pre>
                        )}

                        {!output.stdout &&
                          !output.stderr &&
                          !output.compile_output &&
                          !output.error && (
                            <div className="output-empty">
                              No output
                            </div>
                          )}

                        <div className="output-status">
                          {output.status}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
