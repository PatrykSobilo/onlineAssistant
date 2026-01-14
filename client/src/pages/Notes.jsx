import Navbar from '../components/Navbar';

const Notes = () => {
  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.title}>📝 Twoje Notatki</h2>
        <p style={styles.placeholder}>Zapisane notatki pojawią się tutaj...</p>
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
  title: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '1.5rem'
  },
  placeholder: {
    fontSize: '1.125rem',
    color: '#999',
    textAlign: 'center',
    marginTop: '3rem'
  }
};

export default Notes;
