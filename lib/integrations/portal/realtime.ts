export const PORTAL_CHAT_EVENT = 'portal_message'
export const PORTAL_DASHBOARD_CHANNEL = 'portal-dashboard'
export const PORTAL_DASHBOARD_EVENT = 'new_client_message'

export function getPortalChatChannel(projectId: string): string {
  return `portal-chat:${projectId}`
}
