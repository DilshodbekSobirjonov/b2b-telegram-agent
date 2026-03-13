export interface Client {
  id: string;
  name: string;
  avatar: string;
  lastConversation: string;
  status: 'active' | 'inactive';
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  summary: string;
  transcript: Array<{ role: 'user' | 'assistant', content: string }>;
}
