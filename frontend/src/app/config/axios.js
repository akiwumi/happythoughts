import axios from 'axios'
import { tokenStorage } from '../utils/tokenStorage.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
})

// Request interceptor: add token if available
api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401 (token expired/invalid)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      tokenStorage.clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
