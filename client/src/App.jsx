import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Notes from './pages/Notes'
import Categories from './pages/Categories'
import Discussions from './pages/Discussions'
import Settings from './pages/Settings'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/notes" 
            element={
              <PrivateRoute>
                <Notes />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/categories" 
            element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/discussions" 
            element={
              <PrivateRoute>
                <Discussions />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
