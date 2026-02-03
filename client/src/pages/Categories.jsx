import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SubCategoryTree from '../components/SubCategoryTree';
import api from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingTree, setViewingTree] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '📁',
    color: '#3B82F6'
  });

  const predefinedIcons = [
    // Ogólne
    '📁', '📂', '📋', '📌', '📍', '🏷️', '🔖', '📎', '🗂️', '📦',
    // Praca i biznes
    '💼', '💻', '⌨️', '🖥️', '📱', '📞', '📧', '📨', '📩', '✉️', '📝', '📄', '📃', '📑', '🗒️', '📊', '📈', '📉', '💰', '💵', '💴', '💶', '💷', '💳', '🏦', '🏢', '🏭', '🏗️',
    // Dom i życie
    '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🛋️', '🛏️', '🚪', '🪟', '🔑', '🛠️', '🔨', '🔧', '🪛', '⚙️',
    // Sport i fitness
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳', '🏹', '🎣', '🥊', '🥋', '🤸', '🤺', '⛷️', '🏂', '🏋️', '🤾', '🏌️', '🧗', '🚴', '🚵', '🤹', '🧘', '🏃', '🚶', '⚡', '💪',
    // Hobby i rozrywka
    '🎮', '🎯', '🎲', '🎰', '🎭', '🎪', '🎨', '🖌️', '🖍️', '✏️', '🖊️', '🖋️', '✒️', '📐', '📏', '🎬', '🎤', '🎧', '🎵', '🎶', '🎹', '🎸', '🥁', '🎺', '🎷', '📷', '📸', '📹', '🎥', '📺', '📻', '📖', '📚', '📕', '📗', '📘', '📙', '🔬', '🔭', '🧬', '🧪', '🧫',
    // Nauka i edukacja
    '🎓', '📚', '📖', '✏️', '📝', '📐', '🔬', '🔭', '🧮', '🧪', '🧬', '📊', '🗺️', '🌍', '🌎', '🌏', '🧠', '💡', '🔍', '🔎',
    // Jedzenie i picie
    '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🥗', '🍝', '🍜', '🍲', '🍱', '🍣', '🍤', '🍙', '🍚', '🍛', '🥘', '🍖', '🍗', '🥩', '🥓', '🍞', '🥐', '🥖', '🧀', '🥚', '🍳', '🥞', '🧇', '🥯', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉',
    // Podróże i transport
    '✈️', '🚀', '🛸', '🚁', '🛩️', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🗺️', '🧳', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏖️', '🏝️',
    // Natura i zwierzęta
    '🌳', '🌲', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌺', '🌻', '🌷', '🌹', '🥀', '🌸', '💐', '🏵️', '🌼', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄',
    // Pogoda i niebo
    '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☂️', '⛱️', '⚡', '🔥', '💧', '🌊', '🌙', '⭐', '🌟', '✨', '💫',
    // Symbole i emocje
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💖', '💗', '💓', '💞', '💘', '💝', '⭐', '✨', '💫', '🔥', '💥', '✅', '❌', '⚠️', '⛔', '🚫', '💯', '🎯', '🎁', '🎀', '🎉', '🎊', '🎈', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '👑', '💎', '💍', '🔔', '🔕', '🎵', '🎶', '🔊', '📢', '⚡', '🔆', '💡', '🔦',
    // Czas i kalendarz
    '⏰', '⏱️', '⏲️', '⏳', '⌛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '📅', '📆', '🗓️',
    // Medycyna i zdrowie
    '🏥', '⚕️', '💊', '💉', '🩺', '🩹', '🩼', '🧬', '🦠', '🧪', '🧫', '🌡️', '❤️‍🩹', '🫀', '🧠', '🦴', '🦷', '👁️',
    // Technologia
    '💻', '🖥️', '⌨️', '🖱️', '🖨️', '💾', '💿', '📀', '🎮', '🕹️', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '⚙️', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚡', '🔬', '🔭', '📡', '🗜️',
    // Znaki i strzałki
    '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '🔄', '🔃', '🔁', '🔂', '▶️', '⏸️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➕', '➖', '✖️', '➗', '♾️', '‼️', '⁉️', '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '⚜️', '🔱', '📛', '🔰', '⭕', '✅', '☑️', '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟',
  ];
  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      console.log('Categories response:', response.data);
      setCategories(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching categories:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Błąd podczas pobierania kategorii');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Aktualizacja
        await api.put(`/categories/${editingCategory.id}`, formData);
      } else {
        // Dodawanie nowej
        await api.post('/categories', formData);
      }
      
      fetchCategories();
      resetForm();
      setError('');
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.message || 'Błąd podczas zapisywania kategorii');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color
    });
    setShowAddModal(true);
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć kategorię "${categoryName}"? Wszystkie powiązane subkategorie również zostaną usunięte.`)) {
      return;
    }

    try {
      await api.delete(`/categories/${categoryId}`);
      fetchCategories();
      setError('');
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || 'Błąd podczas usuwania kategorii');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', icon: '📁', color: '#3B82F6' });
    setEditingCategory(null);
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.container}>
          <p style={styles.loading}>Ładowanie kategorii...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>📂 Kategorie</h2>
          <button 
            onClick={() => setShowAddModal(true)} 
            style={styles.addButton}
          >
            + Dodaj kategorię
          </button>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {categories.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Nie masz jeszcze żadnych kategorii</p>
            <button 
              onClick={() => setShowAddModal(true)} 
              style={styles.emptyButton}
            >
              Utwórz pierwszą kategorię
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {categories.map((category) => (
              <div key={category.id} style={styles.categoryCard}>
                <div style={styles.categoryHeader}>
                  <div style={styles.categoryIcon} title={category.icon}>
                    <span style={{...styles.iconLarge, color: category.color}}>
                      {category.icon}
                    </span>
                  </div>
                  <h3 style={styles.categoryName}>{category.name}</h3>
                </div>

                <div style={styles.categoryStats}>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Subkategorie:</span>
                    <span style={styles.statValue}>
                      {category.subCategories?.length || 0}
                    </span>
                  </div>
                  <div style={styles.colorIndicator}>
                    <span style={styles.statLabel}>Kolor:</span>
                    <div 
                      style={{
                        ...styles.colorBox, 
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>

                <div style={styles.categoryActions}>
                  <button 
                    onClick={() => setViewingTree(category)}
                    style={styles.viewTreeButton}
                  >
                    🌳 Podkategorie
                  </button>
                  <button 
                    onClick={() => handleEdit(category)}
                    style={styles.editButton}
                  >
                    ✏️ Edytuj
                  </button>
                  <button 
                    onClick={() => handleDelete(category.id, category.name)}
                    style={styles.deleteButton}
                  >
                    🗑️ Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal dodawania/edycji */}
        {showAddModal && (
          <div style={styles.modalOverlay} onClick={resetForm}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>
                {editingCategory ? '✏️ Edytuj kategorię' : '➕ Nowa kategoria'}
              </h3>

              <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nazwa kategorii</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={styles.input}
                    placeholder="np. Praca, Hobby, Osobiste..."
                    required
                    autoFocus
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Ikona</label>
                  <div style={styles.iconPickerContainer}>
                    <div style={styles.iconPickerLeft}>
                      <div style={styles.selectedIconDisplay}>
                        <span style={styles.selectedIconLarge}>{formData.icon}</span>
                      </div>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        style={styles.inputSmall}
                        placeholder="lub wpisz własne emoji"
                        maxLength="2"
                      />
                    </div>
                    <div style={styles.iconPickerRight}>
                      <div style={styles.iconGrid}>
                        {predefinedIcons.map((icon, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setFormData({...formData, icon})}
                            style={{
                              ...styles.iconButton,
                              ...(formData.icon === icon ? styles.iconButtonActive : {})
                            }}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Kolor</label>
                  <div style={styles.colorPicker}>
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({...formData, color})}
                        style={{
                          ...styles.colorButton,
                          backgroundColor: color,
                          ...(formData.color === color ? styles.colorButtonActive : {})
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    style={styles.colorInput}
                  />
                </div>

                <div style={styles.preview}>
                  <span style={styles.previewLabel}>Podgląd:</span>
                  <div style={styles.previewBox}>
                    <span style={{...styles.previewIcon, color: formData.color}}>
                      {formData.icon}
                    </span>
                    <span style={styles.previewName}>{formData.name || 'Nazwa'}</span>
                  </div>
                </div>

                <div style={styles.modalActions}>
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    style={styles.cancelButton}
                  >
                    Anuluj
                  </button>
                  <button 
                    type="submit" 
                    style={styles.submitButton}
                  >
                    {editingCategory ? 'Zapisz zmiany' : 'Dodaj kategorię'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal drzewa podkategorii */}
        {viewingTree && (
          <SubCategoryTree
            category={viewingTree}
            onClose={() => {
              // Odśwież kategorie po zamknięciu modala
              fetchCategories();
              setViewingTree(null);
            }}
            onUpdate={null}
          />
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
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.1rem',
    color: '#666',
    padding: '3rem'
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    borderLeft: '4px solid #DC2626'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    border: '2px dashed #D1D5DB'
  },
  emptyText: {
    fontSize: '1.2rem',
    color: '#6B7280',
    marginBottom: '1.5rem'
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem'
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s',
    border: '1px solid #E5E7EB'
  },
  categoryHeader: {
    textAlign: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #E5E7EB'
  },
  categoryIcon: {
    marginBottom: '0.5rem'
  },
  iconLarge: {
    fontSize: '3rem'
  },
  categoryName: {
    fontSize: '1.3rem',
    color: '#333',
    margin: '0.5rem 0 0 0',
    fontWeight: '600'
  },
  categoryStats: {
    marginBottom: '1rem'
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem'
  },
  statLabel: {
    color: '#6B7280',
    fontSize: '0.9rem'
  },
  statValue: {
    color: '#333',
    fontWeight: '600'
  },
  colorIndicator: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  colorBox: {
    width: '30px',
    height: '20px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB'
  },
  categoryActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  viewTreeButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    color: 'white',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap'
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap'
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    fontSize: '1.5rem',
    color: '#333',
    marginBottom: '1.5rem',
    marginTop: 0
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#374151',
    fontWeight: '600'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '1rem',
    boxSizing: 'border-box'
  },
  inputSmall: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '0.9rem',
    boxSizing: 'border-box'
  },
  iconPickerContainer: {
    display: 'flex',
    gap: '1rem',
    height: '300px'
  },
  iconPickerLeft: {
    flex: '0 0 150px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  selectedIconDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    border: '2px solid #E5E7EB',
    borderRadius: '12px',
    height: '120px'
  },
  selectedIconLarge: {
    fontSize: '4rem'
  },
  iconPickerRight: {
    flex: 1,
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    minWidth: 0
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '0.4rem',
    padding: '0.5rem',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  iconPicker: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  },
  iconButton: {
    padding: '0.4rem',
    fontSize: '1.3rem',
    border: '2px solid transparent',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: '1',
    width: '100%',
    minWidth: 0
  },
  iconButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF'
  },
  colorPicker: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  },
  colorButton: {
    width: '100%',
    height: '40px',
    border: '2px solid transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  colorButtonActive: {
    borderColor: '#333',
    transform: 'scale(1.1)'
  },
  colorInput: {
    width: '100%',
    height: '40px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  preview: {
    backgroundColor: '#F9FAFB',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid #E5E7EB'
  },
  previewLabel: {
    display: 'block',
    fontSize: '0.9rem',
    color: '#6B7280',
    marginBottom: '0.5rem'
  },
  previewBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  previewIcon: {
    fontSize: '2rem'
  },
  previewName: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#333'
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    color: '#374151',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  submitButton: {
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default Categories;
