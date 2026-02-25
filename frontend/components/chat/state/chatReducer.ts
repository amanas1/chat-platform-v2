import { ChatState, ChatMessage, UserProfile, KnockState, SessionData, Mode } from '../types';

export const initialChatState: ChatState = {
  mode: 'discovery',
  currentUser: null,
  onlineUsers: [],
  roomMessages: [],
  privateMessages: [],
  activeSession: null,
  incomingKnock: null,
  outgoingKnock: null,
  discoveryResults: [],
  activeRoomId: null,
};

export type ChatAction =
  | { type: 'SET_CURRENT_USER'; payload: UserProfile }
  | { type: 'SET_MODE'; payload: Mode }
  | { type: 'SET_ROOM'; payload: string }
  | { type: 'UPDATE_ONLINE_USERS'; payload: UserProfile[] }
  | { type: 'DISCOVERY_RESULTS_UPDATED'; payload: UserProfile[] }
  | { type: 'ROOM_MESSAGE_RECEIVED'; payload: ChatMessage }
  | { type: 'PRIVATE_MESSAGE_RECEIVED'; payload: ChatMessage }
  | { type: 'MESSAGE_EXPIRED'; payload: { messageId: string, isPrivate: boolean } }
  | { type: 'USER_KNOCKED'; payload: KnockState }
  | { type: 'KNOCK_SENT'; payload: KnockState }
  | { type: 'KNOCK_ACCEPTED'; payload: SessionData }
  | { type: 'KNOCK_REJECTED'; payload: null }
  | { type: 'SESSION_CREATED'; payload: SessionData }
  | { type: 'SESSION_ENDED'; payload: null };

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_ROOM':
      return { ...state, activeRoomId: action.payload, mode: 'room', roomMessages: [] };
    case 'UPDATE_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    case 'DISCOVERY_RESULTS_UPDATED':
      return { ...state, discoveryResults: action.payload };
    case 'ROOM_MESSAGE_RECEIVED':
      return { 
        ...state, 
        roomMessages: [...state.roomMessages, action.payload].slice(-50) // Keep last 50 strictly
      };
    case 'PRIVATE_MESSAGE_RECEIVED':
      return { 
        ...state, 
        privateMessages: [...state.privateMessages, action.payload].slice(-50)
      };
    case 'MESSAGE_EXPIRED':
      return action.payload.isPrivate 
        ? { ...state, privateMessages: state.privateMessages.filter(m => m.id !== action.payload.messageId) }
        : { ...state, roomMessages: state.roomMessages.filter(m => m.id !== action.payload.messageId) };
    case 'USER_KNOCKED':
      return { ...state, incomingKnock: action.payload };
    case 'KNOCK_SENT':
      return { ...state, outgoingKnock: action.payload };
    case 'KNOCK_ACCEPTED':
    case 'SESSION_CREATED':
      return { 
        ...state, 
        activeSession: action.payload, 
        mode: 'private', 
        incomingKnock: null, 
        outgoingKnock: null,
        privateMessages: []
      };
    case 'KNOCK_REJECTED':
      return { ...state, incomingKnock: null, outgoingKnock: null };
    case 'SESSION_ENDED':
      return { ...state, activeSession: null, mode: 'discovery', privateMessages: [] };
    default:
      return state;
  }
}
