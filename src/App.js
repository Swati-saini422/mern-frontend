import React, { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem("conversations");
    if (saved) return JSON.parse(saved);
    return [{ id: 1, title: "Chat 1", messages: [] }];
  });

  const [currentChatId, setCurrentChatId] = useState(1);
  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem("userSettings");
    return saved ? JSON.parse(saved) : {
      userName: "User",
      voiceSpeed: 1,
      theme: "light",
      enableNotifications: true,
      autoSaveChat: true,
      messageLimit: -1 // unlimited
    };
  });

  const [showSettings, setShowSettings] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("userSettings", JSON.stringify(userSettings));
  }, [userSettings]);

  const handleNewChat = () => {
    const newId = Math.max(...conversations.map(c => c.id), 0) + 1;
    const newChat = { id: newId, title: `Chat ${newId}`, messages: [] };
    setConversations([...conversations, newChat]);
    setCurrentChatId(newId);
  };

  const handleDeleteChat = (chatId) => {
    if (conversations.length === 1) return;
    const remaining = conversations.filter(c => c.id !== chatId);
    setConversations(remaining);
    setCurrentChatId(remaining[0].id);
  };

  const updateCurrentChat = (messages) => {
    setConversations(conversations.map(c =>
      c.id === currentChatId ? { ...c, messages, title: messages[0]?.text?.substring(0, 30) || `Chat ${c.id}` } : c
    ));
  };

  const currentChat = conversations.find(c => c.id === currentChatId);

  return (
    <div className={`app ${darkMode ? "dark-mode" : ""}`}>
      <Sidebar
        conversations={conversations}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onSettingsClick={() => setShowSettings(true)}
        onDarkModeToggle={() => setDarkMode(!darkMode)}
        darkMode={darkMode}
        userName={userSettings.userName}
      />
      <ChatWindow
        key={currentChatId}
        messages={currentChat?.messages || []}
        onMessagesUpdate={updateCurrentChat}
        voiceSpeed={userSettings.voiceSpeed}
        darkMode={darkMode}
      />
      {showSettings && (
        <SettingsPanel
          userSettings={userSettings}
          onUpdate={setUserSettings}
          onClose={() => setShowSettings(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// Settings Panel Component
function SettingsPanel({ userSettings, onUpdate, onClose, darkMode }) {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  const saveApiKey = () => {
    localStorage.setItem("googleApiKey", apiKey);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  return (
    <div className={`settings-overlay ${darkMode ? "dark" : ""}`}>
      <div className={`settings-panel ${darkMode ? "dark" : ""}`}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          {/* User Profile */}
          <div className="settings-section">
            <h3>👤 Profile</h3>
            
            <div className="setting-item">
              <label>User Name:</label>
              <input
                type="text"
                value={userSettings.userName}
                onChange={(e) => onUpdate({...userSettings, userName: e.target.value})}
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Voice Settings */}
          <div className="settings-section">
            <h3>🎤 Voice & Audio</h3>
            
            <div className="setting-item">
              <label>Voice Speed:</label>
              <div className="range-wrapper">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={userSettings.voiceSpeed}
                  onChange={(e) => onUpdate({...userSettings, voiceSpeed: parseFloat(e.target.value)})}
                />
                <span className="range-value">{userSettings.voiceSpeed}x</span>
              </div>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={userSettings.enableNotifications}
                  onChange={(e) => onUpdate({...userSettings, enableNotifications: e.target.checked})}
                />
                Enable Notifications
              </label>
            </div>
          </div>

          {/* Display Settings */}
          <div className="settings-section">
            <h3>🎨 Display</h3>
            
            <div className="setting-item">
              <label>Theme:</label>
              <select
                value={userSettings.theme}
                onChange={(e) => onUpdate({...userSettings, theme: e.target.value})}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>

          {/* Chat Settings */}
          <div className="settings-section">
            <h3>💬 Chat Settings</h3>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={userSettings.autoSaveChat}
                  onChange={(e) => onUpdate({...userSettings, autoSaveChat: e.target.checked})}
                />
                Auto-save Conversations
              </label>
            </div>

            <div className="setting-item">
              <label>Message History Limit:</label>
              <input
                type="number"
                value={userSettings.messageLimit === -1 ? "" : userSettings.messageLimit}
                onChange={(e) => onUpdate({
                  ...userSettings, 
                  messageLimit: e.target.value === "" ? -1 : parseInt(e.target.value)
                })}
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          {/* API Settings */}
          <div className="settings-section">
            <h3>🔑 API Configuration</h3>
            
            <div className="setting-item">
              <label>Google Generative AI Key:</label>
              <div className="api-key-input">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your GOOGLE_API_KEY"
                />
                <button 
                  className="toggle-visibility"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? "Hide" : "Show"}
                >
                  {showApiKey ? "🙈" : "👁️"}
                </button>
              </div>
              <small>Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></small>
              <button onClick={saveApiKey} className="save-api-btn">
                💾 Save API Key
              </button>
              {savedSettings && <span className="save-indicator">✓ Saved!</span>}
            </div>
          </div>

          <div className="settings-footer">
            <button className="settings-done-btn" onClick={onClose}>✓ Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;