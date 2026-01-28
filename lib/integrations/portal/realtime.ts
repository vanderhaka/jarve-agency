export const PORTAL_CHAT_EVENT = 'portal_message'

export function getPortalChatChannel(projectId: string): string {
  return `portal-chat:${projectId}`
}
