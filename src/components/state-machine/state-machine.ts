import { inject, injectable } from "inversify";
import { Hooks } from "inversify-components";
import { Logger } from "../root/public-interfaces";
import { CurrentSessionFactory, Session } from "../services/public-interfaces";
import { GenericIntent, intent } from "../unifier/public-interfaces";

import { injectionNames } from "../../injection-names";
import { componentInterfaces } from "./private-interfaces";
import { State, Transitionable } from "./public-interfaces";

@injectable()
export class StateMachine implements Transitionable {
  public intentHistory: Array<{ stateName: string; intentMethodName: string }> = [];

  constructor(
    @inject(injectionNames.current.stateProvider) private getCurrentState: State.CurrentProvider,
    @inject("core:state-machine:state-names") private stateNames: string[],
    @inject(injectionNames.current.sessionFactory) private currentSessionFactory: CurrentSessionFactory,
    @inject("core:hook-pipe-factory") private pipeFactory: Hooks.PipeFactory,
    @inject("core:root:current-logger") private logger: Logger
  ) {}

  public async handleIntent(requestedIntent: intent, ...args: any[]) {
    const currentState = await this.getCurrentState();

    const intentMethod = this.deriveIntentMethod(requestedIntent);
    this.intentHistory.push({ stateName: currentState.name, intentMethodName: intentMethod });
    this.logger.info("Handling intent '" + intentMethod + "' on state " + currentState.name);

    try {
      // Run beforeIntent-hooks as filter
      const hookResults = await this.getBeforeIntentCallbacks()
        .withArguments(currentState.instance, currentState.name, intentMethod, this, ...args)
        .runAsFilter();

      // Abort if not all hooks returned a "success" result
      if (!hookResults.success) {
        this.logger.info("One of your hooks did not return a successful result. Aborting planned state machine execution.");
        return;
      }

      // Check if there is a "beforeIntent_" method available
      if (this.isStateWithBeforeIntent(currentState.instance)) {
        const callbackResult = await Promise.resolve(currentState.instance.beforeIntent_(intentMethod, this, ...args));

        if (typeof callbackResult !== "boolean") {
          throw new Error(
            `You have to return either true or false in your beforeIntent_ callback. Called beforeIntent_ for ${currentState.name}#${intentMethod}. `
          );
        }

        if (!callbackResult) {
          this.logger.info("Your beforeIntent_ callback returned false. Aborting planned state machine execution.");
          return;
        }
      }

      // Check if intentMethod is available in currentState
      if (typeof currentState.instance[intentMethod] === "function") {
        // Call given intent
        await Promise.resolve(currentState.instance[intentMethod](this, ...args));

        // Call afterIntent_ method if present
        if (this.isStateWithAfterIntent(currentState.instance)) {
          currentState.instance.afterIntent_(intentMethod, this, ...args);
        }

        // Run afterIntent hooks
        await this.getAfterIntentCallbacks()
          .withArguments(currentState.instance, currentState.name, intentMethod, this, ...args)
          .runWithResultset();
      } else {
        // -> Intent does not exist on state class, so call unhandledGenericIntent instead
        await this.handleIntent(GenericIntent.Unhandled, intentMethod, ...args);
      }
    } catch (e) {
      // Handle exception by error handler
      await this.handleOrReject(e, currentState.instance, currentState.name, intentMethod, ...args);
    }
  }

  public async transitionTo(state: string) {
    if (this.stateNames.indexOf(state) === -1) throw Error("Cannot transition to " + state + ": State does not exist!");

    return this.currentSessionFactory().set("__current_state", state);
  }

  public async redirectTo(state: string, requestedIntent: intent, ...args: any[]) {
    await this.transitionTo(state);
    return this.handleIntent(requestedIntent, ...args);
  }

  public stateExists(state: string) {
    return this.stateNames.indexOf(state) !== -1;
  }

  /* Private helper methods */

  /** Checks if the current state is able to handle an error (=> if it has an 'errorFallback' method). If not, throws the error again. */
  private async handleOrReject(error: Error, state: State.Required, stateName: string, intentMethod: string, ...args): Promise<void> {
    if (this.isStateWithErrorFallback(state)) {
      await Promise.resolve(state.errorFallback(error, state, stateName, intentMethod, this, ...args));
    } else {
      throw error;
    }
  }

  /** If you change this: Have a look at registering of states / automatic intent recognition, too! */
  private deriveIntentMethod(requestedIntent: intent): string {
    if (typeof requestedIntent === "string" && requestedIntent.endsWith("Intent")) return requestedIntent;

    const baseString = (typeof requestedIntent === "string" ? requestedIntent : GenericIntent[requestedIntent].toLowerCase() + "Generic") + "Intent";
    return baseString.charAt(0).toLowerCase() + baseString.slice(1);
  }

  private getBeforeIntentCallbacks() {
    return this.pipeFactory(componentInterfaces.beforeIntent);
  }

  private getAfterIntentCallbacks() {
    return this.pipeFactory(componentInterfaces.afterIntent);
  }

  /** Type Guards */
  private isStateWithBeforeIntent(state: State.Required | State.Required & State.BeforeIntent): state is State.Required & State.BeforeIntent {
    return "beforeIntent_" in state;
  }

  private isStateWithAfterIntent(state: State.Required | State.Required & State.AfterIntent): state is State.Required & State.AfterIntent {
    return "afterIntent_" in state;
  }

  private isStateWithErrorFallback(state: State.Required | State.Required & State.ErrorHandler): state is State.Required & State.ErrorHandler {
    return "errorFallback" in state;
  }
}
