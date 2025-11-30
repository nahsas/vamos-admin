

export type AppEvent = 'new-order';

class EventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: AppEvent, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: AppEvent, callback: Function) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(
      (listener) => listener !== callback
    );
  }

  emit(event: AppEvent, payload?: any) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach((listener) => listener(payload));
  }
}

export const appEventEmitter = new EventEmitter();
