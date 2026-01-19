import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import RecordButton from '../components/RecordButton';
import TranscriptionDisplay from '../components/TranscriptionDisplay';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [language, setLanguage] = useState('en-US');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(language);

  const handleAskAI = async (textToSend = null) => {
    const messageToSend = textToSend || transcript;
    if (!messageToSend || messageToSend.trim().length === 0) {
      setError('Proszę wpisać lub nagrać wiadomość');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAiResponse(null);

    try {
      const response = await api.post('/ai/chat', {
        message: messageToSend
      });
      
      setAiResponse(response.data.response);
      console.log('AI Response:', response.data.response);
    } catch (err) {
      console.error('AI chat failed:', err);
      setError(err.response?.data?.message || 'Failed to get AI response');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    resetTranscript();
    setAiResponse(null);
    setError(null);
    setManualInput('');
  };

  const handleSendText = () => {
    if (manualInput.trim()) {
      // Update transcript with manual input
      resetTranscript();
      // Manually set the transcript (we'll need to modify this)
      const syntheticEvent = { target: { value: manualInput } };
      // Since we can't directly set transcript, we'll use it in handleAskAI
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <main style={styles.main}>
          <div style={styles.hero}>
            <h2 style={styles.title}>Witaj w Asystencie! 🎉</h2>
            <p style={styles.subtitle}>Twój asystent AI z rozpoznawaniem mowy jest gotowy</p>
          </div>
          
          {!isSupported && (
            <div style={styles.alert}>
              ⚠️ Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome, Edge lub Safari.
            </div>
          )}
          
        <div style={styles.languageSelector}>
          <label style={styles.label}>Language:</label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isListening}
            style={styles.select}
          >
            <option value="en-US">🇺🇸 English (US)</option>
            <option value="en-GB">🇬🇧 English (UK)</option>
            <option value="pl-PL">🇵🇱 Polski</option>
            <option value="de-DE">🇩🇪 Deutsch</option>
            <option value="fr-FR">🇫🇷 Français</option>
            <option value="es-ES">🇪🇸 Español</option>
          </select>
        </div>
        <div style={styles.inputSection}>
          <div style={styles.buttonContainer}>
            <RecordButton
              isListening={isListening}
              onStart={startListening}
              onStop={stopListening}
              disabled={!isSupported}
            />
          </div>
          
          <div style={styles.orDivider}>lub</div>
          
          {!showTextInput ? (
            <div style={styles.buttonContainer}>
              <button
                onClick={() => setShowTextInput(true)}
                style={styles.inputMessageButton}
              >
                📝 INPUT MESSAGE
              </button>
            </div>
          ) : (
            <div style={styles.textInputContainer}>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Wpisz swoją wiadomość tutaj..."
                style={styles.textarea}
                rows={4}
                disabled={isListening}
                autoFocus
              />
              <div style={styles.textInputActions}>
                <button
                  onClick={() => {
                    setShowTextInput(false);
                    setManualInput('');
                  }}
                  style={styles.cancelButton}
                >
                  ❌ Anuluj
                </button>
                <button
                  onClick={() => {
                    handleAskAI(manualInput);
                    setManualInput('');
                    setShowTextInput(false);
                  }}
                  disabled={!manualInput.trim() || isAnalyzing || isListening}
                  style={{
                    ...styles.sendButton,
                    ...(!manualInput.trim() || isAnalyzing || isListening ? styles.sendButtonDisabled : {})
                  }}
                >
                  {isAnalyzing ? '⏳ Wysyłanie...' : '🚀 Wyślij'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div style={styles.transcriptionContainer}>
          <TranscriptionDisplay
            transcript={transcript}
            interimTranscript={interimTranscript}
            isListening={isListening}
          />
        </div>
        
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}
        
        {transcript && !isListening && (
          <div style={styles.actions}>
            <button onClick={handleReset} style={styles.clearButton}>
              🗑️ Clear
            </button>
            <button style={styles.saveButton}>
              💾 Save Note
            </button>
            <button 
              onClick={handleAskAI} 
              style={{...styles.analyzeButton, ...(isAnalyzing && styles.analyzeButtonDisabled)}}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? '⏳ Thinking...' : '🤖 Ask AI'}
            </button>
          </div>
        )}
        
        {aiResponse && (
          <div style={styles.aiResponseContainer}>
            <h3 style={styles.aiResponseTitle}>🤖 AI Response</h3>
            <div style={styles.aiResponseContent}>
              {aiResponse}
            </div>
          </div>
        )}
        </main>
      </div>
    </>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem'
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '1.125rem',
    color: '#666'
  },
  languageSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem'
  },
  label: {
    fontSize: '1rem',
    color: '#666',
    fontWeight: '500'
  },
  select: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  inputSection: {
    marginBottom: '2rem'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem'
  },
  orDivider: {
    textAlign: 'center',
    fontSize: '1rem',
    color: '#999',
    margin: '1.5rem 0',
    fontWeight: '500'
  },
  textInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'center',
    width: '100%'
  },
  textInputActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  },
  inputMessageButton: {
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
    minWidth: '300px'
  },
  textarea: {
    width: '100%',
    maxWidth: '600px',
    padding: '1rem',
    fontSize: '1rem',
    border: '2px solid #ddd',
    borderRadius: '12px',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6'
  },
  cancelButton: {
    padding: '0.75rem 2rem',
    fontSize: '1.125rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  sendButton: {
    padding: '0.75rem 2rem',
    fontSize: '1.125rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease'
  },
  sendButtonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  transcriptionContainer: {
    marginBottom: '2rem'
  },
  alert: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    textAlign: 'center',
    border: '1px solid #ffeaa7'
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1rem'
  },
  clearButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  analyzeButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s'
  },
  analyzeButtonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '1rem',
    borderRadius: '8px',
    marginTop: '1rem',
    textAlign: 'center',
    border: '1px solid #f5c6cb'
  },
  aiResponseContainer: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    marginTop: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  aiResponseTitle: {
    fontSize: '1.5rem',
    color: '#333',
    marginTop: 0,
    marginBottom: '1rem'
  },
  aiResponseContent: {
    fontSize: '1rem',
    color: '#666',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap'
  }
};

export default Dashboard;
