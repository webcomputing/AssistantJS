import * as fs from "fs";
import { ComponentDescriptor } from "inversify-components";

import { State } from "./public-interfaces";

import { AssistantJSSetup } from "../../setup";
import { GenericIntent } from "../unifier/public-interfaces";

export class StateMachineSetup {
  private assistantJS: AssistantJSSetup;
  private stateClasses: { [name: string]: State.Constructor } = {};
  private metaStates: State.Meta[] = [];

  /** If set to true, states are registered in singleton scope. This may be pretty useful for testing. */
  public registerStatesInSingleton = false;

  constructor(assistantJS: AssistantJSSetup) {
    this.assistantJS = assistantJS;
  }

  /**
   * [Sync!] Adds all classes in a specific directory as states.
   * @param addOnly If set to true, this method only calls "addState", but not "registerStates" finally
   * @param baseDirectory Base directory to start (process.cwd() + "/js/app")
   * @param dictionary Dictionary which contains state classes, defaults to "states"
   */
  public registerByConvention(addOnly = false, baseDirectory = process.cwd() + "/js/app", dictionary = "/states") {
    fs.readdirSync(baseDirectory + dictionary).forEach(file => {
      const suffixParts = file.split(".");
      const suffix = suffixParts[suffixParts.length - 1];

      // Load if file is a JavaScript file
      if (suffix !== "js") return;
      const classModule = require(baseDirectory + dictionary + "/" + file);

      Object.keys(classModule).forEach(exportName => {
        this.addState(classModule[exportName]);
      });
    });

    if (!addOnly) this.registerStates();
  }

  /** Adds a state to setup */
  public addState(stateClass: State.Constructor, name?: string, intents?: string[]) {
    name = typeof name === "undefined" ? StateMachineSetup.deriveStateName(stateClass) : name;
    intents = typeof intents === "undefined" ? StateMachineSetup.deriveStateIntents(stateClass) : intents;

    // Create and add meta state
    const metaState = StateMachineSetup.createMetaState(name, intents);
    this.metaStates.push(metaState);

    // Add state class
    this.stateClasses[name] = stateClass;
  }

  /** Registers all states in dependency injection container */
  public registerStates() {
    this.assistantJS.registerComponent(this.toComponentDescriptor());
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

  /** Returns a states name based on its constructor */
  public static deriveStateName(stateClass: State.Constructor): string {
    return stateClass.name;
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
            const baseString = method.replace("GenericIntent", "");
            return GenericIntent[baseString.charAt(0).toUpperCase() + baseString.slice(1)];
          } else {
            const baseString = method.replace("Intent", "");
            return baseString.charAt(0).toLowerCase() + baseString.slice(1);
          }
        })
    );
  }
}
