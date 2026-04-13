import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/debate'

const useDebateStore = create(
  persist(
    (set, get) => ({
      topic: '',
      sessionId: '',
      agents: [],
      positions: [],
      messages: [],
      interrupts: [],
      chaosLevel: 50,
      currentRound: 0,
      isRunning: false,
      selectedModels: [],
      error: null,
      isRequestLocked: false,

      setTopic: (topic) => set({ topic }),
      setSession: (sessionId) => set({ sessionId }),
      addMessages: (messages) => set((state) => ({ messages: [...state.messages, ...messages] })),
      addInterrupt: (interrupt) => set((state) => ({ interrupts: [...state.interrupts, interrupt] })),
      setAgents: (agents) => set({ agents }),
      setPositions: (positions) => set({ positions }),
      setChaosLevel: (chaosLevel) => set({ chaosLevel }),
      setSelectedModels: (selectedModels) => set({ selectedModels }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      lockRequest: () => set({ isRequestLocked: true }),
      unlockRequest: () => set({ isRequestLocked: false }),
      clearSession: () => set({
        topic: '',
        sessionId: '',
        agents: [],
        positions: [],
        messages: [],
        interrupts: [],
        chaosLevel: 50,
        currentRound: 0,
        isRunning: false,
        error: null,
        isRequestLocked: false
      }),

      interrupt: async (message) => {
        const { sessionId, isRequestLocked } = get()

        if (isRequestLocked) {
          set({ error: 'Please wait, request in progress' })
          return
        }

        if (!sessionId) {
          set({ error: 'No session ID' })
          return
        }

        if (!message || !message.trim()) {
          set({ error: 'Message cannot be empty' })
          return
        }

        if (message.trim().length > 300) {
          set({ error: 'Message too long (max 300 characters)' })
          return
        }

        set({ error: null, isRequestLocked: true })

        try {
          const response = await fetch(`${API_URL}/interrupt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, message: message.trim() })
          })

          const data = await response.json()

          if (data.error) {
            set({ error: data.message || data.error })
            return
          }

          set((state) => ({
            interrupts: [...state.interrupts, {
              content: message.trim().slice(0, 300),
              round: state.currentRound || 1,
              timestamp: new Date()
            }]
          }))
        } catch (error) {
          set({ error: error.message })
        } finally {
          set({ isRequestLocked: false })
        }
      },

      nextRound: async () => {
        const { sessionId, agents, chaosLevel, isRequestLocked } = get()

        if (isRequestLocked) {
          set({ error: 'Please wait, request in progress' })
          return
        }

        if (!sessionId) {
          set({ error: 'No session ID' })
          return
        }

        set({ isRunning: true, error: null, isRequestLocked: true })

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        try {
          const response = await fetch(`${API_URL}/next-round`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, chaosLevel }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          const data = await response.json()

          if (data.error) {
            set({ error: data.message || data.error, isRunning: false })
            return
          }

          const formattedMessages = data.messages.map(msg => {
            const agent = agents.find(a => a.id === msg.agentId)
            return {
              agentId: msg.agentId,
              name: agent?.name || 'Agent',
              message: msg.content,
              round: msg.round,
              color: agent?.color || 'green',
              messageId: `${msg.agentId}-${msg.round}-${Date.now()}`
            }
          })

          set((state) => ({
            messages: [...state.messages, ...formattedMessages],
            currentRound: data.round,
            isRunning: false
          }))
        } catch (error) {
          clearTimeout(timeoutId)
          if (error.name === 'AbortError') {
            set({ error: 'Request timed out. Please try again.', isRunning: false })
          } else {
            set({ error: error.message, isRunning: false })
          }
        } finally {
          set({ isRequestLocked: false })
        }
      }
    }),
    {
      name: 'debate-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        topic: state.topic,
        agents: state.agents,
        positions: state.positions,
        messages: state.messages,
        currentRound: state.currentRound,
        chaosLevel: state.chaosLevel
      })
    }
  )
)

export default useDebateStore