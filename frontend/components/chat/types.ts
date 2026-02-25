export interface UserProfile {
  id: string;
  avatar: string;
  name?: string;
  gender: "male" | "female" | "any";
  age: number;
  status: "friendship" | "relationship" | "chat";
  country: string;
  voiceIntro?: string;
  nativeLanguage: string;
  communicationLanguage: string;
  interests: string[];
  lastActiveAt: number;
}

export type Mode = "room" | "discovery" | "private";

export interface ChatMessage {
  id: string;
  senderId: string;
  sessionId?: string;
  roomId?: string;
  text?: string;
  audio?: string;
  sticker?: string;
  timestamp: number;
  expiresAt: number;
  type: 'text' | 'audio' | 'sticker';
}

export interface KnockState {
  id: string;
  fromUserId: string;
  targetUserId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  timestamp: number;
}

export interface SessionData {
  sessionId: string;
  partnerId: string;
  partnerProfile?: UserProfile;
}

export interface ChatState {
  mode: Mode;
  currentUser: UserProfile | null;
  onlineUsers: UserProfile[];
  roomMessages: ChatMessage[];
  privateMessages: ChatMessage[];
  activeSession: SessionData | null;
  incomingKnock: KnockState | null;
  outgoingKnock: KnockState | null;
  discoveryResults: UserProfile[];
  activeRoomId: string | null;
}
