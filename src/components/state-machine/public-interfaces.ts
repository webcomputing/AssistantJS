import { ExecutableExtension } from "inversify-components";
import { TranslateHelper } from "../i18n/translate-helper";
import { Logger } from "../root/public-interfaces";
import { BasicAnswerTypes, BasicHandable, intent, MinimalRequestExtraction, OptionallyPromise } from "../unifier/public-interfaces";

/** Name of the main state */
export const MAIN_STATE_NAME = "MainState";

/** Namespace containing all state-specific interfaces */
export namespace State {
  /** Main interface to implement a state */
  export interface Required {
    /**
     * Method which is called automatically if no intent method was matched
     * @param machine Current transitionable interface
     * @param originalIntentMethod Name of intent the state machine tried to call
     */
    unhandledGenericIntent(machine: Transitionable, originalIntentMethod: string, ...args: any[]): any | Promise<any>;

    /**
     * If an assistant fires and "endSession" intent, for example if a user does not answer anything, this method is called
     * @param machine Current transitionable interface
     */
    unansweredGenericIntent(machine: Transitionable, ...args: any[]): any | Promise<any>;
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
     * @return {void}
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
     * @return {void}
     */
    afterIntent_(intentMethod: string, machine: Transitionable, ...args: any[]): void;
  }

  /** Constructor of state objects */
  export type Constructor<S extends Required = Required> = new (...args: any[]) => S;

  /**
   * Returns a state by name (string).
   * @param {string} stateName Name of state. If you leave out this parameter, the main state is returned.
   * @return {State extends State.Required}
   */
  export type Factory = <T extends State.Required = State.Required>(stateName?: string) => T;

  /** Set containing all objects needed to setup a BaseState. */
  export interface SetupSet<MergedAnswerTypes extends BasicAnswerTypes, MergedHandler extends BasicHandable<MergedAnswerTypes>> {
    responseHandler: MergedHandler;
    translateHelper: TranslateHelper;
    extraction: MinimalRequestExtraction;
    logger: Logger;
  }

  /** Contains meta information about a state */
  export interface Meta {
    readonly name: string;
    readonly intents: intent[];
  }

  /** Returns name of current state name. If nothing is stored in session, uses MainState */
  export type CurrentNameProvider = () => Promise<string>;

  /** Returns name and instance of current state */
  export type CurrentProvider = () => Promise<{ instance: State.Required; name: string }>;
}

/** Interface which is implemented by AssistantJS's state machine. Describes transitions, redirects, ... */
export interface Transitionable {
  /** History of all called intent methods */
  intentHistory: Array<{ stateName: string; intentMethodName: string }>;

  /** Checks if given state exists */
  stateExists(state: string): boolean;

  /** Transitions to given state. Promise fulfills as soon as transition was successful */
  transitionTo(state: string): Promise<void>;

  /** Transitions to given state and calls intent method */
  redirectTo(state: string, intent: intent, ...args: any[]): Promise<void>;

  /** Jumps to given intent in current state */
  handleIntent(intent: intent, ...args: any[]): Promise<void>;
}

/** Holds all environment information about the execution of this filter: Which state was it, which intent, ... */
export interface FilterExecutionContext<IntentArguments = any[]> {
  /** Instance of state on which the filter was applied */
  state: State.Required;

  /** Name of the state on which the filter was applied */
  stateName: string;

  /** Name of intent method this filter was applied to */
  intentMethod: string;

  /** All additional arguments passed to the intent method */
  additionalIntentArguments: IntentArguments;
}

export interface Filter<FilterParams extends object | undefined = never> {
  /**
   * Method of filter that is executed if the referenced filter is used as a decorator
   * @param ExecutionContext Holds all environment information about the execution of this filter (current state, intent, ...)
   * @param {FilterParams} filterArguments All arguments you passed via @filter() decorator
   * @returns An object containing a state/intent to be used instead of the intially called intent or a boolean (both as promises, if filter does some async operations); If it returns true the filter gets ignored; If it's false the filter handles an intent execution by itself.
   */
  execute(
    /** Holds all environment information about the execution of this filter: Which state was it, which intent, ... */
    executionContext: FilterExecutionContext,
    /** All arguments you passed via @filter() decorator */
    filterArguments: FilterParams
  ): OptionallyPromise<{ state: string; intent: string; args?: any[] } | boolean>;
}
/**
 * This interface represents extensions which are used after the context is set. e.g the StateMachine
 */
export interface AfterContextExtension extends ExecutableExtension {
  execute(...args: any[]): any | Promise<any>;
}

/**
 * Extensions of this type can are executed before the statemachine is executed
 */
export interface BeforeStateMachine {
  /**
   * Method which gets executed automatically, can be either sync with return tpye void or async with return type Promise<void>
   */
  execute(): void | Promise<void>;
}

/**
 * Extensions of this type are executed after the statemachine is executed.
 * Has same type like interface BeforeStateMachine
 */
export type AfterStateMachine = BeforeStateMachine;

/**
 * Includes the state name and instance, returned by ContextStatesProvider
 */
export interface ContextState {
  instance: State.Required;
  name: string;
}
/**
 * Returns a function for retrieving all context states.
 */
export type ContextStatesProvider = () => Promise<ContextState[]>;
