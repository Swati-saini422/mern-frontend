import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Message from "./Message";

function ChatWindow({ messages: initialMessages, onMessagesUpdate, voiceSpeed, darkMode, userAvatar, userName }) {
  const [messages, setMessages] = useState(initialMessages || [
    { id: 0, sender: "bot", text: "👋 Hello! I'm your AI assistant. How can I help you today?", reactions: {}, timestamp: new Date(), pinned: false, edited: false }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedForReaction, setSelectedForReaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [messageStats, setMessageStats] = useState({ userCount: 0, botCount: 0, totalChars: 0 });
  const [showImport, setShowImport] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const messagesEndRef = useRef(null);
  const recognition = useRef(null);
  const fileInputRef = useRef(null);

  const quickReplies = [
    "That's great! 👍",
    "Tell me more 🤔",
    "I understand 💭",
    "Thanks! 🙏",
    "Show me an example 📝"
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (window.webkitSpeechRecognition) {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognition.current.onend = () => {
        setIsRecording(false);
      };

      recognition.current.onerror = () => {
        setIsRecording(false);
      };
    }
  }, []);
  const updateStats = React.useCallback(() => {
  const userCount = messages.filter(m => m.sender === "user").length;
  const botCount = messages.filter(m => m.sender === "bot").length;
  const totalChars = messages.reduce(
    (sum, m) => sum + (m.text ? m.text.length : 0),
    0
  );

  setMessageStats({ userCount, botCount, totalChars });
  setPinnedMessages(messages.filter(m => m.pinned));
}, [messages]);

// Update stats
useEffect(() => {
  updateStats();
}, [messages, updateStats]);

// Auto-scroll to bottom
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

// Persist messages
useEffect(() => {
  if (onMessagesUpdate) {
    onMessagesUpdate(messages);
  }
}, [messages, onMessagesUpdate]);

  const startVoice = () => {
    if (recognition.current && !isRecording) {
      setIsRecording(true);
      recognition.current.start();
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = voiceSpeed || 1;
      speech.pitch = 1;
      window.speechSynthesis.speak(speech);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const userMsg = { 
      id: Date.now(), 
      sender: "user", 
      text: userMessage, 
      reactions: {}, 
      timestamp: new Date(),
      pinned: false,
      edited: false
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await axios.post("https://ai-chatbot-2f68.onrender.com/chat", {
        message: userMessage,
        sessionId: "chat-session"
      });

      const botReply = res.data.reply;
      const botMsg = { 
        id: Date.now() + 1, 
        sender: "bot", 
        text: botReply, 
        reactions: {},
        timestamp: new Date(),
        pinned: false,
        edited: false
      };

      setMessages((prev) => [...prev, botMsg]);
      speak(botReply);

    } catch (error) {
      console.error("Error:", error);
      const errorMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: "❌ Sorry, I'm having trouble connecting. Please check if the server is running.",
        reactions: {},
        timestamp: new Date(),
        pinned: false,
        edited: false
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingId) {
        saveEdit(editingId);
      } else {
        sendMessage();
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(Date.now());
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteMessage = (messageId) => {
    if (window.confirm('Delete this message?')) {
      setMessages(messages.filter(m => m.id !== messageId));
    }
  };

  const startEdit = (messageId, text) => {
    setEditingId(messageId);
    setEditText(text);
  };

  const saveEdit = (messageId) => {
    if (editText.trim()) {
      setMessages(messages.map(m =>
        m.id === messageId ? { ...m, text: editText.trim(), edited: true } : m
      ));
    }
    setEditingId(null);
    setEditText("");
  };

  const togglePin = (messageId) => {
    setMessages(messages.map(m =>
      m.id === messageId ? { ...m, pinned: !m.pinned } : m
    ));
  };

  const addReaction = (messageId, emoji) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const newReactions = { ...msg.reactions };
        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));
    setSelectedForReaction(null);
  };

  const exportChat = (format = 'txt') => {
    const chatContent = format === 'json' 
      ? JSON.stringify(messages, null, 2)
      : messages.map(m => `${m.sender.toUpperCase()}: ${m.text}\n[${new Date(m.timestamp).toLocaleString()}]`).join('\n\n');
    
    const element = document.createElement('a');
    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(chatContent)}`);
    element.setAttribute('download', `chat-${new Date().toISOString().slice(0, 10)}.${format}`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const importChat = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        let importedMessages = [];

        if (file.type === 'application/json') {
          importedMessages = JSON.parse(content);
        } else {
          // Parse text format
          const lines = content.split('\n\n');
          importedMessages = lines
            .filter(line => line.trim())
            .map((line, idx) => {
              const match = line.match(/^(USER|BOT):\s(.+)/);
              if (match) {
                return {
                  id: Date.now() + idx,
                  sender: match[1].toLowerCase(),
                  text: match[2],
                  reactions: {},
                  timestamp: new Date(),
                  pinned: false,
                  edited: false
                };
              }
              return null;
            })
            .filter(m => m !== null);
        }

        if (importedMessages.length > 0) {
          setMessages([...messages, ...importedMessages]);
          setShowImport(false);
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing messages. Make sure the file is valid.');
      }
    };
    reader.readAsText(file);
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      setMessages([]);
      setEditingId(null);
    }
  };

  const filteredMessages = messages.filter(msg =>
    msg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayMessages = searchTerm ? filteredMessages : messages;

  return (
    <div className={`chat-window ${darkMode ? "dark" : ""} ${fullscreenMode ? "fullscreen" : ""}`}>
      <div className="chat-header">
        <div className="header-left">
          <h1>🤖 AI Chat Assistant</h1>
        </div>
        
        <div className="chat-controls">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-box"
          />
          
          <button 
            onClick={() => setShowStats(!showStats)} 
            title="Show stats" 
            className="icon-btn"
          >
            📊
          </button>

          <div className="export-menu">
            <button title="Export chat" className="icon-btn">
              💾
            </button>
            <div className="export-options">
              <button onClick={() => exportChat('txt')}>Export as TXT</button>
              <button onClick={() => exportChat('json')}>Export as JSON</button>
            </div>
          </div>

          <button 
            onClick={() => setShowImport(!showImport)} 
            title="Import chat" 
            className="icon-btn"
          >
            📂
          </button>

          {showImport && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json"
              onChange={importChat}
              style={{ display: 'none' }}
            />
          )}

          {showImport && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="import-btn"
            >
              Choose file to import
            </button>
          )}

          <button onClick={clearChat} title="Clear chat" className="icon-btn">
            🗑️
          </button>

          <button 
            onClick={() => setFullscreenMode(!fullscreenMode)} 
            title="Toggle fullscreen" 
            className="icon-btn"
          >
            {fullscreenMode ? '↙️' : '↗️'}
          </button>
        </div>
      </div>

      {showStats && (
        <div className={`stats-panel ${darkMode ? 'dark' : ''}`}>
          <div className="stat-item">
            👤 User Messages: <strong>{messageStats.userCount}</strong>
          </div>
          <div className="stat-item">
            🤖 Bot Messages: <strong>{messageStats.botCount}</strong>
          </div>
          <div className="stat-item">
            📝 Total Characters: <strong>{messageStats.totalChars}</strong>
          </div>
          <div className="stat-item">
            📌 Pinned Messages: <strong>{pinnedMessages.length}</strong>
          </div>
        </div>
      )}

      {pinnedMessages.length > 0 && (
        <div className={`pinned-section ${darkMode ? 'dark' : ''}`}>
          <div className="pinned-header">📌 Pinned Messages ({pinnedMessages.length})</div>
          <div className="pinned-messages">
            {pinnedMessages.map(msg => (
              <div key={msg.id} className={`pinned-msg ${msg.sender}`}>
                <span className="pinned-text">{msg.text.substring(0, 50)}...</span>
                <button 
                  onClick={() => togglePin(msg.id)}
                  className="unpin-btn"
                  title="Unpin"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`messages ${searchTerm ? 'filtered' : ''}`}>
        {displayMessages.length === 0 && !searchTerm ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>Start a conversation by typing a message!</p>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="empty-state">
            <p>No messages found matching "{searchTerm}"</p>
          </div>
        ) : null}

        {displayMessages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.pinned ? 'pinned' : ''}`}>
            {msg.id === editingId ? (
              <div className="message-edit-box">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Edit message..."
                  autoFocus
                />
                <div className="edit-buttons">
                  <button onClick={() => saveEdit(msg.id)} className="save-btn">
                    ✓ Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="cancel-btn">
                    ✕ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Message 
                  sender={msg.sender} 
                  text={msg.text}
                  edited={msg.edited}
                  timestamp={msg.timestamp}
                />
                <div className="message-actions">
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(msg.text)}
                    title="Copy message"
                  >
                    {copiedId === msg.id ? '✓' : '📋'}
                  </button>

                  {msg.sender === "user" && (
                    <button
                      className="edit-btn"
                      onClick={() => startEdit(msg.id, msg.text)}
                      title="Edit message"
                    >
                      ✏️
                    </button>
                  )}

                  {msg.sender === "user" && (
                    <button
                      className="delete-btn"
                      onClick={() => deleteMessage(msg.id)}
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  )}

                  <button
                    className={`pin-btn ${msg.pinned ? 'pinned' : ''}`}
                    onClick={() => togglePin(msg.id)}
                    title={msg.pinned ? "Unpin" : "Pin message"}
                  >
                    📌
                  </button>

                  <button
                    className="reaction-btn"
                    onClick={() => setSelectedForReaction(selectedForReaction === msg.id ? null : msg.id)}
                    title="Add reaction"
                  >
                    😊
                  </button>

                  {selectedForReaction === msg.id && (
                    <div className="reaction-menu">
                      {['😀', '😂', '😍', '🤔', '👍', '👎', '🔥', '🎉', '❤️', '💯'].map(emoji => (
                        <button
                          key={emoji}
                          className="reaction-option"
                          onClick={() => addReaction(msg.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="reactions">
                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                      <span key={emoji} className="reaction-badge">
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="message bot">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {displayMessages.length > 1 && !isLoading && !searchTerm && (
        <div className="quick-replies">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              className="quick-reply-btn"
              onClick={() => {
                setInput(reply);
              }}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <div className="input-box">
        <div className="input-container">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={editingId ? "Editing message..." : "Type your message here..."}
            disabled={isLoading}
          />
        </div>

        <button
          className={`voice-button ${isRecording ? 'recording' : ''}`}
          onClick={startVoice}
          disabled={isLoading}
          title="Voice input"
        >
          🎤
        </button>

        <button
          className="send-button"
          onClick={() => editingId ? saveEdit(editingId) : sendMessage()}
          disabled={(!input.trim() && !editingId) || isLoading}
          title={editingId ? "Save edit" : "Send message"}
        >
          {isLoading ? '⏳' : editingId ? '✓' : '➤'}
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
