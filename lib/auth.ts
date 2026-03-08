import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionUser {
  id: string
  username: string
  phone: string
  preferredLanguage: 'EN' | 'ZH'
}

export interface SessionData {
  player1?: SessionUser
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'gomoku_iron_session_secret_key_32chars_min',
  cookieName: 'goclick_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
