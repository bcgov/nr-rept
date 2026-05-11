import type { EventListener, GlobalEvent, EventType } from './types';

// Global event name for bridged events
const BRIDGED_EVENT = 'global-app-event';

/**
 * A generic event handler for custom events, usable inside and outside React.
 * Allows subscribing, unsubscribing, and dispatching events by name.
 */
class EventHandler {
  private listeners: Record<EventType, EventListener[]> = {
    error: [],
    info: [],
    success: [],
    warning: [],
  };

  /**
   * Initializes the EventHandler and sets up a bridge to listen for global window events.
   * When a global event is received, it dispatches it to the appropriate listeners.
   */
  constructor() {
    window.addEventListener(BRIDGED_EVENT, (event: Event) => {
      if ('detail' in event && (event as CustomEvent).detail) {
        const dispatchedEvent = (event as CustomEvent).detail;
        this.dispatch(dispatchedEvent.eventType, dispatchedEvent);
      }
    });
  }

  /**
   * Subscribes a listener to a specific event type.
   * @param eventName - The name/type of the event to listen for (e.g., 'info', 'error').
   * @param listener - The callback function to invoke when the event is dispatched.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(eventName: EventType, listener: EventListener) {
    this.listeners[eventName].push(listener);
    return () => this.unsubscribe(eventName, listener);
  }

  /**
   * Unsubscribes a listener from a specific event type.
   * @param eventName - The name/type of the event to unsubscribe from.
   * @param listener - The callback function to remove.
   */
  unsubscribe(eventName: EventType, listener: EventListener) {
    this.listeners[eventName] = this.listeners[eventName].filter(
      (registeredListener) => registeredListener !== listener,
    );
  }

  /**
   * Dispatches an event to all listeners subscribed to the given event type.
   * @param eventName - The name/type of the event to dispatch.
   * @param payload - The event payload to send to listeners.
   */
  dispatch(eventName: EventType, payload: GlobalEvent) {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName].forEach((listener) => listener(payload));
  }
}

/**
 * Singleton instance of the EventHandler for use throughout the app.
 */
export const eventHandler = new EventHandler();

/**
 * Sends a global event by dispatching a CustomEvent on the window object.
 * This will be picked up by the EventHandler bridge and routed to listeners.
 * @param detail - The event payload to send.
 */
export const sendEvent = (detail: GlobalEvent) => {
  window.dispatchEvent(new CustomEvent(BRIDGED_EVENT, { detail }));
};
