import Navbar from '../components/Navbar';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Settings = () => {
  const { user } = useContext(AuthContext);

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.title}>⚙️ Ustawienia</h2>
        
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Informacje o koncie</h3>
          <div style={styles.field}>
            <label style={styles.label}>Imię:</label>
            <span style={styles.value}>{user?.name}</span>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email:</label>
            <span style={styles.value}>{user?.email}</span>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Ustawienia aplikacji</h3>
          <p style={styles.placeholder}>Ustawienia będą dostępne wkrótce...</p>
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '0 2rem'
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '2rem'
  },
  section: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#333',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #f0f0f0'
  },
  field: {
    display: 'flex',
    marginBottom: '1rem'
  },
  label: {
    fontWeight: '600',
    width: '100px',
    color: '#666'
  },
  value: {
    color: '#333'
  },
  placeholder: {
    fontSize: '1rem',
    color: '#999',
    fontStyle: 'italic'
  }
};

export default Settings;
