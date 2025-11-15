import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Messenger() {
  const [connStatus, setConnStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [msgList, setMsgList] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgList, pendingMessages]);

  useEffect(() => {
    const token = localStorage.getItem("token") || location.state?.token;
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : location.state?.user;

    if (!token || !user) {
      navigate("/");
      return;
    }

    setCurrentUser(user);
    fetchUsers(token);
    fetchMessages(token);
    fetchPendingMessages(token);

    const socket = new WebSocket("ws://localhost:3000");
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      console.log("WebSocket connection opened");
      setConnStatus(true);
      socket.send(JSON.stringify({ type: "auth", token }));
    });

    socket.addEventListener("close", () => {
      console.log("WebSocket connection closed");
      setConnStatus(false);
    });

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          // If it's a broadcast message from a regular user, add to pending for admins
          if (!data.recipientId && data.senderRole === "user") {
            if (user.role === "admin") {
              setPendingMessages((prev) => [
                ...prev,
                {
                  id: data.messageId || Date.now() + Math.random(),
                  senderId: data.senderId,
                  senderName: data.senderName,
                  senderRole: data.senderRole,
                  content: data.content,
                  timestamp: data.timestamp,
                  status: "pending",
                },
              ]);
            }
          } else {
            // Admin broadcasts or direct messages show immediately
            setMsgList((prev) => [
              ...prev,
              {
                id: data.messageId || Date.now() + Math.random(),
                senderId: data.senderId,
                senderName: data.senderName,
                senderRole: data.senderRole,
                content: data.content,
                timestamp: data.timestamp,
                recipientId: data.recipientId,
                status: data.status || "approved",
              },
            ]);
          }
        } else if (data.type === "message_approved") {
          setPendingMessages((prev) =>
            prev.filter((msg) => msg.id !== data.messageId),
          );
          setMsgList((prev) => [
            ...prev,
            {
              ...data.message,
              id: data.messageId,
            },
          ]);
        } else if (data.type === "message_rejected") {
          setPendingMessages((prev) =>
            prev.filter((msg) => msg.id !== data.messageId),
          );
        } else if (data.type === "auth" && !data.success) {
          console.error("WebSocket authentication failed");
          navigate("/");
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    });

    return () => socket.close();
  }, [navigate, location]);

  const fetchUsers = async (token) => {
    try {
      const response = await fetch("http://localhost:3000/chat/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchMessages = async (token, recipientId = null) => {
    try {
      const url = recipientId
        ? `http://localhost:3000/messages?recipientId=${recipientId}`
        : "http://localhost:3000/messages";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMsgList(
          data.reverse().map((msg) => ({
            id: msg._id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderRole: msg.senderRole,
            content: msg.content,
            image: msg.image,
            timestamp: msg.timestamp,
            recipientId: msg.recipientId,
            status: msg.status || "approved",
          })),
        );
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const fetchPendingMessages = async (token) => {
    if (currentUser?.role !== "admin") return;

    try {
      const response = await fetch("http://localhost:3000/messages/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingMessages(
          data.map((msg) => ({
            id: msg._id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderRole: msg.senderRole,
            content: msg.content,
            timestamp: msg.timestamp,
            status: msg.status,
          })),
        );
      }
    } catch (err) {
      console.error("Error fetching pending messages:", err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: "message",
        content: message.trim(),
        recipientId: selectedUser?.id || null,
        image: image || null,
      };

      socketRef.current.send(JSON.stringify(payload));
      setMessage("");
      setImage(null);
    }
  };

  const handleApproveMessage = async (msg) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/messages/${msg.id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        if (
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(
            JSON.stringify({
              type: "approve_message",
              messageId: msg.id,
            }),
          );
        }
      }
    } catch (err) {
      console.error("Error approving message:", err);
    }
  };

  const handleRejectMessage = async (msg) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/messages/${msg.id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setPendingMessages((prev) => prev.filter((m) => m.id !== msg.id));
        if (
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(
            JSON.stringify({
              type: "reject_message",
              messageId: msg.id,
            }),
          );
        }
      }
    } catch (err) {
      console.error("Error rejecting message:", err);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    const token = localStorage.getItem("token");
    fetchMessages(token, user.id);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (socketRef.current) {
      socketRef.current.close();
    }
    navigate("/");
  };

  const filteredMessages = selectedUser
    ? msgList.filter(
        (msg) =>
          msg.senderId === selectedUser.id ||
          msg.recipientId === selectedUser.id ||
          (msg.senderId === currentUser?.id &&
            msg.recipientId === selectedUser.id),
      )
    : msgList.filter((msg) => !msg.recipientId && msg.status === "approved");

  return (
    <div className="min-h-screen bg-[#000000] text-[#EEEEEE] flex p-4">
      {/* Sidebar */}
      <div className="w-64 bg-[#111111] border border-[#08CB00] rounded-2xl p-4 mr-4 flex flex-col">
        <div className="mb-4 pb-4 border-b border-[#08CB00]/30">
          <h3 className="text-lg font-bold text-[#08CB00] mb-1">
            {currentUser?.name}
          </h3>
          <span className="text-xs text-gray-400 block mb-2">
            {currentUser?.role === "admin" ? "👑 Admin" : "User"}
          </span>
          <div className="mt-2">
            <span
              className={`text-sm ${connStatus ? "text-[#08CB00]" : "text-red-500"}`}
            >
              {connStatus ? "● Connected" : "● Disconnected"}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedUser(null);
            const token = localStorage.getItem("token");
            fetchMessages(token);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg mb-3 transition-colors font-medium ${
            !selectedUser
              ? "bg-[#08CB00] text-[#000000]"
              : "hover:bg-[#08CB00]/20"
          }`}
        >
          📡 Broadcasts
          {currentUser?.role === "admin" && pendingMessages.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingMessages.length}
            </span>
          )}
        </button>

        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm font-semibold text-[#08CB00] mb-2 px-1">
            Direct Messages
          </h4>
          {users.length === 0 ? (
            <p className="text-xs text-gray-500 px-3 py-2">
              No users available
            </p>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                  selectedUser?.id === user.id
                    ? "bg-[#08CB00] text-[#000000]"
                    : "hover:bg-[#08CB00]/20"
                }`}
              >
                <div className="text-sm font-medium truncate">{user.name}</div>
                <div className="text-xs text-gray-400">
                  {user.role === "admin" ? "👑 Admin" : "📱 " + user.phone}
                </div>
              </button>
            ))
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-2 rounded-lg mt-4 hover:bg-red-700 transition-colors font-medium"
        >
          Logout
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-[#111111] border border-[#08CB00] rounded-2xl p-6 flex flex-col">
        <div className="pb-4 border-b border-[#08CB00]/30 mb-4">
          <h2 className="text-2xl font-bold text-[#08CB00]">
            {selectedUser ? (
              <>
                💬 Chat with {selectedUser.name}
                <span className="text-sm text-gray-400 ml-2">
                  {selectedUser.role === "admin" ? "(Admin)" : ""}
                </span>
              </>
            ) : (
              "📡 Broadcasts"
            )}
          </h2>
        </div>

        {/* Pending Messages (Admin Only) */}
        {currentUser?.role === "admin" &&
          !selectedUser &&
          pendingMessages.length > 0 && (
            <div className="mb-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                ⏳ Pending Approval ({pendingMessages.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pendingMessages.map((msg) => (
                  <div key={msg.id} className="bg-[#0a0a0a] rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-semibold text-gray-300">
                          {msg.senderName}
                        </span>
                        <p className="text-sm text-gray-200 mt-1">
                          {msg.content}
                          {msg.image && (
                            <img
                              src={msg.image}
                              className="mt-2 max-h-56 rounded-lg border border-[#08CB00]/30"
                              alt=""
                            />
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApproveMessage(msg)}
                        className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded hover:bg-green-700 transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectMessage(msg)}
                        className="flex-1 bg-red-600 text-white text-xs py-1.5 rounded hover:bg-red-700 transition-colors"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-[#0a0a0a] rounded-lg p-4 border border-[#08CB00]/20">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-center">
                {selectedUser
                  ? `No messages with ${selectedUser.name} yet. Start the conversation!`
                  : "No broadcast messages yet. Be the first to send one!"}
              </p>
            </div>
          ) : (
            <>
              {filteredMessages.map((msg) => {
                const isOwnMessage = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? "bg-[#08CB00] text-[#000000]"
                          : "bg-[#222222] text-[#EEEEEE]"
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {msg.senderName}
                          </span>
                          {msg.senderRole === "admin" && (
                            <span className="text-xs">👑</span>
                          )}
                        </div>
                      )}
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {msg.image && (
                        <img
                          src={msg.image}
                          className="mt-2 max-h-56 rounded-lg border border-[#08CB00]/30"
                          alt=""
                        />
                      )}
                      <span
                        className={`text-xs mt-1 block ${isOwnMessage ? "opacity-70" : "opacity-50"}`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              selectedUser
                ? `Message ${selectedUser.name}...`
                : currentUser?.role === "admin"
                  ? "Broadcast to everyone..."
                  : "Your message will need admin approval..."
            }
            className="flex-1 bg-[#0a0a0a] text-[#EEEEEE] border border-[#08CB00] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#08CB00] placeholder-gray-500"
            disabled={!connStatus}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setImage(reader.result);
              reader.readAsDataURL(file);
            }}
            className="text-sm text-gray-400"
          />
          <button
            type="submit"
            disabled={!connStatus || !message.trim()}
            className="bg-[#08CB00] text-[#000000] font-semibold px-6 py-3 rounded-lg hover:bg-[#06a300] transition-colors duration-200 active:scale-95 transform disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>

        {currentUser?.role === "user" && !selectedUser && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            ℹ️ Your broadcast messages will be visible after admin approval
          </p>
        )}
      </div>
    </div>
  );
}

export default Messenger;
