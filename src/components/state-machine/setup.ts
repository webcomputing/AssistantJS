import { ComponentDescriptor } from "inversify-components";
import * as fs from "fs";

import { State, StateConstructor, MetaState, componentInterfaces } from "./interfaces";

import { GenericIntent } from "../unifier/interfaces";
import { AssistantJSSetup } from "../../setup";

export class StateMachineSetup {
  private assistantJS: AssistantJSSetup;
  private stateClasses: {[name: string]: StateConstructor} = {};
  private metaStates: MetaState[] = [];
  
  /** If set to true, states are registered in singleton scope. This may be pretty useful for testing. */
  registerStatesInSingleton = false;

  constructor(assistantJS: AssistantJSSetup) {
    this.assistantJS = assistantJS;
  }

  /** 
   * [Sync!] Adds all classes in a specific directory as states.
   * @param addOnly If set to true, this method only calls "addState", but not "registerStates" finally
   * @param baseDirectory Base directory to start (process.cwd() + "/js/app")
   * @param dictionary Dictionary which contains state classes, defaults to "states"
   */
  registerByConvention(addOnly = false, baseDirectory = process.cwd() + "/js/app", dictionary = "/states") {
    fs.readdirSync(baseDirectory + dictionary).forEach(file => {
      let suffixParts = file.split(".");
      let suffix = suffixParts[suffixParts.length-1];

      // Load if file is a JavaScript file
      if (suffix !== "js") return;
      let classModule = require(baseDirectory + dictionary + "/" + file);

      Object.keys(classModule).forEach(exportName => {
        this.addState(classModule[exportName]);
      });
    })

    if (!addOnly) this.registerStates();
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
            let binding = bindService.bindExtension<State.Required>(stateInterface).to(this.stateClasses[stateName]);
            let scope = this.registerStatesInSingleton ? binding.inSingletonScope() : binding;
            scope.whenTargetTagged("name", stateName);
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

    // Return empty set if prototype is undefined - this also breaks recursive calls
    if (typeof prototype === "undefined") return [];
    
    // Get super intents to allow inheritance of state classes
    const superIntents = StateMachineSetup.deriveStateIntents(Object.getPrototypeOf(stateClass));

    return superIntents.concat(Object.getOwnPropertyNames(prototype)
      .filter(method => method.endsWith("Intent") && method !== "unhandledGenericIntent" && method !== "unansweredGenericIntent")
      .map(method => {

        if (method.endsWith("GenericIntent")) {
          let baseString = method.replace("GenericIntent", "");
          return GenericIntent[baseString.charAt(0).toUpperCase() + baseString.slice(1)];
        } else {
          let baseString = method.replace("Intent", "");
          return baseString.charAt(0).toLowerCase() + baseString.slice(1);
        }

    }));
  }
}