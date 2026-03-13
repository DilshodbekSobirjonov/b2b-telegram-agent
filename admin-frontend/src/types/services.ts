export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface BotConfig {
  id: string;
  name: string;
  status: 'online' | 'offline';
  provider: 'anthropic' | 'openai' | 'gemini';
  messagesProcessed: number;
}
