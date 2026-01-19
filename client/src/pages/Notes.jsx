import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [formData, setFormData] = useState({
    content: '',
    noteCategoryId: '',
    tags: '',
    source: 'text',
    language: 'pl'
  });

  useEffect(() => {
    fetchCategories();
    fetchNotes();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchNotes = async (categoryId = '') => {
    try {
      setLoading(true);
      const url = categoryId ? `/notes?categoryId=${categoryId}` : '/notes';
      const response = await api.get(url);
      setNotes(response.data);
      setError(null);
    } catch (err) {
      setError('Nie udało się pobrać notatek');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    fetchNotes(categoryId);
  };

  const openAddModal = () => {
    setEditingNote(null);
    setFormData({
      content: '',
      noteCategoryId: '',
      tags: '',
      source: 'text',
      language: 'pl'
    });
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    const noteTags = parseTags(note.tags);
    setFormData({
      content: note.content,
      noteCategoryId: note.noteCategoryId || '',
      tags: noteTags.join(', '),
      source: note.source || 'text',
      language: note.language || 'pl'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setViewingNote(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert('Treść notatki jest wymagana');
      return;
    }

    try {
      const payload = {
        content: formData.content.trim(),
        noteCategoryId: formData.noteCategoryId || null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        source: formData.source,
        language: formData.language,
        noteSubCategoryId1: null,
        noteSubCategoryId2: null,
        noteSubCategoryId3: null,
        noteSubCategoryId4: null,
        noteSubCategoryId5: null
      };

      if (editingNote) {
        await api.put(`/notes/${editingNote.id}`, payload);
      } else {
        await api.post('/notes', payload);
      }

      fetchNotes(selectedCategory);
      closeModal();
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Błąd podczas zapisywania notatki');
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę notatkę?')) return;

    try {
      await api.delete(`/notes/${noteId}`);
      fetchNotes(selectedCategory);
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Błąd podczas usuwania notatki');
    }
  };

  const openViewModal = (note) => {
    setViewingNote(note);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryName = (note) => {
    if (!note.category) return 'Bez kategorii';
    return note.category.name;
  };

  const getSubcategoryPath = (note) => {
    const path = [];
    if (note.subCategory1) path.push(note.subCategory1.name);
    if (note.subCategory2) path.push(note.subCategory2.name);
    if (note.subCategory3) path.push(note.subCategory3.name);
    if (note.subCategory4) path.push(note.subCategory4.name);
    if (note.subCategory5) path.push(note.subCategory5.name);
    return path.length > 0 ? path.join(' → ') : '';
  };

  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>📝 Twoje Notatki</h2>
          
          <div style={styles.headerActions}>
            <div style={styles.filterSection}>
              <label style={styles.filterLabel}>Filtruj po kategorii:</label>
              <select 
                value={selectedCategory} 
                onChange={handleCategoryChange}
                style={styles.select}
              >
                <option value="">Wszystkie kategorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={openAddModal} style={styles.addButton}>
              + Dodaj notatkę
            </button>
          </div>
        </div>

        {loading ? (
          <p style={styles.placeholder}>Ładowanie notatek...</p>
        ) : error ? (
          <p style={styles.error}>{error}</p>
        ) : notes.length === 0 ? (
          <p style={styles.placeholder}>Brak notatek. Dodaj pierwszą notatkę!</p>
        ) : (
          <div style={styles.notesGrid}>
            {notes.map(note => (
              <div key={note.id} style={styles.noteCard}>
                <div style={styles.noteHeader}>
                  <div style={{...styles.categoryBadge, backgroundColor: note.category?.color || '#999'}}>
                    {note.category?.icon} {getCategoryName(note)}
                  </div>
                  <div style={styles.noteActions}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(note);
                      }} 
                      style={styles.actionButton}
                      title="Edytuj"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }} 
                      style={styles.actionButton}
                      title="Usuń"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <span style={styles.noteDate}>{formatDate(note.createdAt)}</span>
                
                {getSubcategoryPath(note) && (
                  <div style={styles.breadcrumb}>
                    📂 {getSubcategoryPath(note)}
                  </div>
                )}
                
                <div 
                  style={styles.noteContent}
                  onClick={() => openViewModal(note)}
                >
                  {note.content}
                </div>
                
                {parseTags(note.tags).length > 0 && (
                  <div style={styles.tags}>
                    {parseTags(note.tags).map((tag, idx) => (
                      <span key={idx} style={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}
                
                <div style={styles.noteFooter}>
                  <span style={styles.source}>
                    {note.source === 'voice' ? '🎤 Głos' : '⌨️ Tekst'}
                  </span>
                  <span style={styles.language}>{note.language?.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal dodawania/edycji */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={closeModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  {editingNote ? '✏️ Edytuj notatkę' : '➕ Nowa notatka'}
                </h3>
                <button onClick={closeModal} style={styles.closeButton}>✕</button>
              </div>
              
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Treść notatki *</label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    style={styles.textarea}
                    rows="8"
                    placeholder="Wpisz treść notatki..."
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Kategoria</label>
                  <select
                    name="noteCategoryId"
                    value={formData.noteCategoryId}
                    onChange={handleInputChange}
                    style={styles.input}
                  >
                    <option value="">Bez kategorii</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Tagi (oddziel przecinkami)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="np. praca, pilne, projekt"
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Źródło</label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      style={styles.input}
                    >
                      <option value="text">⌨️ Tekst</option>
                      <option value="voice">🎤 Głos</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Język</label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      style={styles.input}
                    >
                      <option value="pl">🇵🇱 Polski</option>
                      <option value="en">🇬🇧 Angielski</option>
                      <option value="de">🇩🇪 Niemiecki</option>
                    </select>
                  </div>
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" onClick={closeModal} style={styles.cancelButton}>
                    Anuluj
                  </button>
                  <button type="submit" style={styles.submitButton}>
                    {editingNote ? 'Zapisz zmiany' : 'Dodaj notatkę'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal podglądu */}
        {viewingNote && (
          <div style={styles.modalOverlay} onClick={closeModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>📄 Podgląd notatki</h3>
                  <div style={{...styles.categoryBadge, backgroundColor: viewingNote.category?.color || '#999', marginTop: '0.5rem'}}>
                    {viewingNote.category?.icon} {getCategoryName(viewingNote)}
                  </div>
                </div>
                <button onClick={closeModal} style={styles.closeButton}>✕</button>
              </div>
              
              <div style={styles.viewContent}>
                <div style={styles.viewDate}>{formatDate(viewingNote.createdAt)}</div>
                
                {getSubcategoryPath(viewingNote) && (
                  <div style={styles.breadcrumb}>
                    📂 {getSubcategoryPath(viewingNote)}
                  </div>
                )}

                <div style={styles.viewText}>
                  {viewingNote.content}
                </div>

                {viewingNote.aiResponse && (
                  <div style={styles.aiResponseBox}>
                    <div style={styles.aiResponseHeader}>🤖 Odpowiedź AI:</div>
                    <div style={styles.aiResponseText}>{viewingNote.aiResponse}</div>
                  </div>
                )}

                {parseTags(viewingNote.tags).length > 0 && (
                  <div style={styles.tags}>
                    {parseTags(viewingNote.tags).map((tag, idx) => (
                      <span key={idx} style={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}

                <div style={styles.viewFooter}>
                  <span style={styles.source}>
                    {viewingNote.source === 'voice' ? '🎤 Głos' : '⌨️ Tekst'}
                  </span>
                  <span style={styles.language}>{viewingNote.language?.toUpperCase()}</span>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button onClick={() => {
                  closeModal();
                  openEditModal(viewingNote);
                }} style={styles.submitButton}>
                  ✏️ Edytuj
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 2rem'
  },
  header: {
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '1.5rem'
  },
  headerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  filterLabel: {
    fontSize: '1rem',
    color: '#555',
    fontWeight: '500'
  },
  select: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    minWidth: '250px'
  },
  addButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  placeholder: {
    fontSize: '1.125rem',
    color: '#999',
    textAlign: 'center',
    marginTop: '3rem'
  },
  error: {
    fontSize: '1.125rem',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: '3rem'
  },
  notesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
    marginTop: '1.5rem'
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'white',
    display: 'inline-block'
  },
  noteActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.25rem',
    padding: '0.25rem',
    opacity: 0.7,
    transition: 'opacity 0.2s'
  },
  noteDate: {
    fontSize: '0.75rem',
    color: '#999'
  },
  breadcrumb: {
    fontSize: '0.875rem',
    color: '#666',
    padding: '0.5rem',
    backgroundColor: '#F3F4F6',
    borderRadius: '6px'
  },
  noteContent: {
    fontSize: '1rem',
    color: '#333',
    lineHeight: '1.6',
    maxHeight: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre-wrap',
    cursor: 'pointer'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  tag: {
    fontSize: '0.75rem',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontWeight: '500'
  },
  noteFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #E5E7EB',
    paddingTop: '0.75rem'
  },
  source: {
    fontSize: '0.875rem',
    color: '#666'
  },
  language: {
    fontSize: '0.75rem',
    color: '#999',
    fontWeight: '600'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  modalHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  modalTitle: {
    fontSize: '1.5rem',
    color: '#333',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#999',
    padding: 0,
    width: '32px',
    height: '32px'
  },
  form: {
    padding: '1.5rem'
  },
  formGroup: {
    marginBottom: '1.25rem',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '0.625rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '0.625rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  modalFooter: {
    padding: '1.5rem',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem'
  },
  cancelButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#E5E7EB',
    color: '#555',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  viewContent: {
    padding: '1.5rem'
  },
  viewDate: {
    fontSize: '0.875rem',
    color: '#999',
    marginBottom: '1rem'
  },
  viewText: {
    fontSize: '1rem',
    color: '#333',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
    marginBottom: '1.5rem'
  },
  aiResponseBox: {
    backgroundColor: '#F0F9FF',
    border: '1px solid #BFDBFE',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem'
  },
  aiResponseHeader: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: '0.5rem'
  },
  aiResponseText: {
    fontSize: '0.95rem',
    color: '#333',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap'
  },
  viewFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '1rem',
    borderTop: '1px solid #E5E7EB'
  }
};

export default Notes;
