const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
const API_KEY = process.env.NEXT_PUBLIC_COGNITO_KEY ?? ""

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
}
