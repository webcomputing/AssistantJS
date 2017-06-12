import { MessageBus, Message } from "ioc-container";
import { Session } from "../services/interfaces";
import { GenericIntent, GenericPlatformHandle, ConversationContext, intent } from "../unifier/interfaces";

export const componentInterfaces = {
  "state": Symbol("state"),
  "metaState": Symbol("meta state"),

  // Hooks
  "beforeIntent": Symbol("before-intent-hook"),
  "afterIntent": Symbol("after-intent-hook")
};

export const MAIN_STATE_NAME = "MainState";

export interface State {
  unhandledIntent(machine: Transitionable, originalIntent: string): void;
}

export interface StateConstructor {
  new(...args: any[]): State;
}

export interface MetaState {
  readonly name: string;
  readonly intents: intent[];
}

export interface StateFactory {
  /** Returns a state by name (string).
   * @param stateName Name of state. If you leave out this parameter, the main state is returned.
  */
  (stateName?: string): State;
}

// Interface segregation principle
export interface Transitionable {
  transitionTo(state: string): Promise<void>;
  redirectTo(state: string, intent: intent, ...args: any[]): Promise<void>;
}

export interface StateMachine extends Transitionable {
  handleIntent(intent: intent, ...args: any[]): void;
}