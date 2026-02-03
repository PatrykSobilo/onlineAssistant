import { useState, useEffect } from 'react';
import api from '../services/api';

const CategorySelector = ({ onSelect, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPath, setSelectedPath] = useState([]); // Ścieżka wybranych elementów
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedPath([{ type: 'category', id: category.id, name: category.name, icon: category.icon, color: category.color }]);
  };

  const handleSubCategoryClick = (subCategory, parentPath) => {
    const newPath = [...parentPath, { 
      type: 'subcategory', 
      id: subCategory.id, 
      name: subCategory.name, 
      level: subCategory.level,
      parentSubCategoryId: subCategory.parentSubCategoryId 
    }];
    setSelectedPath(newPath);
  };

  const handleConfirm = () => {
    if (selectedPath.length === 0) return;

    const lastItem = selectedPath[selectedPath.length - 1];
    const categoryItem = selectedPath[0];
    
    onSelect({
      categoryId: categoryItem.id,
      subCategoryId: lastItem.type === 'subcategory' ? lastItem.id : null,
      contextLevel: selectedPath.length,
      path: selectedPath
    });
  };

  const renderSubCategories = (subCategories, parentPath, level = 1) => {
    if (!subCategories || subCategories.length === 0) return null;

    // Filtruj tylko odblokowane subkategorie
    const unlockedSubCategories = subCategories.filter(sub => sub.isUnlocked !== false);

    if (unlockedSubCategories.length === 0) return null;

    return (
      <div style={{ ...styles.subCategoryList, marginLeft: `${level * 20}px` }}>
        {unlockedSubCategories.map(sub => (
          <div key={sub.id}>
            <div
              style={{
                ...styles.subCategoryItem,
                ...(selectedPath.some(p => p.id === sub.id) ? styles.selectedItem : {})
              }}
              onClick={() => handleSubCategoryClick(sub, parentPath)}
            >
              <span style={styles.subCategoryName}>
                {'└─ '}{sub.name}
              </span>
              <span style={styles.badge}>
                Poziom {level + 1}
              </span>
            </div>
            {sub.children && sub.children.length > 0 && 
              renderSubCategories(
                sub.children, 
                [...parentPath, { type: 'subcategory', id: sub.id, name: sub.name, level: sub.level }],
                level + 1
              )
            }
          </div>
        ))}
      </div>
    );
  };

  const buildHierarchy = (subCategories) => {
    const map = {};
    const roots = [];

    subCategories.forEach(sub => {
      map[sub.id] = { ...sub, children: [] };
    });

    subCategories.forEach(sub => {
      if (sub.parentSubCategoryId && map[sub.parentSubCategoryId]) {
        map[sub.parentSubCategoryId].children.push(map[sub.id]);
      } else {
        roots.push(map[sub.id]);
      }
    });

    return roots;
  };

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <p style={styles.loadingText}>Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Wybierz temat rozmowy</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.info}>
          Wybierz kategorię lub podkategorię, o której chcesz rozmawiać z AI.
          Wszystkie notatki z wybranego zakresu będą dostępne jako kontekst.
        </div>

        {selectedPath.length > 0 && (
          <div style={styles.selectedPath}>
            <strong>Wybrana ścieżka: </strong>
            {selectedPath.map((item, idx) => (
              <span key={idx}>
                {idx > 0 && ' → '}
                {item.icon && <span>{item.icon} </span>}
                {item.name}
              </span>
            ))}
          </div>
        )}

        <div style={styles.content}>
          {categories.length === 0 ? (
            <p style={styles.emptyText}>Brak kategorii. Utwórz pierwszą kategorię!</p>
          ) : (
            <div style={styles.categoryList}>
              {categories.map(category => {
                const hierarchy = buildHierarchy(category.subCategories || []);
                const isSelected = selectedCategory?.id === category.id;

                return (
                  <div key={category.id} style={styles.categoryBlock}>
                    <div
                      style={{
                        ...styles.categoryItem,
                        borderColor: category.color,
                        ...(selectedPath.some(p => p.id === category.id) ? styles.selectedItem : {})
                      }}
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div style={styles.categoryHeader}>
                        <span style={{ ...styles.categoryIcon, color: category.color }}>
                          {category.icon}
                        </span>
                        <span style={styles.categoryName}>{category.name}</span>
                      </div>
                      <span style={styles.badge}>Poziom 1</span>
                    </div>
                    
                    {isSelected && hierarchy.length > 0 && (
                      <div style={styles.subCategoriesContainer}>
                        {renderSubCategories(hierarchy, [{ type: 'category', id: category.id, name: category.name, icon: category.icon, color: category.color }])}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelButton}>
            Anuluj
          </button>
          <button 
            onClick={handleConfirm} 
            style={styles.confirmButton}
            disabled={selectedPath.length === 0}
          >
            Rozpocznij rozmowę
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
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
    width: '90%',
    maxWidth: '700px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  header: {
    padding: '1.5rem',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6B7280',
    padding: '0.25rem 0.5rem'
  },
  info: {
    padding: '1rem 1.5rem',
    backgroundColor: '#EFF6FF',
    borderBottom: '1px solid #DBEAFE',
    color: '#1E40AF',
    fontSize: '0.9rem'
  },
  selectedPath: {
    padding: '1rem 1.5rem',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    fontSize: '0.9rem',
    color: '#374151'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem'
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: '2rem'
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: '2rem'
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  categoryBlock: {
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  categoryItem: {
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: 'white',
    borderLeft: '4px solid',
    transition: 'all 0.2s'
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  categoryIcon: {
    fontSize: '1.5rem'
  },
  categoryName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#333'
  },
  selectedItem: {
    backgroundColor: '#EFF6FF'
  },
  subCategoriesContainer: {
    backgroundColor: '#F9FAFB',
    padding: '0.5rem',
    borderTop: '1px solid #E5E7EB'
  },
  subCategoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  subCategoryItem: {
    padding: '0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #E5E7EB',
    transition: 'all 0.2s',
    fontSize: '0.95rem'
  },
  subCategoryName: {
    color: '#374151'
  },
  badge: {
    backgroundColor: '#E5E7EB',
    color: '#374151',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  footer: {
    padding: '1.5rem',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem'
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
  confirmButton: {
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

export default CategorySelector;
