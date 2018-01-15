import { MessageBus, Message } from "inversify-components";
import { Session } from "../services/interfaces";
import { RequestContext } from '../root/interfaces';
import { TranslateHelper } from '../i18n/translate-helper';
import { ResponseFactory } from '../unifier/response-factory';
import { MinimalRequestExtraction, GenericIntent,  intent} from '../unifier/interfaces';

export const componentInterfaces = {
  "state": Symbol("state"),
  "metaState": Symbol("meta state"),

  // Hooks
  "beforeIntent": Symbol("before-intent-hook"),
  "afterIntent": Symbol("after-intent-hook")
};

export const MAIN_STATE_NAME = "MainState";

export namespace State {

  /** Main interface to implement a state */
  export interface Required {
    /** 
     * Method which is called automatically if no intent method was matched
     * @param machine Current transitionable interface
     * @param originalIntentMethod Name of intent the state machine tried to call 
    */
    unhandledGenericIntent(machine: Transitionable, originalIntentMethod: string): any;

    /** 
     * If an assistant fires and "endSession" intent, for example if a user does not answer anything, this method is called
     * @param machine Current transitionable interface
     */
    unansweredGenericIntent(machine: Transitionable): any;
  }

  /** Implement this interface in your state if you need an error handler */
  export interface ErrorHandler {
    /** 
     * Method to be called automatically if an error occures in one of your intent methods
     * @param error The occured error object
     * @param state Current state object
     * @param stateName Name of current state
     * @param intentMethod Called intent method as string
     * @param transitionable machine
     */
    errorFallback(error: any, state: Required, stateName: string, intentMethod: string, transitionable: Transitionable, ...args: any[]);
  }

  /** Implement this interface to have a method called before every intent call */
  export interface BeforeIntent {
    /**
     * If existing, a beforeIntent_-Method is called every time before an intent is called. Your beforeIntent-method
     * is called after all hooks have been called and returned a successful result.
     * @param {string} intentMethod Name of the intent method to call afterwards
     * @param {Transitionable} machine Reference to state machine
     * @return {boolean|Promise<boolean>} If you return false instead of true, the intent method will not be called.
     */
    beforeIntent_(intentMethod: string, machine: Transitionable, ...args: any[]): Promise<boolean> | boolean;
  }

  /** Implement this interface to have a method called after every intent call. */
  export interface AfterIntent {
    /**
     * If existing, a afterIntent_-Method is called every time after an intent was called. If calling your intent raised an
     * error, afterIntent_ is not called.
     * @param {string} intentMethod Name of intent method to call afterwards
     * @param {Transitionable} machine Reference to state machine
     * @param {void}
     */
    afterIntent_(intentMethod: string, machine: Transitionable, ...args: any[]): void;
  }

}

export interface StateConstructor {
  new(...args: any[]): State.Required;
}

export interface MetaState {
  readonly name: string;
  readonly intents: intent[];
}

export interface StateFactory {
  /** Returns a state by name (string).
   * @param stateName Name of state. If you leave out this parameter, the main state is returned.
  */
  <T extends State.Required>(stateName?: string): T;
}

/** Set containing objects needed to setup a BaseState. */
export interface StateSetupSet {
  responseFactory: ResponseFactory;
  translateHelper: TranslateHelper;
  extraction: MinimalRequestExtraction;
}

export interface Transitionable {
  /** History of all called intent methods */
  intentHistory: { stateName: string; intentMethodName: string }[];

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