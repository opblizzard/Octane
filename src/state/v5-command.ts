import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useAIStore } from './ai'

export interface V5HistoryEntry {
  id: string
  page: string
  action: string
  ts: number
  input?: unknown
  output?: unknown
  note?: string
}

interface V5CommandStore {
  currentPage: string
  pageState: Record<string, Record<string, unknown>>
  history: V5HistoryEntry[]
  selectedHistoryId: string | null
  aiDraft: string
  setCurrentPage: (page: string) => void
  savePageState: (page: string, patch: Record<string, unknown>) => void
  recordHistory: (entry: Omit<V5HistoryEntry, 'id' | 'ts'>) => void
  selectHistory: (id: string | null) => void
  setAIDraft: (draft: string) => void
  clearHistory: () => void
  askIonAI: (prompt?: string) => Promise<void>
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useV5CommandStore = create<V5CommandStore>()(
  persist(
    (set, get) => ({
      currentPage: 'command-center',
      pageState: {},
      history: [],
      selectedHistoryId: null,
      aiDraft: '',

      setCurrentPage(page) {
        set({ currentPage: page })
      },

      savePageState(page, patch) {
        set((state) => ({
          pageState: {
            ...state.pageState,
            [page]: {
              ...(state.pageState[page] ?? {}),
              ...patch,
            },
          },
        }))
      },

      recordHistory(entry) {
        set((state) => ({
          history: [
            {
              id: makeId('v5h'),
              ts: Date.now(),
              ...entry,
            },
            ...state.history,
          ].slice(0, 120),
        }))
      },

      selectHistory(id) {
        set({ selectedHistoryId: id })
      },

      setAIDraft(draft) {
        set({ aiDraft: draft })
      },

      clearHistory() {
        set({ history: [], selectedHistoryId: null })
      },

      async askIonAI(prompt) {
        const state = get()
        const ai = useAIStore.getState()
        const selectedEntry = state.history.find((entry) => entry.id === state.selectedHistoryId) ?? null
        const currentPageState = state.pageState[state.currentPage] ?? {}
        const userPrompt = (prompt ?? state.aiDraft).trim() || 'Analyze the current v5 command state and suggest the next best operator action.'

        if (!ai.connected && ai.status !== 'connecting') {
          ai.connect()
        }

        const compiledPrompt = [
          'You are assisting with the Octane v5 command workflow.',
          `Current page: ${state.currentPage}`,
          `Operator request: ${userPrompt}`,
          `Current page state: ${JSON.stringify(currentPageState, null, 2)}`,
          `Selected history: ${JSON.stringify(selectedEntry, null, 2)}`,
          `Recent v5 history: ${JSON.stringify(state.history.slice(0, 8), null, 2)}`,
        ].join('\n\n')

        await ai.sendMessage(compiledPrompt)
        get().recordHistory({
          page: state.currentPage,
          action: 'ion-ai',
          input: { prompt: userPrompt, selectedHistoryId: state.selectedHistoryId },
          output: { deliveredToAI: true },
          note: 'Context sent to Ion AI',
        })
        set({ aiDraft: '' })
      },
    }),
    {
      name: 'octane-v5-command-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pageState: state.pageState,
        history: state.history,
        selectedHistoryId: state.selectedHistoryId,
        aiDraft: state.aiDraft,
      }),
    },
  ),
)