import { create } from 'zustand'

export interface Notification {
  id_notif: number
  type: string
  message: string
  lu: boolean
  date_notif: string
}

interface NotifStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifs: Notification[]) => void
  markRead: (id: number) => void
  markAllRead: () => void
}

export const useNotifStore = create<NotifStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifs) =>
    set({ notifications: notifs, unreadCount: notifs.filter((n) => !n.lu).length }),
  markRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id_notif === id ? { ...n, lu: true } : n
      )
      return { notifications, unreadCount: notifications.filter((n) => !n.lu).length }
    }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, lu: true })),
      unreadCount: 0,
    })),
}))
