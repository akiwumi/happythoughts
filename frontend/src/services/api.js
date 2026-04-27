import api from '../app/config/axios'
import { API_ENDPOINTS } from '../app/config/constants'
import { tokenStorage } from '../app/utils/tokenStorage.js'

export const authService = {
  register: async (name, email, password) => {
    const res = await api.post(API_ENDPOINTS.AUTH_REGISTER, { name, email, password })
    return res.data
  },

  login: async (email, password) => {
    const res = await api.post(API_ENDPOINTS.AUTH_LOGIN, { email, password })
    const { token, user } = res.data
    if (token) tokenStorage.setToken(token)
    if (user) tokenStorage.setUser(user)
    return res.data
  },

  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH_LOGOUT)
    } finally {
      tokenStorage.clearAuth()
    }
  },

  getMe: async () => {
    const res = await api.get(API_ENDPOINTS.AUTH_ME)
    if (res.data?.user) tokenStorage.setUser(res.data.user)
    return res.data
  },
}

export const thoughtsService = {
  // Get all thoughts (public)
  getThoughts: async () => {
    const res = await api.get(API_ENDPOINTS.THOUGHTS)
    return res.data
  },

  // Create a new thought (requires authentication)
  createThought: async (message) => {
    const res = await api.post(API_ENDPOINTS.THOUGHTS, { message })
    return res.data
  },

  // Edit a thought (requires authentication + author only)
  editThought: async (id, message) => {
    const res = await api.put(API_ENDPOINTS.THOUGHTS_BY_ID(id), { message })
    return res.data
  },

  // Delete a thought (requires authentication + author only)
  deleteThought: async (id) => {
    const res = await api.delete(API_ENDPOINTS.THOUGHTS_BY_ID(id))
    return res.data
  },

  // Like a thought (public)
  likeThought: async (id) => {
    const res = await api.post(API_ENDPOINTS.LIKE_THOUGHT(id))
    return res.data
  },
}

export const messagesService = {
  getAll: async () => {
    const res = await api.get(API_ENDPOINTS.MESSAGES)
    return res.data
  },
  send: async (text) => {
    const res = await api.post(API_ENDPOINTS.MESSAGES, { text })
    return res.data
  },
  edit: async (id, text) => {
    const res = await api.put(`${API_ENDPOINTS.MESSAGES}/${id}`, { text })
    return res.data
  },
  remove: async (id) => {
    const res = await api.delete(`${API_ENDPOINTS.MESSAGES}/${id}`)
    return res.data
  },
}
