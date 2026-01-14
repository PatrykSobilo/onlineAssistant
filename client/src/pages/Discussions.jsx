import Navbar from '../components/Navbar';

const Discussions = () => {
  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.title}>💬 Dyskusje z AI</h2>
        <p style={styles.placeholder}>Historia rozmów pojawi się tutaj...</p>
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

export default Discussions;
