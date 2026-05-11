export type EventType = 'error' | 'info' | 'success' | 'warning';

export interface GlobalEvent {
  title: string;
  description: string;
  eventType: EventType;
  timeout?: number;
}

export type EventListener = (payload: GlobalEvent) => void;
