import { MessageBus, Message } from "ioc-container";
import { Session } from "../services/interfaces";
import { GenericIntent, intent } from "../unifier/interfaces";

export const componentInterfaces = {
  "state": Symbol("state"),
  "metaState": Symbol("meta state"),

  // Hooks
  "beforeIntent": Symbol("before-intent-hook"),
  "afterIntent": Symbol("after-intent-hook")
};

export const MAIN_STATE_NAME = "MainState";

/** Main interface to implement a state */
export interface State {
  /** 
   * Method to be called automatically if no intent method was matched
   * @param machine Current transitionable interface
   * @param originalIntent Name of intent the state machine tried to call 
  */
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

export interface Transitionable {
  /** Checks if given state exists */
  stateExists(state: string): boolean;

  /** Transitions to given state. Promise fulfills as soon as transition was successful */
  transitionTo(state: string): Promise<void>;

  /** Transitions to given state and calls intent method */
  redirectTo(state: string, intent: intent, ...args: any[]): Promise<void>;
}

export interface StateMachine extends Transitionable {
  handleIntent(intent: intent, ...args: any[]): Promise<void>;
}