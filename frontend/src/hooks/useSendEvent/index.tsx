import { eventHandler, sendEvent } from './eventHandler';

import type { EventType, EventListener } from './types';

/**
 * React hook for sending and subscribing to global events in the app.
 * Provides methods to send events, subscribe to event types, and unsubscribe listeners.
 *
 * @returns {{ sendEvent: typeof sendEvent, subscribe: Function, unsubscribe: Function }}
 */
const useSendEvent = () => {
  /**
   * Subscribes a listener to a specific event type.
   * @param eventName - The name/type of the event to listen for (e.g., 'info', 'error').
   * @param listener - The callback function to invoke when the event is dispatched.
   * @returns A function to unsubscribe the listener.
   */
  const subscribe = (eventName: EventType, listener: EventListener) => {
    return eventHandler.subscribe(eventName, listener);
  };

  /**
   * Unsubscribes a listener from a specific event type.
   * @param eventName - The name/type of the event to unsubscribe from.
   * @param listener - The callback function to remove.
   */
  const unsubscribe = (eventName: EventType, listener: EventListener) => {
    return eventHandler.unsubscribe(eventName, listener);
  };

  return {
    sendEvent,
    subscribe,
    unsubscribe,
  };
};

export default useSendEvent;
