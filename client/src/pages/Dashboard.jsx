import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import TranscriptionDisplay from '../components/TranscriptionDisplay';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [language, setLanguage] = useState('pl-PL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [showFileImport, setShowFileImport] = useState(false);
  const [importedText, setImportedText] = useState('');
  const [lastTranscriptChange, setLastTranscriptChange] = useState(Date.now());
  const [notesCreatedCount, setNotesCreatedCount] = useState(0);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  
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

  // Track when transcript changes (user is speaking)
  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      setLastTranscriptChange(Date.now());
      console.log('📝 Transcript updated:', transcript.substring(0, 50) + '...');
    }
  }, [transcript]);

  // Also track interim transcript changes
  useEffect(() => {
    if (interimTranscript && interimTranscript.trim().length > 0) {
      setLastTranscriptChange(Date.now());
    }
  }, [interimTranscript]);

  // Silence detection - auto-send after 10 seconds of no speech
  useEffect(() => {
    if (!isMicActive || !transcript || transcript.trim().length < 10 || isAnalyzing) {
      return;
    }

    const silenceCheckInterval = setInterval(() => {
      const timeSinceLastChange = Date.now() - lastTranscriptChange;
      
      if (timeSinceLastChange >= 10000 && transcript.trim().length > 0 && !isAnalyzing) {
        const textToSend = transcript;
        resetTranscript();
        setLastTranscriptChange(Date.now());
        handleAskAI(textToSend);
      }
    }, 1000); // Check every second

    return () => clearInterval(silenceCheckInterval);
  }, [isMicActive, transcript, lastTranscriptChange, isAnalyzing]);

  // Fallback: Auto-process every minute (in case silence detection doesn't trigger)
  useEffect(() => {
    if (!isMicActive) return;

    const intervalId = setInterval(() => {
      if (transcript && transcript.trim().length > 10 && !isAnalyzing) {
        console.log('⏰ Auto-processing transcript (1 min fallback):', transcript);
        handleAskAI(transcript);
        resetTranscript();
      }
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [isMicActive, transcript, isAnalyzing]);

  // Parse transcription files (VTT, SRT, SBV, TXT)
  const parseTranscriptionFile = (content, fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();

    if (extension === 'txt') {
      return content;
    }

    // Remove VTT/SRT/SBV timestamps and formatting
    let cleaned = content;

    // Remove WEBVTT header
    cleaned = cleaned.replace(/^WEBVTT\s*/m, '');

    // Remove timestamp lines (00:00:00.000 --> 00:00:05.000)
    cleaned = cleaned.replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g, '');

    // Remove sequence numbers (1, 2, 3, etc. on separate lines)
    cleaned = cleaned.replace(/^\d+$/gm, '');

    // Remove speaker tags like <v Speaker Name>
    cleaned = cleaned.replace(/<v [^>]+>/gi, '');

    // Remove other HTML-like tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Remove multiple empty lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file extension
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.txt', '.vtt', '.srt', '.sbv'];
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setError('Nieprawidłowy format pliku. Obsługiwane: .txt, .vtt, .srt, .sbv');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const parsedText = parseTranscriptionFile(content, file.name);
      
      // Auto-submit to AI immediately
      handleAskAI(parsedText);
    };
    reader.onerror = () => {
      setError('Błąd podczas wczytywania pliku');
    };
    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

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
      
      // Update counter and show badge
      setNotesCreatedCount(prev => prev + 1);
      setShowSuccessBadge(true);
      setTimeout(() => setShowSuccessBadge(false), 2000);
      
      // Reset after successful creation
      setTimeout(() => {
        setAiResponse(null);
        setError(null);
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
            
            {notesCreatedCount > 0 && (
              <div style={styles.notesCounter}>
                📝 Utworzono notatek: <strong>{notesCreatedCount}</strong>
                {showSuccessBadge && <span style={styles.successBadge}>✨ Nowa!</span>}
              </div>
            )}
          </div>
          
          {!isSupported && (
            <div style={styles.alert}>
              ⚠️ Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome, Edge lub Safari.
            </div>
          )}

          {isMicActive && (
            <div style={styles.autoProcessAlert}>
              🤖 Automatyczne przetwarzanie włączone - notatka zostanie utworzona po 10 sekundach ciszy lub po minucie
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
          
          {/* Top row - 2 buttons */}
          <div style={styles.audioSourcesGridTop}>
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
                  {isMicActive ? 'STOP RECORDING' : 'Notatka głosowa'}
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
                    Notatka tekstowa
                  </div>
                  <div style={styles.sourceDescription}>
                    Wpisz tekst
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Bottom row - 1 button */}
          <div style={styles.audioSourcesGridBottom}>
            {/* File import button */}
            <div style={styles.sourceCard}>
              <label style={styles.sourceButton}>
                <input
                  type="file"
                  accept=".txt,.vtt,.srt,.sbv"
                  onChange={handleFileImport}
                  style={{ display: 'none' }}
                />
                <div style={styles.sourceIcon}>
                  📄
                </div>
                <div style={styles.sourceLabel}>
                  Importuj Transkrypcję
                </div>
                <div style={styles.sourceDescription}>
                  .txt, .vtt, .srt, .sbv
                </div>
              </label>
            </div>
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
  notesCounter: {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f0f9ff',
    borderRadius: '20px',
    fontSize: '1rem',
    color: '#0369a1',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  successBadge: {
    marginLeft: '0.5rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#10B981',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '600',
    animation: 'slideIn 0.3s ease-out'
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
  audioSourcesGridTop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    maxWidth: '700px',
    margin: '0 auto 1.5rem auto'
  },
  audioSourcesGridBottom: {
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '700px',
    margin: '0 auto'
  },
  sourceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1
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
  autoProcessAlert: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    textAlign: 'center',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    animation: 'pulse 2s ease-in-out infinite'
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
