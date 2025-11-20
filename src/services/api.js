// API Service pour E-Motions Video
const API_URL = 'https://sensational-naiad-e44c75.netlify.app/.netlify/functions';

class EmotionsVideoAPI {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentification
  async signup(email, password, name) {
    const data = await this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'signup', email, password, name }),
    });
    if (data.token) {
      this.setAuth(data.token, data.user);
    }
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', email, password }),
    });
    if (data.token) {
      this.setAuth(data.token, data.user);
    }
    return data;
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  async logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
  }

  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    return this.user;
  }
}

const api = new EmotionsVideoAPI();
export default api;