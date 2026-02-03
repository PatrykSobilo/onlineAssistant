import Navbar from '../components/Navbar';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { user, updateUser } = useContext(AuthContext);
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Delete account state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const saveProfile = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await api.put('/auth/profile', profileData);
      console.log('Profile update response:', response.data);
      updateUser(response.data.user);
      setIsEditingProfile(false);
      setMessage({ type: 'success', text: 'Profil zaktualizowany pomyślnie!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Błąd aktualizacji profilu' 
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    setMessage({ type: '', text: '' });
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Nowe hasła nie są zgodne!' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Nowe hasło musi mieć co najmniej 6 znaków!' });
      return;
    }
    
    setLoading(true);
    
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      setMessage({ type: 'success', text: 'Hasło zmienione pomyślnie!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Błąd zmiany hasła' 
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setMessage({ type: '', text: '' });
    
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Wprowadź hasło aby potwierdzić usunięcie konta' });
      return;
    }
    
    if (!window.confirm('Czy na pewno chcesz usunąć konto? Ta operacja jest nieodwracalna i usunie wszystkie Twoje dane!')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await api.delete('/auth/account', {
        data: { password: deletePassword }
      });
      
      setMessage({ type: 'success', text: 'Konto zostało usunięte. Przekierowywanie...' });
      
      // Logout and redirect after 2 seconds
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Błąd usuwania konta' 
      });
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.title}>⚙️ Ustawienia</h2>
        
        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
          }}>
            {message.text}
          </div>
        )}
        
        {/* Profile Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>👤 Informacje o koncie</h3>
          
          {!isEditingProfile ? (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Imię:</label>
                <span style={styles.value}>{user?.name}</span>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email:</label>
                <span style={styles.value}>{user?.email}</span>
              </div>
              <button 
                style={styles.button}
                onClick={() => setIsEditingProfile(true)}
              >
                ✏️ Edytuj profil
              </button>
            </>
          ) : (
            <>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Imię:</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.buttonGroup}>
                <button 
                  style={styles.saveButton}
                  onClick={saveProfile}
                  disabled={loading}
                >
                  💾 Zapisz
                </button>
                <button 
                  style={styles.cancelButton}
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileData({
                      name: user.name,
                      email: user.email
                    });
                  }}
                  disabled={loading}
                >
                  ❌ Anuluj
                </button>
              </div>
            </>
          )}
        </div>

        {/* Password Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🔒 Zmiana hasła</h3>
          
          {!isChangingPassword ? (
            <button 
              style={styles.button}
              onClick={() => setIsChangingPassword(true)}
            >
              🔑 Zmień hasło
            </button>
          ) : (
            <>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Obecne hasło:</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nowe hasło:</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Potwierdź nowe hasło:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.buttonGroup}>
                <button 
                  style={styles.saveButton}
                  onClick={changePassword}
                  disabled={loading}
                >
                  💾 Zmień hasło
                </button>
                <button 
                  style={styles.cancelButton}
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  disabled={loading}
                >
                  ❌ Anuluj
                </button>
              </div>
            </>
          )}
        </div>

        {/* Delete Account Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🗑️ Usuń konto</h3>
          
          {!isDeletingAccount ? (
            <>
              <p style={styles.warningText}>
                Usunięcie konta spowoduje trwałe usunięcie wszystkich Twoich danych, w tym notatek, kategorii i dyskusji. Ta operacja jest nieodwracalna.
              </p>
              <button 
                style={styles.deleteButton}
                onClick={() => setIsDeletingAccount(true)}
              >
                🗑️ Usuń konto
              </button>
            </>
          ) : (
            <>
              <p style={styles.dangerText}>
                ⚠️ UWAGA: Ta operacja jest nieodwracalna! Wszystkie Twoje dane zostaną trwale usunięte.
              </p>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Potwierdź hasło aby usunąć konto:</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  style={styles.input}
                  placeholder="Wprowadź swoje hasło"
                />
              </div>
              <div style={styles.buttonGroup}>
                <button 
                  style={styles.deleteButton}
                  onClick={deleteAccount}
                  disabled={loading}
                >
                  🗑️ Tak, usuń moje konto
                </button>
                <button 
                  style={styles.cancelButton}
                  onClick={() => {
                    setIsDeletingAccount(false);
                    setDeletePassword('');
                  }}
                  disabled={loading}
                >
                  ❌ Anuluj
                </button>
              </div>
            </>
          )}
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
  formGroup: {
    marginBottom: '1rem'
  },
  formLabel: {
    display: 'block',
    fontWeight: '600',
    color: '#666',
    marginBottom: '0.5rem'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    backgroundColor: 'white'
  },
  checkboxGroup: {
    marginBottom: '1rem'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    color: '#333',
    cursor: 'pointer'
  },
  checkbox: {
    marginRight: '0.5rem',
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '0.5rem'
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    marginTop: '1rem'
  },
  message: {
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '1rem'
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  },
  deleteButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem'
  },
  warningText: {
    fontSize: '0.95rem',
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    border: '1px solid #ffeeba'
  },
  dangerText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#721c24',
    backgroundColor: '#f8d7da',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    border: '1px solid #f5c6cb'
  }
};

export default Settings;
