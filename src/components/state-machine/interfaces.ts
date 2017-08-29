import { MessageBus, Message } from "inversify-components";
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
   * Method which is called automatically if no intent method was matched
   * @param machine Current transitionable interface
   * @param originalIntent Name of intent the state machine tried to call 
  */
  unhandledGenericIntent(machine: Transitionable, originalIntent: string): any;

  /** 
   * If an assistant fires and "endSession" intent, for example if a user does not answer anything, this method is called
   * @param machine Current transitionable interface
   */
  unansweredGenericIntent(machine: Transitionable): any;
}

/** Implement this interface in your state if you need an error handler */
export interface StateErrorHandler {
  /** Method to be called automatically if an error occures in one of your intent methods
   * @param error The occured error object
   * @param state Current state object
   * @param stateName Name of current state
   * @param intentMethod Called intent method as string
   * @param transitionable machine
   */
  errorFallback(error: any, state: State, stateName: string, intentMethod: string, transitionable: Transitionable, ...args: any[]);
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

  /** Jumps to given intent in current state */
  handleIntent(intent: intent, ...args: any[]): Promise<void>;
}

export interface StateMachine extends Transitionable {}