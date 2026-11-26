const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'lp-token'

// JWT kept in localStorage so the session survives a page reload.
export const auth = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

// App registers a handler so an expired/invalid token logs the user out.
let unauthorizedHandler = () => {}
export const onUnauthorized = (fn) => {
  unauthorizedHandler = fn
}

async function request(path, options = {}) {
  const token = auth.get()
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  // 401 with a token = session expired/invalid (a failed login has no token yet)
  if (res.status === 401 && token) unauthorizedHandler(data.message)
  if (!res.ok || data.success === false) throw new Error(data.message || `Request failed (${res.status})`)
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
}
