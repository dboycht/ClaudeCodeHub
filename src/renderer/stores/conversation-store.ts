import { create } from 'zustand';
import type { Conversation, ConversationDetail, ColorLabel } from '../../shared/types';

interface ConversationState {
  conversations: Conversation[];
  selectedIds: Set<string>;
  activeDetail: ConversationDetail | null;
  activeId: string | null;
  searchQuery: string;
  filterProject: string | null;
  filterStarred: boolean;
  filterColor: ColorLabel | null;
  isLoading: boolean;

  setConversations: (convs: Conversation[]) => void;
  setActiveDetail: (detail: ConversationDetail | null) => void;
  setActiveId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterProject: (project: string | null) => void;
  setFilterStarred: (starred: boolean) => void;
  setFilterColor: (color: ColorLabel | null) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setIsLoading: (loading: boolean) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;

  getFilteredConversations: () => Conversation[];
  getProjects: () => string[];
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  selectedIds: new Set<string>(),
  activeDetail: null,
  activeId: null,
  searchQuery: '',
  filterProject: null,
  filterStarred: false,
  filterColor: null,
  isLoading: false,

  setConversations: (convs) => set({ conversations: convs }),
  setActiveDetail: (detail) => set({ activeDetail: detail }),
  setActiveId: (id) => set({ activeId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterProject: (project) => set({ filterProject: project }),
  setFilterStarred: (starred) => set({ filterStarred: starred }),
  setFilterColor: (color) => set({ filterColor: color }),
  toggleSelect: (id) => {
    const next = new Set(get().selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ selectedIds: next });
  },
  selectAll: () => {
    const filtered = get().getFilteredConversations();
    set({ selectedIds: new Set(filtered.map(c => c.id)) });
  },
  clearSelection: () => set({ selectedIds: new Set() }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  updateConversation: (id, updates) => {
    set({
      conversations: get().conversations.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  },
  removeConversation: (id) => {
    set({
      conversations: get().conversations.filter(c => c.id !== id),
      selectedIds: (() => {
        const next = new Set(get().selectedIds);
        next.delete(id);
        return next;
      })(),
    });
  },

  getFilteredConversations: () => {
    const { conversations, searchQuery, filterProject, filterStarred, filterColor } = get();
    let filtered = conversations;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.displayName.toLowerCase().includes(q) ||
        c.firstMessage.toLowerCase().includes(q) ||
        c.projectName.toLowerCase().includes(q)
      );
    }

    if (filterProject) {
      filtered = filtered.filter(c => c.project === filterProject);
    }

    if (filterStarred) {
      filtered = filtered.filter(c => c.isStarred);
    }

    if (filterColor) {
      filtered = filtered.filter(c => c.color === filterColor);
    }

    return filtered;
  },

  getProjects: () => {
    const projects = new Set(get().conversations.map(c => c.project));
    return Array.from(projects);
  },
}));
