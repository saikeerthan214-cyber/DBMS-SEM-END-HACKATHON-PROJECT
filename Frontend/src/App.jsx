import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Navbar from './components/Navbar';

function Layout() {
  const location  = useLocation();
  const noNavbar  = ['/admin', '/dashboard'].includes(location.pathname);

  return (
    <>
      {!noNavbar && <Navbar />}
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/admin"     element={<AdminDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="*"          element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
