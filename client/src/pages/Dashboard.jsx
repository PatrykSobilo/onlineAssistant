import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
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
    isMicActive,
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    toggleMicrophone,
    stopAll,
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
      // Create note with AI instead of just chatting
      const response = await api.post('/notes/ai-create', {
        message: messageToSend
      });
      
      setAiResponse(`✅ Notatka utworzona!\n\n${response.data.note.content}\n\nKategoria: ${response.data.note.category?.name || 'Brak'}`);
      console.log('AI Response:', response.data);
      
      // Reset after successful creation
      setTimeout(() => {
        handleReset();
      }, 3000);
    } catch (err) {
      console.error('AI note creation failed:', err);
      setError(err.response?.data?.message || 'Failed to create note with AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    stopAll();
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
          <label htmlFor="language-select" style={styles.label}>Language:</label>
          <select
            id="language-select"
            name="language"
            title="Select language for speech recognition"
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
          <h3 style={styles.sectionTitle}>Wybierz źródła audio:</h3>
          
          <div style={styles.audioSourcesGrid}>
            {/* Microphone button */}
            <div style={styles.sourceCard}>
              <button
                onClick={toggleMicrophone}
                disabled={!isSupported}
                style={{
                  ...styles.sourceButton,
                  ...(isMicActive ? styles.sourceButtonActive : {}),
                  ...(!isSupported ? styles.sourceButtonDisabled : {})
                }}
              >
                <div style={styles.sourceIcon}>
                  {isMicActive ? '🔴' : '🎤'}
                </div>
                <div style={styles.sourceLabel}>
                  {isMicActive ? 'STOP RECORDING' : 'START RECORDING'}
                </div>
                <div style={styles.sourceDescription}>
                  Mikrofon
                </div>
              </button>
              {isMicActive && (
                <div style={styles.activeIndicator}>
                  ● Aktywne
                </div>
              )}
            </div>

            {/* Text input button */}
            {!showTextInput && (
              <div style={styles.sourceCard}>
                <button
                  onClick={() => setShowTextInput(true)}
                  style={styles.sourceButton}
                >
                  <div style={styles.sourceIcon}>
                    📝
                  </div>
                  <div style={styles.sourceLabel}>
                    INPUT MESSAGE
                  </div>
                  <div style={styles.sourceDescription}>
                    Wpisz tekst
                  </div>
                </button>
              </div>
            )}
          </div>

          {showTextInput && (
            <div style={styles.textInputContainer}>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Wpisz swoją wiadomość tutaj..."
                style={styles.textarea}
                rows={4}
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
                  disabled={!manualInput.trim() || isAnalyzing}
                  style={{
                    ...styles.sendButton,
                    ...(!manualInput.trim() || isAnalyzing ? styles.sendButtonDisabled : {})
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
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#333',
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontWeight: '600'
  },
  audioSourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  sourceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  sourceButton: {
    width: '100%',
    minHeight: '150px',
    padding: '1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem'
  },
  sourceButtonActive: {
    backgroundColor: '#dc3545',
    boxShadow: '0 6px 12px rgba(220,53,69,0.3)'
  },
  sourceButtonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  sourceIcon: {
    fontSize: '2.5rem'
  },
  sourceLabel: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  sourceDescription: {
    fontSize: '0.875rem',
    opacity: 0.9,
    fontWeight: 'normal'
  },
  activeIndicator: {
    color: '#28a745',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginTop: '0.25rem',
    animation: 'pulse 2s ease-in-out infinite'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem'
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
