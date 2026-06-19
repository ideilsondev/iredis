import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConnectionRecord } from '../api/connections';

interface AppState {
  isNewKeyDialogOpen: boolean;
  isNewChannelDialogOpen: boolean;
  isConnectionFormOpen: boolean;
  editingConn: ConnectionRecord | null;
  setNewKeyDialogOpen: (isOpen: boolean) => void;
  setNewChannelDialogOpen: (isOpen: boolean) => void;
  setConnectionFormOpen: (isOpen: boolean, conn?: ConnectionRecord | null) => void;
  activeConnection: ConnectionRecord | null;
  setActiveConnection: (conn: ConnectionRecord | null) => void;
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
  activeTab: 'connections' | 'keys' | 'events';
  setActiveTab: (tab: 'connections' | 'keys' | 'events') => void;
  unreadEvents: number;
  incrementUnreadEvents: () => void;
  clearUnreadEvents: () => void;
  inAppNotification: { title: string; body: string } | null;
  setInAppNotification: (notif: { title: string; body: string } | null) => void;
  savedChannels: Record<string, string[]>;
  saveChannel: (connectionId: string, channel: string) => void;
  removeSavedChannel: (connectionId: string, channel: string) => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  isNewKeyDialogOpen: false,
  isNewChannelDialogOpen: false,
  isConnectionFormOpen: false,
  editingConn: null,
  setNewKeyDialogOpen: (isOpen) => set({ isNewKeyDialogOpen: isOpen }),
  setNewChannelDialogOpen: (isOpen) => set({ isNewChannelDialogOpen: isOpen }),
  setConnectionFormOpen: (isOpen, conn = null) => set({ isConnectionFormOpen: isOpen, editingConn: conn }),
  activeConnection: null,
  setActiveConnection: (conn) => set({ activeConnection: conn, activeTab: conn ? 'keys' : 'connections', activeKey: null }),
  activeKey: null,
  setActiveKey: (key) => set({ activeKey: key }),
  activeTab: 'connections',
  setActiveTab: (tab) => set({ 
    activeTab: tab,
    ...(tab === 'events' ? { unreadEvents: 0 } : {})
  }),
  unreadEvents: 0,
  incrementUnreadEvents: () => set((state) => ({ unreadEvents: state.unreadEvents + 1 })),
  clearUnreadEvents: () => set({ unreadEvents: 0 }),
  inAppNotification: null,
  setInAppNotification: (notif) => set({ inAppNotification: notif }),
  savedChannels: {},
  saveChannel: (connId, channel) => set((state) => {
    const existing = state.savedChannels[connId] || [];
    if (existing.includes(channel)) return state;
    return { savedChannels: { ...state.savedChannels, [connId]: [...existing, channel] } };
  }),
  removeSavedChannel: (connId, channel) => set((state) => {
    const existing = state.savedChannels[connId] || [];
    return { savedChannels: { ...state.savedChannels, [connId]: existing.filter(c => c !== channel) } };
  }),
}), {
  name: 'iredis-app-storage',
  partialize: (state) => ({ savedChannels: state.savedChannels }), // Only persist saved channels
}));
