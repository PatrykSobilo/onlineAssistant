const TranscriptionDisplay = ({ transcript, interimTranscript, isListening }) => {
  if (!isListening && !transcript) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          {isListening ? '🎤 Listening...' : '📝 Transcription'}
        </h3>
      </div>
      
      <div style={styles.content}>
        {transcript && (
          <p style={styles.finalText}>
            {transcript}
          </p>
        )}
        
        {interimTranscript && (
          <p style={styles.interimText}>
            {interimTranscript}
          </p>
        )}
        
        {!transcript && !interimTranscript && isListening && (
          <p style={styles.placeholder}>
            Start speaking... 🗣️
          </p>
        )}
      </div>
      
      {transcript && (
        <div style={styles.info}>
          <small style={styles.charCount}>
            {transcript.length} characters
          </small>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '700px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #f0f0f0'
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  content: {
    minHeight: '100px',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    lineHeight: '1.6'
  },
  finalText: {
    color: '#333',
    fontSize: '1rem',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  interimText: {
    color: '#999',
    fontSize: '1rem',
    margin: 0,
    fontStyle: 'italic',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  placeholder: {
    color: '#bbb',
    fontSize: '1rem',
    margin: 0,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  info: {
    marginTop: '0.5rem',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  charCount: {
    color: '#999',
    fontSize: '0.85rem'
  }
};

export default TranscriptionDisplay;
