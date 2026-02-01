import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [movingNote, setMovingNote] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [selectedMove, setSelectedMove] = useState({
    noteSubCategoryId1: null,
    noteSubCategoryId2: null,
    noteSubCategoryId3: null,
    noteSubCategoryId4: null,
    noteSubCategoryId5: null
  });
  const [openFolders, setOpenFolders] = useState({});
  const [organizingCategory, setOrganizingCategory] = useState(null);
  const [aiMessage, setAiMessage] = useState('');
  const [creatingWithAI, setCreatingWithAI] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    noteCategoryId: '',
    tags: '',
    source: 'text',
    language: 'pl'
  });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
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

  const fetchSubcategories = async () => {
    try {
      const response = await api.get('/subcategories');
      setAllSubcategories(response.data);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notes');
      setNotes(response.data);
      setError(null);
      // Refresh subcategories after auto-organization may have created new ones
      await fetchSubcategories();
    } catch (err) {
      setError('Nie udało się pobrać notatek');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group notes by full hierarchy (category + 5 levels of subcategories)
  const groupNotesByFolders = () => {
    const folders = {};

    // First, build folder structure from all subcategories
    categories.forEach(category => {
      const categoryId = category.id;
      folders[categoryId] = {
        id: categoryId,
        name: `${category.icon} ${category.name}`,
        color: category.color,
        children: {}
      };
    });

    // Build complete folder structure from subcategories
    allSubcategories.forEach(subCat => {
      const categoryId = subCat.categoryId;
      if (!folders[categoryId]) return;

      // Build path to this subcategory
      const path = [];
      let currentSub = subCat;
      
      // Collect full path from root to this subcategory
      while (currentSub) {
        path.unshift(currentSub);
        if (currentSub.parentSubCategoryId) {
          currentSub = allSubcategories.find(s => s.id === currentSub.parentSubCategoryId);
        } else {
          currentSub = null;
        }
      }

      // Create folder structure along the path
      let currentLevel = folders[categoryId].children;
      for (let i = 0; i < path.length; i++) {
        const sub = path[i];
        if (!currentLevel[sub.id]) {
          currentLevel[sub.id] = {
            id: sub.id,
            name: sub.name,
            level: sub.level,
            children: {},
            notes: []
          };
        }
        if (i < path.length - 1) {
          currentLevel = currentLevel[sub.id].children;
        }
      }
    });

    // Now place notes into the structure
    notes.forEach(note => {
      const categoryId = note.noteCategoryId || 'uncategorized';
      
      if (categoryId === 'uncategorized') {
        if (!folders[categoryId]) {
          folders[categoryId] = {
            id: categoryId,
            name: '📁 Bez kategorii',
            color: '#999',
            children: {}
          };
        }
      }

      if (!folders[categoryId]) return;

      // Find deepest level subcategory for this note
      const subCatIds = [
        note.noteSubCategoryId1,
        note.noteSubCategoryId2,
        note.noteSubCategoryId3,
        note.noteSubCategoryId4,
        note.noteSubCategoryId5
      ];

      // Navigate to the deepest folder
      let currentLevel = folders[categoryId].children;
      let targetFolder = null;

      for (let i = 0; i < subCatIds.length; i++) {
        if (!subCatIds[i]) break;
        
        if (currentLevel[subCatIds[i]]) {
          targetFolder = currentLevel[subCatIds[i]];
          currentLevel = targetFolder.children;
        } else {
          break;
        }
      }

      // If no subcategory, place in root "Główny folder"
      if (!targetFolder) {
        if (!currentLevel['no-sub1']) {
          currentLevel['no-sub1'] = {
            id: 'no-sub1',
            name: 'Główny folder',
            level: 1,
            children: {},
            notes: []
          };
        }
        currentLevel['no-sub1'].notes.push(note);
      } else {
        targetFolder.notes.push(note);
      }
    });

    return folders;
  };

  const toggleFolder = (path) => {
    setOpenFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Recursive component to render folder hierarchy
  const renderFolder = (folder, path, level = 0) => {
    const isOpen = openFolders[path];
    const hasChildren = Object.keys(folder.children).length > 0;
    const hasNotes = folder.notes && folder.notes.length > 0;

    return (
      <div key={path} style={{...styles.folderContainer, marginLeft: level > 0 ? '1.5rem' : '0'}}>
        <div 
          style={{...styles.folderHeader, ...styles[`folderLevel${Math.min(level, 3)}`]}}
          onClick={() => toggleFolder(path)}
        >
          <div style={styles.folderHeaderLeft}>
            <span style={styles.folderIcon}>
              {isOpen ? '📂' : '📁'}
            </span>
            <span style={styles.folderTitle}>{folder.name}</span>
          </div>
          <span style={styles.folderCount}>
            {getTotalNotesCount(folder)}
          </span>
        </div>

        {isOpen && (
          <div style={styles.folderContent}>
            {/* Render child folders */}
            {hasChildren && Object.entries(folder.children).map(([childId, childFolder]) => 
              renderFolder(childFolder, `${path}/${childId}`, level + 1)
            )}

            {/* Render notes only if this is the deepest level (no children) */}
            {!hasChildren && hasNotes && (
              <div style={styles.notesGrid}>
                {folder.notes.map(note => renderNoteCard(note))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getTotalNotesCount = (folder) => {
    let count = folder.notes ? folder.notes.length : 0;
    Object.values(folder.children).forEach(child => {
      count += getTotalNotesCount(child);
    });
    return count;
  };

  const renderNoteCard = (note) => (
    <div key={note.id} style={styles.noteCard}>
      <div style={styles.noteHeader}>
        <div style={styles.noteActions}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openMoveModal(note);
            }} 
            style={styles.actionButton}
            title="Przenieś do innego folderu"
          >
            📁
          </button>
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
  );

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

  const openMoveModal = async (note) => {
    setMovingNote(note);
    setSelectedMove({
      noteSubCategoryId1: note.noteSubCategoryId1,
      noteSubCategoryId2: note.noteSubCategoryId2,
      noteSubCategoryId3: note.noteSubCategoryId3,
      noteSubCategoryId4: note.noteSubCategoryId4,
      noteSubCategoryId5: note.noteSubCategoryId5
    });

    // Fetch subcategories for this category
    if (note.noteCategoryId) {
      try {
        const response = await api.get(`/subcategories?categoryId=${note.noteCategoryId}`);
        setAvailableSubcategories(response.data);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        setAvailableSubcategories([]);
      }
    }
    
    setShowMoveModal(true);
  };

  const closeMoveModal = () => {
    setShowMoveModal(false);
    setMovingNote(null);
    setAvailableSubcategories([]);
    setSelectedMove({
      noteSubCategoryId1: null,
      noteSubCategoryId2: null,
      noteSubCategoryId3: null,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null
    });
  };

  const handleMoveNote = async () => {
    if (!movingNote) return;

    try {
      await api.put(`/notes/${movingNote.id}`, {
        ...movingNote,
        noteSubCategoryId1: selectedMove.noteSubCategoryId1,
        noteSubCategoryId2: selectedMove.noteSubCategoryId2,
        noteSubCategoryId3: selectedMove.noteSubCategoryId3,
        noteSubCategoryId4: selectedMove.noteSubCategoryId4,
        noteSubCategoryId5: selectedMove.noteSubCategoryId5
      });

      fetchNotes();
      fetchSubcategories();
      closeMoveModal();
    } catch (err) {
      console.error('Error moving note:', err);
      alert('Błąd podczas przenoszenia notatki');
    }
  };

  const getFilteredSubcategories = (level) => {
    if (!availableSubcategories.length) return [];

    // For level 1, show all level 1 subcategories
    if (level === 1) {
      return availableSubcategories.filter(sc => sc.level === 1);
    }

    // For other levels, show children of selected parent
    const parentId = selectedMove[`noteSubCategoryId${level - 1}`];
    if (!parentId) return [];

    return availableSubcategories.filter(sc => 
      sc.level === level && sc.parentSubCategoryId === parentId
    );
  };

  const handleSubcategoryChange = (level, value) => {
    const newSelected = {
      noteSubCategoryId1: level >= 1 ? (level === 1 ? (value || null) : selectedMove.noteSubCategoryId1) : null,
      noteSubCategoryId2: level >= 2 ? (level === 2 ? (value || null) : selectedMove.noteSubCategoryId2) : null,
      noteSubCategoryId3: level >= 3 ? (level === 3 ? (value || null) : selectedMove.noteSubCategoryId3) : null,
      noteSubCategoryId4: level >= 4 ? (level === 4 ? (value || null) : selectedMove.noteSubCategoryId4) : null,
      noteSubCategoryId5: level >= 5 ? (level === 5 ? (value || null) : selectedMove.noteSubCategoryId5) : null
    };
    setSelectedMove(newSelected);
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

      fetchNotes();
      fetchSubcategories();
      closeModal();
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Błąd podczas zapisywania notatki');
    }
  };

  const handleAiCreateNote = async () => {
    if (!aiMessage.trim()) {
      alert('Wpisz wiadomość do AI');
      return;
    }

    try {
      setCreatingWithAI(true);
      const response = await api.post('/notes/ai-create', { 
        message: aiMessage 
      });
      
      alert('✅ ' + response.data.message);
      setAiMessage('');
      
      // Refresh data
      await fetchNotes();
      await fetchSubcategories();
    } catch (err) {
      console.error('Error creating note with AI:', err);
      alert('❌ Błąd podczas tworzenia notatki przez AI: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreatingWithAI(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę notatkę?')) return;

    try {
      await api.delete(`/notes/${noteId}`);
      fetchNotes();
      fetchSubcategories();
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Błąd podczas usuwania notatki');
    }
  };

  const handleAiOrganize = async (categoryId) => {
    if (!confirm('Czy chcesz użyć AI do automatycznego przypisania notatek z folderów "Nieprzypisane"? To może potrwać kilka sekund.')) return;

    try {
      setOrganizingCategory(categoryId);
      const response = await api.post('/notes/ai-organize', { categoryId });
      
      alert(`✅ ${response.data.message}\nPrzypisano: ${response.data.organized}/${response.data.total} notatek`);
      
      // Refresh data
      await fetchNotes();
      await fetchSubcategories();
    } catch (err) {
      console.error('Error organizing notes:', err);
      alert('❌ Błąd podczas organizacji notatek: ' + (err.response?.data?.message || err.message));
    } finally {
      setOrganizingCategory(null);
    }
  };

  const handleAiReorganizeAll = async (categoryId) => {
    if (!confirm('⚠️ UWAGA: Ta funkcja przeanalizuje WSZYSTKIE notatki z tej kategorii i może je przenieść do innych folderów na podstawie ich treści.\n\nCzy na pewno chcesz kontynuować?')) return;

    try {
      setOrganizingCategory(categoryId);
      const response = await api.post('/notes/ai-reorganize', { categoryId });
      
      alert(`✅ ${response.data.message}\nPrzeorganizowano: ${response.data.organized}/${response.data.total} notatek`);
      
      // Refresh data
      await fetchNotes();
      await fetchSubcategories();
    } catch (err) {
      console.error('Error reorganizing notes:', err);
      alert('❌ Błąd podczas reorganizacji notatek: ' + (err.response?.data?.message || err.message));
    } finally {
      setOrganizingCategory(null);
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
          
          <button onClick={openAddModal} style={styles.addButton}>
            + Dodaj notatkę
          </button>
        </div>

        {/* AI Note Creation */}
        <div style={styles.aiCreateSection}>
          <div style={styles.aiCreateInputWrapper}>
            <input
              type="text"
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !creatingWithAI) {
                  handleAiCreateNote();
                }
              }}
              placeholder="Powiedz coś AI, a stworzy notatkę... (np. 'Spotkanie z klientem ABC o 15:00')"
              style={styles.aiCreateInput}
              disabled={creatingWithAI}
            />
            <button
              onClick={handleAiCreateNote}
              disabled={creatingWithAI || !aiMessage.trim()}
              style={{
                ...styles.aiCreateButton,
                opacity: (creatingWithAI || !aiMessage.trim()) ? 0.6 : 1,
                cursor: (creatingWithAI || !aiMessage.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {creatingWithAI ? '⏳ Tworzę...' : '🤖 Stwórz notatkę AI'}
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
          <div style={styles.foldersContainer}>
            {Object.entries(groupNotesByFolders()).map(([categoryId, category]) => (
              <div key={categoryId} style={styles.categorySection}>
                <div 
                  style={{...styles.categoryHeader, borderLeftColor: category.color}}
                >
                  <div 
                    style={styles.categoryHeaderLeft}
                    onClick={() => toggleFolder(categoryId)}
                  >
                    <span style={styles.folderIcon}>
                      {openFolders[categoryId] ? '📂' : '📁'}
                    </span>
                    <h3 style={styles.categoryTitle}>{category.name}</h3>
                    <span style={styles.categoryCount}>
                      {getTotalNotesCount(category)} notatek
                    </span>
                  </div>
                  
                  {categoryId !== 'uncategorized' && (
                    <div style={styles.aiButtonsContainer}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAiOrganize(categoryId);
                        }}
                        disabled={organizingCategory === categoryId}
                        style={{
                          ...styles.aiOrganizeButton,
                          opacity: organizingCategory === categoryId ? 0.6 : 1,
                          cursor: organizingCategory === categoryId ? 'wait' : 'pointer'
                        }}
                        title="Użyj AI do przypisania notatek z folderów 'Nieprzypisane'"
                      >
                        {organizingCategory === categoryId ? '⏳' : '🤖 Nieprzypisane'}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAiReorganizeAll(categoryId);
                        }}
                        disabled={organizingCategory === categoryId}
                        style={{
                          ...styles.aiReorganizeButton,
                          opacity: organizingCategory === categoryId ? 0.6 : 1,
                          cursor: organizingCategory === categoryId ? 'wait' : 'pointer'
                        }}
                        title="Użyj AI do reorganizacji WSZYSTKICH notatek w tej kategorii"
                      >
                        {organizingCategory === categoryId ? '⏳' : '✨ Przeorganizuj'}
                      </button>
                    </div>
                  )}
                </div>

                {openFolders[categoryId] && (
                  <div style={styles.categoryContent}>
                    {Object.entries(category.children).map(([childId, childFolder]) => 
                      renderFolder(childFolder, `${categoryId}/${childId}`, 1)
                    )}
                  </div>
                )}
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

        {/* Modal przenoszenia notatki */}
        {showMoveModal && movingNote && (
          <div style={styles.modalOverlay} onClick={closeMoveModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>📁 Przenieś notatkę</h3>
                <button onClick={closeMoveModal} style={styles.closeButton}>✕</button>
              </div>
              
              <div style={styles.moveContent}>
                <div style={styles.moveInfo}>
                  <div style={styles.moveInfoLabel}>Kategoria:</div>
                  <div style={{...styles.categoryBadge, backgroundColor: movingNote.category?.color || '#999'}}>
                    {movingNote.category?.icon} {getCategoryName(movingNote)}
                  </div>
                </div>

                <div style={styles.moveInfo}>
                  <div style={styles.moveInfoLabel}>Treść notatki:</div>
                  <div style={styles.moveNotePreview}>
                    {movingNote.content.substring(0, 100)}
                    {movingNote.content.length > 100 ? '...' : ''}
                  </div>
                </div>

                <div style={styles.moveSeparator}>Wybierz nową lokalizację:</div>

                {/* Level 1 */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Poziom 1</label>
                  <select
                    value={selectedMove.noteSubCategoryId1 || ''}
                    onChange={(e) => handleSubcategoryChange(1, e.target.value ? parseInt(e.target.value) : null)}
                    style={styles.input}
                  >
                    <option value="">Główny folder kategorii</option>
                    {getFilteredSubcategories(1).map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Level 2 */}
                {selectedMove.noteSubCategoryId1 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Poziom 2</label>
                    <select
                      value={selectedMove.noteSubCategoryId2 || ''}
                      onChange={(e) => handleSubcategoryChange(2, e.target.value ? parseInt(e.target.value) : null)}
                      style={styles.input}
                    >
                      <option value="">Brak (pozostań na poziomie 1)</option>
                      {getFilteredSubcategories(2).map(sc => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Level 3 */}
                {selectedMove.noteSubCategoryId2 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Poziom 3</label>
                    <select
                      value={selectedMove.noteSubCategoryId3 || ''}
                      onChange={(e) => handleSubcategoryChange(3, e.target.value ? parseInt(e.target.value) : null)}
                      style={styles.input}
                    >
                      <option value="">Brak (pozostań na poziomie 2)</option>
                      {getFilteredSubcategories(3).map(sc => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Level 4 */}
                {selectedMove.noteSubCategoryId3 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Poziom 4</label>
                    <select
                      value={selectedMove.noteSubCategoryId4 || ''}
                      onChange={(e) => handleSubcategoryChange(4, e.target.value ? parseInt(e.target.value) : null)}
                      style={styles.input}
                    >
                      <option value="">Brak (pozostań na poziomie 3)</option>
                      {getFilteredSubcategories(4).map(sc => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Level 5 */}
                {selectedMove.noteSubCategoryId4 && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Poziom 5</label>
                    <select
                      value={selectedMove.noteSubCategoryId5 || ''}
                      onChange={(e) => handleSubcategoryChange(5, e.target.value ? parseInt(e.target.value) : null)}
                      style={styles.input}
                    >
                      <option value="">Brak (pozostań na poziomie 4)</option>
                      {getFilteredSubcategories(5).map(sc => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button onClick={closeMoveModal} style={styles.cancelButton}>
                  Anuluj
                </button>
                <button onClick={handleMoveNote} style={styles.submitButton}>
                  📁 Przenieś
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    margin: 0
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
  aiCreateSection: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
  },
  aiCreateInputWrapper: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  },
  aiCreateInput: {
    flex: 1,
    padding: '0.875rem 1.25rem',
    fontSize: '1rem',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.95)',
    outline: 'none',
    transition: 'all 0.2s'
  },
  aiCreateButton: {
    padding: '0.875rem 1.5rem',
    backgroundColor: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
  foldersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  categorySection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '1rem',
    borderBottom: '2px solid #E5E7EB',
    borderLeft: '4px solid',
    paddingLeft: '1rem',
    marginBottom: '1.5rem',
    transition: 'background-color 0.2s'
  },
  categoryHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    userSelect: 'none',
    flex: 1
  },
  aiButtonsContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  aiOrganizeButton: {
    padding: '0.4rem 0.75rem',
    backgroundColor: '#8B5CF6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  aiReorganizeButton: {
    padding: '0.4rem 0.75rem',
    backgroundColor: '#EC4899',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  folderIcon: {
    fontSize: '1.5rem'
  },
  categoryContent: {
    paddingLeft: '1rem'
  },
  folderContainer: {
    marginBottom: '0.75rem'
  },
  folderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s',
    border: '1px solid transparent'
  },
  folderLevel0: {
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB'
  },
  folderLevel1: {
    backgroundColor: '#F3F4F6',
    border: '1px solid #D1D5DB'
  },
  folderLevel2: {
    backgroundColor: '#E5E7EB',
    border: '1px solid #D1D5DB'
  },
  folderLevel3: {
    backgroundColor: '#E5E7EB',
    border: '1px solid #9CA3AF'
  },
  folderHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  folderTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#555'
  },
  folderCount: {
    fontSize: '0.75rem',
    color: '#999',
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: '0.25rem 0.5rem',
    borderRadius: '8px'
  },
  folderContent: {
    marginTop: '0.5rem'
  },
  categoryTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#333',
    margin: 0
  },
  categoryCount: {
    fontSize: '0.875rem',
    color: '#999',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px'
  },
  notesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  noteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    border: '1px solid #E5E7EB'
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
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
  },
  moveContent: {
    padding: '1.5rem'
  },
  moveInfo: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px'
  },
  moveInfoLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#666',
    marginBottom: '0.5rem'
  },
  moveNotePreview: {
    fontSize: '0.95rem',
    color: '#333',
    lineHeight: '1.5'
  },
  moveSeparator: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#333',
    marginTop: '1.5rem',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #E5E7EB'
  }
};

export default Notes;
