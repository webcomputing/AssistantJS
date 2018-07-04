import * as fs from "fs";
import { ComponentDescriptor } from "inversify-components";

import { State } from "./public-interfaces";

import { AssistantJSSetup } from "../../setup";
import { GenericIntent } from "../unifier/public-interfaces";
import { ConventionalFileLoader } from "./conventional-file-loader";

export class StateMachineSetup extends ConventionalFileLoader {
  /** If set to true, states are registered in singleton scope. This may be pretty useful for testing. */
  public registerStatesInSingleton = false;

  private stateClasses: { [name: string]: State.Constructor } = {};
  private metaStates: State.Meta[] = [];

  constructor(assistantJS: AssistantJSSetup) {
    super(assistantJS);
  }

  /** Adds a state to setup */
  public addClass(stateClass: State.Constructor, nameParam?: string, intentsParam?: string[]) {
    const name = typeof nameParam === "undefined" ? StateMachineSetup.deriveClassName(stateClass) : nameParam;
    const intents = typeof intentsParam === "undefined" ? StateMachineSetup.deriveStateIntents(stateClass) : intentsParam;

    // Create and add meta state
    const metaState = StateMachineSetup.createMetaState(name, intents);
    this.metaStates.push(metaState);

    // Add state class
    this.stateClasses[name] = stateClass;
  }

  /** Builds a component descriptor out of all added states (and meta states) */
  public toComponentDescriptor(): ComponentDescriptor {
    return {
      name: "core:state-machine:states",
      bindings: {
        root: (bindService, lookupService) => {
          const metaStateInterface = lookupService.lookup("core:state-machine").getInterface("metaState");

          this.metaStates.forEach(metaState => bindService.bindExtension<State.Meta>(metaStateInterface).toConstantValue(metaState));
        },

        request: (bindService, lookupService) => {
          const stateInterface = lookupService.lookup("core:state-machine").getInterface("state");

          Object.keys(this.stateClasses).forEach(stateName => {
            const binding = bindService.bindExtension<State.Required>(stateInterface).to(this.stateClasses[stateName]);
            const scope = this.registerStatesInSingleton ? binding.inSingletonScope() : binding;
            scope.whenTargetTagged("name", stateName);
          });
        },
      },
    };
  }

  /** Creates a valid metastate object based on name and intents */
  public static createMetaState(name: string, intents: string[]): State.Meta {
    return {
      name,
      intents,
    };
  }

  /** Derives names of intents based on a state class */
  public static deriveStateIntents(stateClass: State.Constructor): string[] {
    const prototype = stateClass.prototype;

    // Return empty set if prototype is undefined - this also breaks recursive calls
    if (typeof prototype === "undefined") return [];

    // Get super intents to allow inheritance of state classes
    const superIntents = StateMachineSetup.deriveStateIntents(Object.getPrototypeOf(stateClass));

    return superIntents.concat(
      Object.getOwnPropertyNames(prototype)
        .filter(method => method.endsWith("Intent") && method !== "unhandledGenericIntent" && method !== "unansweredGenericIntent")
        .map(method => {
          if (method.endsWith("GenericIntent")) {
            const baseStringGeneric = method.replace("GenericIntent", "");
            return GenericIntent[baseStringGeneric.charAt(0).toUpperCase() + baseStringGeneric.slice(1)];
          }
          const baseString = method.replace("Intent", "");
          return baseString.charAt(0).toLowerCase() + baseString.slice(1);
        })
    );
  }
}
