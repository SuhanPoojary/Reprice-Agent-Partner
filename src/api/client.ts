export type ApiError = {
  status: number
  message: string
  data?: any
}

const DEFAULT_BASE = import.meta.env.DEV
  ? 'http://localhost:3001/api'
  : 'https://reprice-backend-a5mp.onrender.com/api'

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_BASE
}

export function getToken() {
  return localStorage.getItem('token')
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers ? (init.headers as any) : {}),
  }

  const wantsAuth = init?.auth !== false
  if (wantsAuth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...init,
    headers,
  })

  const text = await res.text()
  const data = text ? (JSON.parse(text) as any) : null

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed (${res.status})`
    throw { status: res.status, message, data } satisfies ApiError
  }

  return data as T
}
