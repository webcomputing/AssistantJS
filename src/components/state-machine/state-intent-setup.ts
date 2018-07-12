import * as fs from "fs";
import { ComponentDescriptor } from "inversify-components";

import { State } from "./public-interfaces";

import { AssistantJSSetup } from "../../setup";
import { GenericIntent } from "../unifier/public-interfaces";
import { ConventionalFileLoader } from "./conventional-file-loader";

export class StateMachineSetup extends ConventionalFileLoader<State.Required> {
  /** If set to true, states are registered in singleton scope. This may be pretty useful for testing. */
  public registerStatesInSingleton = false;

  /** Contains meta information about states */
  private metaStates: State.Meta[] = [];

  /**
   * [Sync!] Registers all states by file name / directory structure convention
   * @param addOnly If set to true, only adds all filter classes to internal hash, but doesn't register them with component descriptor
   * @param baseDirectory Base directory to start (process.cwd() + "/js/app")
   * @param dictionary Dictionary which contains the filters to add, defaults to "/states"
   */
  public registerByConvention(addOnly = false, baseDirectory = process.cwd() + "/js/app", dictionary = "/states") {
    return super.registerByConvention(addOnly, baseDirectory, dictionary);
  }

  /**
   * Adds a state to setup
   * @param stateClass Class to add
   * @param name Name of state - if not given, derives name by class name
   * @param intents Intents of state to add - if not given, derives intents my state methods
   * @return name of added state
   */
  public addState(stateClass: State.Constructor, name?: string, intents?: string[]) {
    return this.addClass(stateClass, name, intents);
  }

  /** Registers all states in dependency injection container */
  public registerStates() {
    return this.registerClasses();
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

          Object.keys(this.classes).forEach(stateName => {
            const binding = bindService.bindExtension<State.Required>(stateInterface).to(this.classes[stateName]);
            const scope = this.registerStatesInSingleton ? binding.inSingletonScope() : binding;
            scope.whenTargetTagged("name", stateName);
          });
        },
      },
    };
  }

  /** Overrides ConventionalFileLoader.addClass */
  protected addClass(stateClass: State.Constructor, nameParam?: string, intentsParam?: string[]) {
    const stateName = super.addClass(stateClass, nameParam);
    const intents = typeof intentsParam === "undefined" ? StateMachineSetup.deriveStateIntents(stateClass) : intentsParam;

    // Create and add meta state
    const metaState = StateMachineSetup.createMetaState(stateName, intents);
    this.metaStates.push(metaState);
    return stateName;
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
