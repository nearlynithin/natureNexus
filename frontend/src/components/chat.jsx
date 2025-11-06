
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "../App.css";

function Messenger() {
  const location = useLocation();
  const email = location.state?.email || "Anonymous";

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { text: newMessage, sender: email }]);
      setNewMessage("");
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">🌿 Wildlife Conservation</header>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.sender === email ? "my-message" : "other-message"
            }`}
          >
            <p>{msg.text}</p>
            <span className="sender">{msg.sender}</span>
          </div>
        ))}
      </div>

      <footer className="chat-footer">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </footer>
    </div>
  );
}

export default Messenger;
