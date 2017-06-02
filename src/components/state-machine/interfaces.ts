import { GenericIntent, GenericPlatformHandle, intent } from "../unifier/interfaces";

export const componentInterfaces = {
  "state": Symbol("state"),
  "meta-state": Symbol("meta state"),

  // Hooks
  "before-intent": Symbol("before-intent-hook"),
};

export interface Transitionable {
  transitionTo(state: string, onFinish?: () => void): void;
  redirectTo(state: string, intent: intent, onFinish?: () => void, ...args: any[]): void;
}

export interface StateMachine extends Transitionable {
  handleIntent(intent: intent, ...args: any[]): void;
}