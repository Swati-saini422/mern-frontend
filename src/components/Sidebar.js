import React from "react";

function Sidebar({
  conversations,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onSettingsClick,
  onDarkModeToggle,
  darkMode,
  userName
}) {
  return (
    <div className={`sidebar ${darkMode ? "dark" : ""}`}>
      <div className="sidebar-header">
        <h2>💬 Chats</h2>
        <button className="new-chat-btn" onClick={onNewChat} title="New chat">
          <span>+</span> New
        </button>
      </div>

      <div className="chat-list">
        {conversations.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="chat-title">
              {chat.title || `Chat ${chat.id}`}
            </div>
            <div className="chat-meta">
              {chat.messages.length} messages
            </div>
            <button
              className="delete-chat-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              title="Delete chat"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <div className="user-name">{userName}</div>
            <div className="user-status">Online</div>
          </div>
        </div>

        <div className="sidebar-buttons">
          <button
            className={`theme-btn ${darkMode ? 'dark' : 'light'}`}
            onClick={onDarkModeToggle}
            title="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            className="settings-btn"
            onClick={onSettingsClick}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;