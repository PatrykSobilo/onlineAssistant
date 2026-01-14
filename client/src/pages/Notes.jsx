import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchNotes();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchNotes = async (categoryId = '') => {
    try {
      setLoading(true);
      const url = categoryId ? `/api/notes?categoryId=${categoryId}` : '/api/notes';
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

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>📝 Twoje Notatki</h2>
          
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
                  <span style={styles.noteDate}>{formatDate(note.createdAt)}</span>
                </div>
                
                {getSubcategoryPath(note) && (
                  <div style={styles.breadcrumb}>
                    📂 {getSubcategoryPath(note)}
                  </div>
                )}
                
                <div style={styles.noteContent}>
                  {note.content}
                </div>
                
                {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
                  <div style={styles.tags}>
                    {note.tags.map((tag, idx) => (
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
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem'
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
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
    }
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  categoryBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'white'
  },
  noteDate: {
    fontSize: '0.75rem',
    color: '#999'
  },
  breadcrumb: {
    fontSize: '0.875rem',
    color: '#666',
    marginBottom: '1rem',
    padding: '0.5rem',
    backgroundColor: '#F3F4F6',
    borderRadius: '6px'
  },
  noteContent: {
    fontSize: '1rem',
    color: '#333',
    lineHeight: '1.6',
    marginBottom: '1rem',
    maxHeight: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre-wrap'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem'
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
  }
};

export default Notes;
