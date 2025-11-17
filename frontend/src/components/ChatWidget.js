import React, { useEffect, useRef, useState } from 'react';
import faqData from '../../data/faq.json';

const STORAGE_KEY = 'aqrov2_guest_chat_history';

function tryParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

const ChatWidget = ({ isLoggedIn = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef(null);

  const hasAsyncStorage = typeof global !== 'undefined' && global?.AsyncStorage;

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function loadHistory() {
    try {
      let raw;

      if (hasAsyncStorage && global.AsyncStorage?.getItem) {
        raw = await global.AsyncStorage.getItem(STORAGE_KEY);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(STORAGE_KEY);
      }

      const parsed = tryParseJSON(raw);

      if (parsed && Array.isArray(parsed)) {
        setMessages(parsed);
      } else {
        const greeting = {
          from: 'ai',
          text: "Hi! I'm AQRO Assistant. Ask me about login, registration, or how to use the platform.",
          timestamp: new Date().toISOString()
        };
        setMessages([greeting]);
        await persistMessages([greeting]);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  }

  async function persistMessages(array) {
    try {
      const serialized = JSON.stringify(array);

      if (hasAsyncStorage && global.AsyncStorage?.setItem) {
        await global.AsyncStorage.setItem(STORAGE_KEY, serialized);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      }
    } catch (err) {
      console.error('Failed to persist chat history', err);
    }
  }

  function matchFAQ(message) {
    if (!message || typeof message !== 'string') return null;

    const text = message.toLowerCase();
    let best = null;
    let bestScore = 0;

    for (const item of faqData) {
      let score = 0;

      for (const kw of item.keywords) {
        if (text.includes(kw.toLowerCase())) score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    if (bestScore >= 1) return best.reply;

    return "I can help with login and registration. Please log in to ask broader questions.";
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = {
      from: 'user',
      text: trimmed,
      timestamp: new Date().toISOString()
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    await persistMessages(nextMessages);

    setTyping(true);

    setTimeout(async () => {
      const replyText = matchFAQ(trimmed);
      const botMsg = {
        from: 'ai',
        text: replyText,
        timestamp: new Date().toISOString()
      };

      const updated = [...nextMessages, botMsg];
      setMessages(updated);
      await persistMessages(updated);
      setTyping(false);
    }, 600);
  }

  async function handleClear() {
    const greeting = {
      from: 'ai',
      text: "Hi! I'm AQRO Assistant. Ask me about login, registration, or how to use the platform.",
      timestamp: new Date().toISOString()
    };

    setMessages([greeting]);
    await persistMessages([greeting]);
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <span>
          AQRO Assistant
          <span style={styles.statusSmall}>
            {isLoggedIn ? " (logged in)" : " (guest)"}
          </span>
        </span>

        <button style={styles.clearBtn} onClick={handleClear}>
          ✕
        </button>
      </div>

      {/* BODY */}
      <div style={styles.body} ref={bodyRef}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              ...styles.messageRow,
              ...(m.from === 'user' ? styles.msgUser : styles.msgBot)
            }}
          >
            <div
              style={{
                ...styles.bubble,
                ...(m.from === 'user' ? styles.bubbleUser : styles.bubbleBot)
              }}
            >
              {m.text}
              <div style={styles.timestamp}>
                {new Date(m.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ ...styles.messageRow, ...styles.msgBot }}>
            <div style={styles.typingBubble}>Typing...</div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <input
          type="text"
          placeholder="Ask about login, registration..."
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />

        <button style={styles.sendBtn} onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "320px",
    maxWidth: "100%",
    border: "1px solid #ddd",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    fontFamily: "Arial, sans-serif",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    zIndex: 99999
  },

  header: {
    background: "linear-gradient(90deg, #2b8aed, #3bb1ff)",
    color: "white",
    padding: "12px",
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  statusSmall: {
    fontSize: "12px",
    color: "#eee",
    marginLeft: "6px"
  },

  clearBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "18px"
  },

  body: {
    maxHeight: "360px",
    overflowY: "auto",
    padding: "12px",
    background: "#fafafa",
    flexGrow: 1
  },

  messageRow: {
    marginBottom: "10px",
    display: "flex"
  },

  msgUser: {
    justifyContent: "flex-end"
  },

  msgBot: {
    justifyContent: "flex-start"
  },

  bubble: {
    maxWidth: "80%",
    padding: "10px 12px",
    borderRadius: "14px",
    lineHeight: 1.2,
    background: "#f1f1f1",
    color: "#222",
    wordBreak: "break-word"
  },

  bubbleUser: {
    background: "#2b8aed",
    color: "#fff",
    borderBottomRightRadius: "4px"
  },

  bubbleBot: {
    background: "#f1f1f1",
    borderBottomLeftRadius: "4px"
  },

  timestamp: {
    fontSize: "10px",
    color: "#999",
    marginTop: "6px"
  },

  typingBubble: {
    padding: "10px 12px",
    background: "#f1f1f1",
    borderRadius: "14px",
    maxWidth: "50%"
  },

  footer: {
    display: "flex",
    gap: "8px",
    padding: "8px",
    borderTop: "1px solid #eee"
  },

  input: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none"
  },

  sendBtn: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#2b8aed",
    color: "white"
  }
};

export default ChatWidget;