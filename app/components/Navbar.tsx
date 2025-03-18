const Navbar = ({ chats, onNewChat, onSelectChat }) => {
    return (
      <aside className="navbar">
        <button onClick={onNewChat}>+ New Chat</button>
        <ul>
          {chats.map((chat) => (
            <li key={chat.id} onClick={() => onSelectChat(chat.id)}>
              {chat.name}
            </li>
          ))}
        </ul>
      </aside>
    );
  };
  
  export default Navbar;