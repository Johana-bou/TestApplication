import api from './axios'

export interface Notification {
  id_notif: number
  type: 'INFO' | 'ALERTE' | 'SUCCES'
  message: string
  lu: boolean
  date_notif: string
}

// GET /api/notifications/?only_non_lues=false&limit=50
export const getNotifications = (params?: {
  only_non_lues?: boolean
  limit?: number
  skip?: number
}): Promise<Notification[]> =>
  api.get('/api/notifications/', { params }).then(r => r.data)

// GET /api/notifications/non-lues/count
export const getNonLuesCount = (): Promise<{ non_lues_count: number }> =>
  api.get('/api/notifications/non-lues/count').then(r => r.data)

// PUT /api/notifications/{notif_id}/read
export const marquerLu = (notifId: number) =>
  api.put(`/api/notifications/${notifId}/read`).then(r => r.data)

// PUT /api/notifications/read-all
export const marquerTousLus = () =>
  api.put('/api/notifications/read-all').then(r => r.data)

// POST /api/notifications/  — ADMIN uniquement
export const createNotification = (data: {
  id_user: number
  type?: 'INFO' | 'ALERTE' | 'SUCCES'
  message: string
}) => api.post('/api/notifications/', data).then(r => r.data)

// DELETE /api/notifications/{notif_id}
export const deleteNotification = (notifId: number) =>
  api.delete(`/api/notifications/${notifId}`)
