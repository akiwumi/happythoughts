export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export const ROUTES = {
  HOME: '/',
  THOUGHTS: '/thoughts',
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  PROFILE: '/profile',
  NOT_FOUND: '*',
}

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  
  // Thoughts
  THOUGHTS: '/thoughts',
  THOUGHTS_BY_ID: (id) => `/thoughts/${id}`,
  LIKE_THOUGHT: (id) => `/thoughts/${id}/like`,
  
  MESSAGES: '/messages',
}
