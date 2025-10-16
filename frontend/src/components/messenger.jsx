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
    <>
      <div>
        <h2>{connStatus ? "Connected" : "Disconnected"}</h2>
        {msgList.length > 0 && <h4>Messages:</h4>}
        <ul>
          {msgList.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
      <form onSubmit={handleSubmit} type="submit">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message"
        />
        <button type="submit">send</button>
      </form>
    </>
  );
}

export default Messenger;
