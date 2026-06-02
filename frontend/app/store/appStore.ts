import { create } from "zustand"

interface AppStore {
  selectedAgentId: string | null
  selectedSessionId: string | null
  demoRunning: boolean
  setSelectedAgent: (id: string | null) => void
  setSelectedSession: (id: string | null) => void
  setDemoRunning: (running: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  selectedAgentId: null,
  selectedSessionId: null,
  demoRunning: false,
  setSelectedAgent: (id) => set({ selectedAgentId: id }),
  setSelectedSession: (id) => set({ selectedSessionId: id }),
  setDemoRunning: (running) => set({ demoRunning: running }),
}))
