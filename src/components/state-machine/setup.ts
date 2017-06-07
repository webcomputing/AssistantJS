import { ComponentDescriptor } from "ioc-container";

import { State, StateConstructor, MetaState } from "./interfaces";

import { GenericIntent } from "../unifier/interfaces";
import { AssistantJSSetup } from "../../setup";

export class StateMachineSetup {
  private assistantJS: AssistantJSSetup;
  private stateClasses: {[name: string]: StateConstructor} = {};
  private metaStates: MetaState[] = [];

  constructor(assistantJS: AssistantJSSetup) {
    this.assistantJS = assistantJS;
  }

  /** Adds a state to setup */
  addState(stateClass: StateConstructor, name?: string, intents?: string[]) {
    name = typeof name === "undefined" ? StateMachineSetup.deriveStateName(stateClass) : name;
    intents = typeof intents === "undefined" ? StateMachineSetup.deriveStateIntents(stateClass) : intents;

    // Create and add meta state
    let metaState = StateMachineSetup.createMetaState(name, intents);
    this.metaStates.push(metaState);

    // Add state class
    this.stateClasses[name] = stateClass;
  }

  /** Registers all states in dependency injection container */
  registerStates() {
    this.assistantJS.registerComponent(this.toComponentDescriptor());
  }

  /** Builds a component descriptor out of all added states (and meta states) */
  toComponentDescriptor(): ComponentDescriptor {
    return {
      name: "core:state-machine:states",
      bindings: {
        root: (bindService, lookupService) => {
          let metaStateInterface = lookupService.lookup("core:state-machine").getInterface("metaState");

          this.metaStates.forEach(metaState => bindService.bindExtension<MetaState>(metaStateInterface).toConstantValue(metaState));
        },

        request: (bindService, lookupService) => {
          let stateInterface = lookupService.lookup("core:state-machine").getInterface("state");

          Object.keys(this.stateClasses).forEach(stateName => {
            bindService.bindExtension<State>(stateInterface).to(this.stateClasses[stateName]).whenTargetTagged("name", stateName);
          })
        }
      }
    }
  }

  /** Creates a valid metastate object based on name and intents */
  static createMetaState(name: string, intents: string[]): MetaState {
    return {
      name: name,
      intents: intents
    }
  }

  /** Returns a states name based on its constructor */
  static deriveStateName(stateClass: StateConstructor): string {
    return stateClass.name;
  }

  /** Derives names of intents based on a state class */
  static deriveStateIntents(stateClass: StateConstructor): string[] {
    let prototype = stateClass.prototype;

    return Object.getOwnPropertyNames(prototype)
      .filter(method => method.endsWith("Intent") && method !== "unhandledIntent")
      .map(method => {

        if (method.endsWith("GenericIntent")) {
          let baseString = method.replace("GenericIntent", "");
          return GenericIntent[baseString.charAt(0).toUpperCase() + baseString.slice(1)];
        } else {
          let baseString = method.replace("Intent", "");
          return baseString.charAt(0).toLowerCase() + baseString.slice(1);
        }

      });
  }
}