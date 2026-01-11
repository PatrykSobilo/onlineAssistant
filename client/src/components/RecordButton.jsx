const RecordButton = ({ isListening, onStart, onStop, disabled }) => {
  const handleClick = () => {
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={disabled}
      style={{
        ...styles.button,
        ...(isListening ? styles.listening : {}),
        ...(disabled ? styles.disabled : {})
      }}
    >
      {isListening ? (
        <>
          <span style={styles.pulse}>🔴</span>
          STOP RECORDING
        </>
      ) : (
        <>
          🎤 START RECORDING
        </>
      )}
    </button>
  );
};

const styles = {
  button: {
    padding: '1.5rem 3rem',
    fontSize: '1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: '300px',
    justifyContent: 'center'
  },
  listening: {
    backgroundColor: '#dc3545',
    animation: 'pulse 2s infinite'
  },
  disabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  pulse: {
    display: 'inline-block',
    animation: 'blink 1s infinite'
  }
};

export default RecordButton;
