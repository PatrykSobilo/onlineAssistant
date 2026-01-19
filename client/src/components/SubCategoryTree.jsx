import { useState, useEffect } from 'react';
import api from '../services/api';

const SubCategoryTree = ({ category, onClose, onUpdate }) => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [editingNode, setEditingNode] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentForNew, setParentForNew] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    fetchTree();
  }, [category.id]);

  const fetchTree = async (preserveExpanded = true) => {
    try {
      setLoading(true);
      const response = await api.get(`/subcategories/tree/${category.id}`);
      console.log('Tree response:', response.data);
      setTree(response.data.tree || []);
      setError('');
      
      // Nie resetuj expandedNodes przy odświeżaniu
      // Stan rozwinięcia jest zachowywany
    } catch (err) {
      console.error('Error fetching tree:', err);
      setError(err.response?.data?.message || 'Błąd podczas pobierania drzewa podkategorii');
      setTree([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      console.log('Expanded nodes after toggle:', Array.from(newExpanded));
      return newExpanded;
    });
  };

  const handleAdd = (parent = null) => {
    setParentForNew(parent);
    setFormData({ name: '' });
    setEditingNode(null);
    setShowAddModal(true);
  };

  const handleEdit = (node) => {
    setEditingNode(node);
    setFormData({
      name: node.name
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Zachowaj ID rodzica przed czyszczeniem stanu
    const parentId = parentForNew?.id;
    
    try {
      if (editingNode) {
        // Edycja
        await api.put(`/subcategories/${editingNode.id}`, formData);
      } else {
        // Dodawanie
        await api.post('/subcategories', {
          ...formData,
          categoryId: category.id,
          parentSubCategoryId: parentId || null,
          level: parentForNew ? parentForNew.level + 1 : 1
        });
      }

      // Zamknij modal
      setShowAddModal(false);
      setFormData({ name: '' });
      setEditingNode(null);
      setParentForNew(null);
      
      // Rozwiń węzeł rodzica PRZED odświeżeniem
      if (parentId) {
        setExpandedNodes(prev => {
          const newExpanded = new Set(prev);
          newExpanded.add(parentId);
          return newExpanded;
        });
      }
      
      // Odśwież drzewo - expandedNodes już zaktualizowane
      await fetchTree();
      
    } catch (err) {
      console.error('Error saving subcategory:', err);
      setError(err.response?.data?.message || 'Błąd podczas zapisywania');
    }
  };

  const handleDelete = async (node) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć "${node.name}"? ${node.children?.length > 0 ? 'Wszystkie podkategorie również zostaną usunięte.' : ''}`)) {
      return;
    }

    try {
      await api.delete(`/subcategories/${node.id}`);
      fetchTree();
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      setError(err.response?.data?.message || 'Błąd podczas usuwania');
    }
  };

  const handleUnlock = async (node) => {
    try {
      await api.put(`/subcategories/${node.id}/unlock`);
      fetchTree();
    } catch (err) {
      console.error('Error unlocking subcategory:', err);
      setError(err.response?.data?.message || 'Błąd podczas odblokowywania');
    }
  };

  const expandAll = (nodes) => {
    const allIds = new Set(expandedNodes);
    const collectIds = (nodeList) => {
      nodeList.forEach(node => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(nodes);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const renderNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const canAddChild = node.level < 5; // Max 5 poziomów
    const isLocked = !node.isUnlocked;

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? '24px' : '0' }}>
        <div style={{
          ...styles.node,
          ...(isLocked ? styles.nodeLocked : {})
        }}>
          <div style={styles.nodeContent}>
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.id)}
                style={styles.expandButton}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            {!hasChildren && <span style={styles.nodeIndent}>&nbsp;&nbsp;&nbsp;</span>}
            
            <span style={styles.nodeLevel}>L{node.level}</span>
            <span style={styles.nodeName}>
              {isLocked && '🔒 '}{node.name}
            </span>
            {hasChildren && (
              <span style={styles.childrenCount}>({node.children.length})</span>
            )}
          </div>

          <div style={styles.nodeActions}>
            {isLocked && (
              <button
                onClick={() => handleUnlock(node)}
                style={styles.unlockButton}
                title="Odblokuj"
              >
                🔓
              </button>
            )}
            {canAddChild && (
              <button
                onClick={() => handleAdd(node)}
                style={styles.addChildButton}
                title="Dodaj podkategorię"
              >
                +
              </button>
            )}
            <button
              onClick={() => handleEdit(node)}
              style={styles.editNodeButton}
              title="Edytuj"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDelete(node)}
              style={styles.deleteNodeButton}
              title="Usuń"
            >
              🗑️
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={styles.children}>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            <span style={{ color: category.color }}>{category.icon}</span>
            {' '}{category.name} - Struktura podkategorii
          </h3>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <button
              onClick={() => handleAdd(null)}
              style={styles.addRootButton}
            >
              + Dodaj główną podkategorię (Poziom 1)
            </button>
          </div>
          <div style={styles.toolbarRight}>
            <button
              onClick={() => expandAll(tree)}
              style={styles.expandButton}
              title="Rozwiń wszystko"
            >
              ⬇️ Rozwiń
            </button>
            <button
              onClick={collapseAll}
              style={styles.collapseButton}
              title="Zwiń wszystko"
            >
              ⬆️ Zwiń
            </button>
            <div style={styles.legend}>
              <span style={styles.legendItem}>🔒 = Zablokowana</span>
              <span style={styles.legendItem}>L1-L5 = Poziom</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>Ładowanie drzewa...</div>
        ) : !Array.isArray(tree) || tree.length === 0 ? (
          <div style={styles.empty}>
            Brak podkategorii. Dodaj pierwszą podkategorię.
          </div>
        ) : (
          <div style={styles.treeContainer}>
            {tree.map(node => renderNode(node))}
          </div>
        )}

        {/* Modal dodawania/edycji */}
        {showAddModal && (
          <div style={styles.formOverlay} onClick={() => setShowAddModal(false)}>
            <div style={styles.formModal} onClick={(e) => e.stopPropagation()}>
              <h4 style={styles.formTitle}>
                {editingNode ? '✏️ Edytuj podkategorię' : '➕ Nowa podkategoria'}
              </h4>
              
              {parentForNew && (
                <div style={styles.parentInfo}>
                  Poziom: <strong>{parentForNew.level + 1}</strong>
                  {' '}| Pod: <strong>{parentForNew.name}</strong>
                </div>
              )}
              {!editingNode && !parentForNew && (
                <div style={styles.parentInfo}>
                  Poziom: <strong>1</strong> (główna podkategoria)
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nazwa</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.input}
                    placeholder="Nazwa podkategorii"
                    required
                    autoFocus
                  />
                </div>

                <div style={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={styles.cancelButton}
                  >
                    Anuluj
                  </button>
                  <button type="submit" style={styles.submitButton}>
                    {editingNode ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '2px solid #E5E7EB'
  },
  title: {
    margin: 0,
    fontSize: '1.4rem',
    color: '#333'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.8rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  toolbar: {
    padding: '1rem 1.5rem',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  toolbarLeft: {
    display: 'flex',
    gap: '0.5rem'
  },
  toolbarRight: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  addRootButton: {
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  expandButton: {
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    padding: '0.5rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  collapseButton: {
    backgroundColor: '#6B7280',
    color: 'white',
    border: 'none',
    padding: '0.5rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  legend: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.8rem',
    color: '#6B7280'
  },
  legendItem: {
    padding: '0.3rem 0.6rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #D1D5DB'
  },
  treeContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem'
  },
  node: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 0.8rem',
    marginBottom: '0.3rem',
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  nodeLocked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D'
  },
  nodeContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1
  },
  expandButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0.2rem',
    color: '#6B7280',
    width: '20px'
  },
  nodeIndent: {
    width: '20px',
    display: 'inline-block'
  },
  nodeLevel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'white',
    backgroundColor: '#6B7280',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    minWidth: '28px',
    textAlign: 'center'
  },
  nodeName: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#333'
  },
  childrenCount: {
    fontSize: '0.8rem',
    color: '#6B7280',
    fontWeight: '600'
  },
  nodeActions: {
    display: 'flex',
    gap: '0.3rem'
  },
  unlockButton: {
    background: 'none',
    border: '1px solid #F59E0B',
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  addChildButton: {
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '700'
  },
  editNodeButton: {
    background: 'none',
    border: '1px solid #3B82F6',
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  deleteNodeButton: {
    background: 'none',
    border: '1px solid #EF4444',
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  children: {
    marginTop: '0.3rem'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6B7280',
    fontSize: '1.1rem'
  },
  empty: {
    textAlign: 'center',
    padding: '3rem',
    color: '#9CA3AF',
    fontSize: '1rem'
  },
  error: {
    margin: '1rem 1.5rem',
    padding: '0.8rem',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '6px',
    fontSize: '0.9rem'
  },
  formOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000
  },
  formModal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '90%',
    maxWidth: '450px'
  },
  formTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.2rem',
    color: '#333'
  },
  parentInfo: {
    padding: '0.7rem',
    backgroundColor: '#EFF6FF',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    color: '#1E40AF',
    border: '1px solid #BFDBFE'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    color: '#374151',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '0.95rem',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  formActions: {
    display: 'flex',
    gap: '0.8rem',
    justifyContent: 'flex-end',
    marginTop: '1.5rem'
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    color: '#374151',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  submitButton: {
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default SubCategoryTree;
