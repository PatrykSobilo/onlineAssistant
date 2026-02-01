import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Discussions = () => {
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDiscussions = async () => {
    try {
      const response = await api.get('/discussions');
      setDiscussions(response.data);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  const fetchMessages = async (discussionId) => {
    try {
      setLoading(true);
      const response = await api.get(`/discussions/${discussionId}`);
      setMessages(response.data.messages || []);
      setSelectedDiscussion(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewDiscussion = async () => {
    try {
      const response = await api.post('/discussions', {
        title: 'Nowa rozmowa'
      });
      setDiscussions([response.data, ...discussions]);
      setSelectedDiscussion(response.data);
      setMessages([]);
    } catch (error) {
      console.error('Error creating discussion:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDiscussion || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await api.post(`/discussions/${selectedDiscussion.id}/messages`, {
        content: messageContent
      });

      setMessages([...messages, response.data.userMessage, response.data.aiMessage]);
      
      fetchDiscussions(); // Refresh list to update lastMessageAt
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const deleteDiscussion = async (discussionId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę dyskusję?')) return;

    try {
      await api.delete(`/discussions/${discussionId}`);
      setDiscussions(discussions.filter(d => d.id !== discussionId));
      if (selectedDiscussion?.id === discussionId) {
        setSelectedDiscussion(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting discussion:', error);
    }
  };

  const updateTitle = async () => {
    if (!newTitle.trim() || !selectedDiscussion) return;

    try {
      await api.put(`/discussions/${selectedDiscussion.id}`, {
        title: newTitle.trim()
      });
      
      setSelectedDiscussion({...selectedDiscussion, title: newTitle.trim()});
      setDiscussions(discussions.map(d => 
        d.id === selectedDiscussion.id ? {...d, title: newTitle.trim()} : d
      ));
      setEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Teraz';
    if (diffMins < 60) return `${diffMins}min temu`;
    if (diffHours < 24) return `${diffHours}h temu`;
    if (diffDays < 7) return `${diffDays}d temu`;
    
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>💬 Dyskusje</h3>
            <button onClick={createNewDiscussion} style={styles.newButton}>
              + Nowa
            </button>
          </div>
          <div style={styles.discussionList}>
            {discussions.length === 0 ? (
              <p style={styles.emptyText}>Brak dyskusji. Rozpocznij nową!</p>
            ) : (
              discussions.map(discussion => (
                <div
                  key={discussion.id}
                  style={{
                    ...styles.discussionItem,
                    ...(selectedDiscussion?.id === discussion.id ? styles.discussionItemActive : {})
                  }}
                  onClick={() => fetchMessages(discussion.id)}
                >
                  <div style={styles.discussionItemContent}>
                    <div style={styles.discussionTitle}>{discussion.title}</div>
                    <div style={styles.discussionTime}>
                      {formatDate(discussion.lastMessageAt || discussion.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDiscussion(discussion.id);
                    }}
                    style={styles.deleteButton}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.chatArea}>
          {selectedDiscussion ? (
            <>
              <div style={styles.chatHeader}>
                {editingTitle ? (
                  <div style={styles.titleEdit}>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && updateTitle()}
                      style={styles.titleInput}
                      autoFocus
                    />
                    <button onClick={updateTitle} style={styles.titleSaveButton}>✓</button>
                    <button onClick={() => setEditingTitle(false)} style={styles.titleCancelButton}>✗</button>
                  </div>
                ) : (
                  <h2
                    style={styles.chatTitle}
                    onClick={() => {
                      setEditingTitle(true);
                      setNewTitle(selectedDiscussion.title);
                    }}
                  >
                    {selectedDiscussion.title}
                    <span style={styles.editIcon}>✏️</span>
                  </h2>
                )}
              </div>

              <div style={styles.messagesContainer}>
                {loading ? (
                  <p style={styles.loadingText}>Ładowanie...</p>
                ) : messages.length === 0 ? (
                  <p style={styles.emptyMessages}>Rozpocznij rozmowę pisząc wiadomość poniżej</p>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      style={{
                        ...styles.message,
                        ...(message.role === 'user' ? styles.userMessage : styles.aiMessage)
                      }}
                    >
                      <div style={styles.messageRole}>
                        {message.role === 'user' ? '👤 Ty' : '🤖 AI'}
                      </div>
                      <div style={styles.messageContent}>{message.content}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} style={styles.inputForm}>
                <div style={styles.inputRow}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Napisz wiadomość..."
                    style={styles.messageInput}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    style={{...styles.sendButton, ...(sending ? styles.sendButtonDisabled : {})}}
                    disabled={sending}
                  >
                    {sending ? '⏳' : '📤'}
                  </button>
                </div>
              </form>

            </>
          ) : (
            <div style={styles.emptyChat}>
              <p style={styles.emptyChatText}>Wybierz dyskusję lub rozpocznij nową</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 60px)',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  sidebar: {
    width: '320px',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa'
  },
  sidebarHeader: {
    padding: '1.25rem',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#333'
  },
  newButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  discussionList: {
    flex: 1,
    overflowY: 'auto'
  },
  emptyText: {
    padding: '2rem 1.25rem',
    textAlign: 'center',
    color: '#999',
    fontSize: '0.875rem'
  },
  discussionItem: {
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  discussionItemActive: {
    backgroundColor: '#e3f2fd'
  },
  discussionItemContent: {
    flex: 1,
    minWidth: 0
  },
  discussionTitle: {
    fontWeight: '500',
    color: '#333',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  discussionTime: {
    fontSize: '0.75rem',
    color: '#999'
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.25rem',
    opacity: 0.6,
    transition: 'opacity 0.2s'
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white'
  },
  chatHeader: {
    padding: '1.25rem',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: 'white'
  },
  chatTitle: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  editIcon: {
    fontSize: '1rem',
    opacity: 0.5
  },
  titleEdit: {
    display: 'flex',
    gap: '0.5rem'
  },
  titleInput: {
    flex: 1,
    padding: '0.5rem',
    fontSize: '1.125rem',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  titleSaveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  titleCancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    backgroundColor: '#fafafa'
  },
  loadingText: {
    textAlign: 'center',
    color: '#999',
    fontSize: '1rem'
  },
  emptyMessages: {
    textAlign: 'center',
    color: '#999',
    fontSize: '1rem',
    marginTop: '2rem'
  },
  message: {
    marginBottom: '1.25rem',
    padding: '1rem',
    borderRadius: '8px',
    maxWidth: '75%'
  },
  userMessage: {
    backgroundColor: '#007bff',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '4px'
  },
  aiMessage: {
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #e0e0e0',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  messageRole: {
    fontSize: '0.75rem',
    marginBottom: '0.5rem',
    opacity: 0.8,
    fontWeight: '600'
  },
  messageContent: {
    fontSize: '0.95rem',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  },
  inputForm: {
    padding: '1.25rem',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    backgroundColor: 'white'
  },
  inputRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#555'
  },
  checkbox: {
    cursor: 'pointer',
    width: '16px',
    height: '16px'
  },
  checkboxText: {
    userSelect: 'none'
  },
  notesInfoButton: {
    padding: '0.375rem 0.75rem',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  messageInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none'
  },
  sendButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.25rem',
    transition: 'background-color 0.2s'
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  usedNotesPanel: {
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#F9FAFB',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  usedNotesHeader: {
    padding: '0.75rem 1.25rem',
    backgroundColor: '#10B981',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeNotesButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1.25rem',
    padding: 0
  },
  usedNotesList: {
    padding: '0.75rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  usedNoteItem: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
    padding: '0.5rem',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem'
  },
  usedNoteNumber: {
    fontWeight: '600',
    color: '#10B981',
    minWidth: '20px'
  },
  usedNoteCategory: {
    fontWeight: '600',
    color: '#6B7280',
    whiteSpace: 'nowrap'
  },
  usedNoteContent: {
    color: '#333',
    flex: 1,
    lineHeight: '1.4'
  },
  emptyChat: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyChatText: {
    fontSize: '1.25rem',
    color: '#999'
  }
};

export default Discussions;
