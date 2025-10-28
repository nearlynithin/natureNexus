import { useState, useEffect, useRef } from "react";

function Messenger() {
  const [connStatus, setConnStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [msgList, setMsgList] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:3000`);
    socketRef.current = socket;

    socket.addEventListener("open", (event) => {
      console.log("Websocket connection opened");
      setConnStatus(true);
    });

    socket.addEventListener("close", (event) => {
      console.log("Websocket connection closed ");
      setConnStatus(false);
    });

    socket.addEventListener("message", (event) => {
      setMsgList((prev) => [...prev, event.data]);
    });

    return () => socket.close();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (socketRef.current && socketRef.current.readyState == WebSocket.OPEN) {
      socketRef.current.send(message);
      setMessage("");
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#EEEEEE] flex items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto bg-[#111111] border border-[#08CB00] rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center pb-4 border-b border-[#08CB00]/30">
          <h2 className="text-3xl font-bold">
            {connStatus ? (
              <span className="text-[#08CB00]">Connected</span>
            ) : (
              <span className="text-red-500"> Disconnected</span>
            )}
          </h2>
        </div>

        {msgList.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-[#08CB00] text-lg">Messages</h4>
            <ul className="space-y-2 max-h-64 overflow-y-auto bg-[#0a0a0a] rounded-lg p-4 border border-[#08CB00]/20">
              {msgList.map((msg, index) => (
                <li
                  key={index}
                  className="text-sm py-1 border-b border-[#08CB00]/10 last:border-0"
                >
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 w-full pt-4"
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            className="flex-1 min-w-0 bg-[#0a0a0a] text-[#EEEEEE] border border-[#08CB00] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#08CB00] placeholder-gray-500"
          />
          <button
            type="submit"
            className="flex-shrink-0 bg-[#08CB00] text-[#000000] font-semibold px-6 py-3 rounded-lg hover:bg-[#06a300] transition-colors duration-200 active:scale-95 transform"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Messenger;
