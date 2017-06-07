import { injectable, inject } from "inversify";
import { Hooks } from "ioc-container";
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
    await this.getCurrentState();

    intent = this.deriveIntentMethod(intent);
    log("Handling intent '" + intent + "' on state " + currentState.name);

    // Run beforeIntent-hooks as filter
    this.getBeforeIntentCallbacks().withArguments(currentState.instance, currentState.name, intent, this).runAsFilter(() => {
      if (typeof(currentState.instance[intent]) !== "undefined") {
        currentState.instance[intent](this, ...args);
      } else {
        this.handleIntent("unhandledIntent", intent, this, ...args);
      }
    });

    // Run afterIntent-hooks
    this.getAfterIntentCallbacks().withArguments(currentState.instance, currentState.name, intent, this).runWithResultset(() => {});
  }

  async transitionTo(state: string) {
    if (this.stateNames.indexOf(state) === -1)
      throw Error("Cannot transition to " + state + ": State does not exist!");

    return this.currentSessionFactory().set("__current_state", state);
  }

  async redirectTo(state: string, intent: intent, ...args: any[]) {
    await this.transitionTo(state);
    await this.handleIntent(intent, ...args);
  }

  /* Private helper methods */

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