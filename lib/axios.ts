import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://your-backend-api-url.com/api', // Replace with your actual backend URL
  // You can add other default settings here, like headers
});

// Attach token from localStorage on each request (if present)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('token')
    if (t) {
      // Avoid typing issues by treating headers as a simple record for modification
      const headers = ((config.headers as unknown) as Record<string, string> | undefined) || {}
      headers["Authorization"] = `Bearer ${t}`
      config.headers = (headers as unknown) as typeof config.headers
    }
  }
  return config
})

// On 401 - remove token and redirect to login (client-only)
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      // give the app a chance to react; nav redirect
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default apiClient;