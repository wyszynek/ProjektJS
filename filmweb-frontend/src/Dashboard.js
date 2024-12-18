import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Odczytanie danych użytkownika z localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleLogout = () => {
    // Usunięcie danych użytkownika z localStorage
    localStorage.removeItem('user');
    // Przekierowanie na stronę logowania
    navigate('/login');
  };

  return (
    <div>
      <h2>Welcome to your Dashboard, {user ? user.userName : 'Loading...'}</h2>
      {user && <button onClick={handleLogout}>Logout</button>}
    </div>
  );
}

export default Dashboard;
