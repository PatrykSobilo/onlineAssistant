import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <h1 style={styles.logo}>🤖 Online Assistant</h1>
        
        {user && (
          <div style={styles.navLinks}>
            <Link 
              to="/dashboard" 
              style={{...styles.navLink, ...(isActive('/dashboard') && styles.navLinkActive)}}
            >
              Strona główna
            </Link>
            <Link 
              to="/notes" 
              style={{...styles.navLink, ...(isActive('/notes') && styles.navLinkActive)}}
            >
              Notatki
            </Link>
            <Link 
              to="/categories" 
              style={{...styles.navLink, ...(isActive('/categories') && styles.navLinkActive)}}
            >
              Kategorie
            </Link>
            <Link 
              to="/discussions" 
              style={{...styles.navLink, ...(isActive('/discussions') && styles.navLinkActive)}}
            >
              Dyskusje
            </Link>
          </div>
        )}
      </div>
      
      <div style={styles.right}>
        {user && (
          <>
            <span style={styles.userName}>👋 {user.name}</span>
            <Link to="/settings" style={styles.settingsButton} title="Ustawienia">
              ⚙️
            </Link>
            <button onClick={logout} style={styles.logoutButton}>
              Wyloguj
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  logo: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333'
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center'
  },
  navLink: {
    textDecoration: 'none',
    color: '#666',
    fontSize: '1rem',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    transition: 'all 0.3s'
  },
  navLinkActive: {
    backgroundColor: '#f0f0f0',
    color: '#333',
    fontWeight: '600'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userName: {
    fontSize: '1rem',
    color: '#666'
  },
  settingsButton: {
    fontSize: '1.5rem',
    textDecoration: 'none',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'background-color 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px'
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500'
  }
};

export default Navbar;
