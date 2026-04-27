// Secure token storage utilities
const TOKEN_KEY = 'happy_thoughts_token'
const USER_KEY = 'happy_thoughts_user'

// Token storage with security considerations
export const tokenStorage = {
  // Get token from storage
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  },

  // Set token in storage
  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token)
      }
    } catch (error) {
      console.error('Error setting token:', error)
    }
  },

  // Remove token from storage
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.error('Error removing token:', error)
    }
  },

  // Get user data from storage
  getUser: () => {
    try {
      const userStr = localStorage.getItem(USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  },

  // Set user data in storage
  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      }
    } catch (error) {
      console.error('Error setting user:', error)
    }
  },

  // Remove user data from storage
  removeUser: () => {
    try {
      localStorage.removeItem(USER_KEY)
    } catch (error) {
      console.error('Error removing user:', error)
    }
  },

  // Clear all auth data
  clearAuth: () => {
    tokenStorage.removeToken()
    tokenStorage.removeUser()
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = tokenStorage.getToken()
    const user = tokenStorage.getUser()
    return !!(token && user)
  }
}
