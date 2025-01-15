import React, { useState } from 'react'; //zarządzanie lokalnym stanem komponentu 
import axios from 'axios'; //łatwe komunikowanie się z backendem w celu przesyłania lub odbierania danych (to klient HTTP obsługujący żądania AJAX, upraszcza go)
// automatycznie parsuje odpowiedzi w formacie JSON
// od razu wyrzuca błąd
// ułatwia dodawanie niestandardowych nagłówków (np. tokenów autoryzacyjnych)
import { useNavigate } from 'react-router-dom'; //nawigowanie między różnymi stronami bez przeładowywania całej aplikacji
import './style/Shared.css';

function Login({ setIsLoggedIn }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
 // Funkcja obsługująca proces logowania
  const handleLogin = async (e) => {
    e.preventDefault();  // Zapobiega przeładowaniu strony po wysłaniu formularza
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', { //axios nawiązuje połączenie z serwerem, przekazuje treść danych zapytania i czeka na odp
        identifier, // Login użytkownika (email lub nazwa użytkownika)
        password,
      });

      setMessage(response.data.message);
      // Zapisanie tokena JWT i danych użytkownika w localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Zaktualizowanie stanu logowania w aplikacji nadrzędnej
      setIsLoggedIn(true);
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back!</h2>
        <p className="auth-subtitle">Log in to your account</p>
        <form className="auth-form" onSubmit={handleLogin}>
          <input
            className="auth-input"
            type="text"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="auth-button" type="submit">
            Log In
          </button>
        </form>
        {message && <p className="auth-message">{message}</p>}
        <div className="auth-footer">
          <p>Don't have an account? <a href="/register">Sign up</a></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
