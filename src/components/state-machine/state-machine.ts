import { injectable, inject } from "inversify";
import { Hooks } from "inversify-components";
import { GenericIntent, intent } from "../unifier/interfaces";
import { Session } from "../services/interfaces";
import { log } from "../../setup";

import { State, StateMachine as StateMachineInterface, componentInterfaces, MetaState } from "./interfaces";

@injectable()
export class StateMachine implements StateMachineInterface {

  private getCurrentState: () => Promise<{instance: State, name: string}>;
  private stateNames: string[];
  private currentSessionFactory: () => Session;
  private pipeFactory: Hooks.PipeFactory;

  constructor(
    @inject("core:state-machine:current-state-provider") getCurrentState: any,
    @inject("core:state-machine:state-names") stateNames: string[],
    @inject("core:unifier:current-session-factory") currentSessionFactory: () => Session,
    @inject("core:hook-pipe-factory") pipeFactory: Hooks.PipeFactory
  ) {
    this.getCurrentState = getCurrentState;
    this.stateNames = stateNames;
    this.currentSessionFactory = currentSessionFactory;
    this.pipeFactory = pipeFactory;
  }

  async handleIntent(intent: intent, ...args: any[]) {
    let currentState = await this.getCurrentState();

    intent = this.deriveIntentMethod(intent);
    log("Handling intent '" + intent + "' on state " + currentState.name);

    // Run beforeIntent-hooks as filter
    return new Promise<void>((resolve, reject) => {
      this.getBeforeIntentCallbacks().withArguments(currentState.instance, currentState.name, intent, this).runAsFilter(() => {
        if (typeof(currentState.instance[intent]) === "function") {
          try {
            // Call given intent
            Promise.resolve(currentState.instance[intent](this, ...args)).then(() => {
              // Run afterIntent hooks
              this.getAfterIntentCallbacks().withArguments(currentState.instance, currentState.name, intent, this).runWithResultset(() => {});

              // Done
              resolve();
            }).catch(reason => this.handleOrReject(reason, currentState.instance, reject, resolve));
          } catch(e) {
            this.handleOrReject(e, currentState.instance, reject, resolve);
          }
        } else {
          // -> Intent does not exist on state class, so call unhandledIntent instead
          this.handleIntent("unhandledIntent", intent, ...args).catch(reason => this.handleOrReject(reason, currentState.instance, reject, resolve)).then(() => resolve());
        }
      }, () => resolve());
    });
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

  /** Checks if the current state is able to handle an error (=> if it has an 'errorFallback' method). Calls rejectMethod() instead.*/
  private handleOrReject(error: Error, state: State, rejectMethod: Function, resolveMethod) {
    if (typeof state["errorFallback"] === "function") {
      state["errorFallback"](error, rejectMethod);
      resolveMethod();
    } else {
      rejectMethod(error);
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