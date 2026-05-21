import React from "react";

function Message({ sender, text, edited, timestamp }) {
  const displayTime = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

  return (
    <div className={`message ${sender}`}>
      <div className="message-avatar">
        {sender === "user" ? "👤" : "🤖"}
      </div>
      <div className="message-content">
        <div className="message-text">{text}</div>
        <div className="message-info">
          {edited && <span className="edited-label">(edited)</span>}
          <span className="message-timestamp">{displayTime}</span>
        </div>
      </div>
    </div>
  );
}

export default Message;