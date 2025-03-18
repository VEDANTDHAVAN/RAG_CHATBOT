const Bubble = ({ message }) => {
  const { content, role } = message;

  return (
      <div className={`bubble ${role === 'user' ? 'user' : 'assistant'}`}>{content}</div>
  );
};

export default Bubble;