import { injectable, inject } from "inversify";
import { Hooks } from "inversify-components";
import { GenericIntent, intent } from "../unifier/interfaces";
import { Session } from "../services/interfaces";
import { Logger } from "../root/interfaces";

import { State, StateMachine as StateMachineInterface, componentInterfaces, MetaState } from "./interfaces";

@injectable()
export class StateMachine implements StateMachineInterface {
  intentHistory: { stateName: string; intentMethodName: string }[] = [];
  
  constructor(
    @inject("core:state-machine:current-state-provider") private getCurrentState: () => Promise<{instance: State.Required, name: string}>,
    @inject("core:state-machine:state-names") private stateNames: string[],
    @inject("core:unifier:current-session-factory") private currentSessionFactory: () => Session,
    @inject("core:hook-pipe-factory") private pipeFactory: Hooks.PipeFactory,
    @inject("core:root:current-logger") private logger: Logger
  ) { }

  async handleIntent(intent: intent, ...args: any[]) {
    let currentState = await this.getCurrentState();

    let intentMethod = this.deriveIntentMethod(intent);
    this.intentHistory.push({stateName: currentState.name, intentMethodName: intentMethod});
    this.logger.info("Handling intent '" + intentMethod + "' on state " + currentState.name);

    try {
      // Run beforeIntent-hooks as filter
      const hookResults = await this.getBeforeIntentCallbacks().withArguments(currentState.instance, currentState.name, intentMethod, this, ...args).runAsFilter();

      // Abort if not all hooks returned a "success" result
      if (!hookResults.success) {
        this.logger.info("Hook "+ hookResults.failedHooks[0].hook.toString() +" did not return a successful result. Aborting planned state machine execution.");
        return;
      }

      // Check if there is a "beforeIntent_" method available
      if (typeof(currentState.instance["beforeIntent_"]) === "function") {
        const callbackResult = await Promise.resolve(((currentState.instance as any) as State.BeforeIntent).beforeIntent_(intentMethod, this, ...args));

        if (typeof callbackResult !== "boolean") {
          throw new Error(`You have to return either true or false in your beforeIntent_ callback. Called beforeIntent_ for ${currentState.name}#${intentMethod}. `);
        }

        if (!callbackResult) {
          this.logger.info("Your beforeIntent_ callback returned false. Aborting planned state machine execution.");
          return;
        }
      }

      // Check if intentMethod is available in currentState
      if (typeof(currentState.instance[intentMethod]) === "function") {
        // Call given intent
        await Promise.resolve(currentState.instance[intentMethod](this, ...args));

        // Call afterIntent_ method if present
        if (typeof currentState.instance["afterIntent_"] === "function") {
          ((currentState.instance as any) as State.AfterIntent).afterIntent_(intentMethod, this, ...args);
        }

        // Run afterIntent hooks
        await this.getAfterIntentCallbacks().withArguments(currentState.instance, currentState.name, intentMethod, this, ...args).runWithResultset();
      } else {
        // -> Intent does not exist on state class, so call unhandledGenericIntent instead
        await this.handleIntent(GenericIntent.Unhandled, intentMethod, ...args);
      }
    } catch(e) {
      // Handle exception by error handler
      await this.handleOrReject(e, currentState.instance, currentState.name, intentMethod, ...args);
    }
  }

  async transitionTo(state: string) {
    if (this.stateNames.indexOf(state) === -1)
      throw Error("Cannot transition to " + state + ": State does not exist!");

    return this.currentSessionFactory().set("__current_state", state);
  }

  async redirectTo(state: string, intent: intent, ...args: any[]) {
    await this.transitionTo(state);
    return this.handleIntent(intent, ...args);
  }

  stateExists(state: string) {
    return this.stateNames.indexOf(state) !== -1;
  }

  /* Private helper methods */

  /** Checks if the current state is able to handle an error (=> if it has an 'errorFallback' method). If not, throws the error again.*/
  private async handleOrReject(error: Error, state: State.Required, stateName: string, intentMethod: string, ...args): Promise<void> {
    if (typeof state["errorFallback"] === "function") {
      await Promise.resolve(state["errorFallback"](error, state, stateName, intentMethod, this, ...args));
    } else {
      throw error;
    }
  }

  /** If you change this: Have a look at registering of states / automatic intent recognition, too! */
  private deriveIntentMethod(intent: intent): string {
    if (typeof(intent) === "string" && intent.endsWith("Intent")) return intent;

    let baseString = (typeof(intent) === "string" ? intent : GenericIntent[intent].toLowerCase() + "Generic") + "Intent";
    return baseString.charAt(0).toLowerCase() + baseString.slice(1);
  }

  private getBeforeIntentCallbacks() {
    return this.pipeFactory(componentInterfaces.beforeIntent);
  }

  private getAfterIntentCallbacks() {
    return this.pipeFactory(componentInterfaces.afterIntent);
  }
}