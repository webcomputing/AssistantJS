import { ComponentDescriptor, BindingDescriptor } from "ioc-container";

import { Session } from "../services/interfaces";
import { intent } from "../unifier/interfaces";

import { Runner } from "./runner";
import { StateMachine as StateMachineImpl } from "./state-machine";
import { componentInterfaces, StateMachine, State, StateFactory, MetaState, MAIN_STATE_NAME } from "./interfaces";


export const descriptor: ComponentDescriptor = {
  name: "core:state-machine",
  interfaces: componentInterfaces,
  bindings: {
    root: (bindService, lookupService) => {
      // Sets State Machine as runner after reducing context
      bindService.bindExecutable(lookupService.lookup("core:root").getInterface("afterContextExtension"), Runner);

      // See StateFactory interface
      bindService.bindGlobalService<StateFactory>("state-factory").toFactory<State>(context => {
        return (stateName?: string) => {
          if (typeof(stateName) === "undefined" || stateName === null || stateName === "") {
            stateName = MAIN_STATE_NAME;
          }

          // Throw message if no states are defined
          if (!context.container.isBound(componentInterfaces.state))
            throw new Error("There are no states defined. You have to define states in order to use the state machine.");

          // Throw message if searched state is not defined
          if (!context.container.isBoundTagged(componentInterfaces.state, "name", stateName))
            throw new Error("There is no state defined: '"+ name +"'");

          return context.container.getTagged<State>(componentInterfaces.state, "name", stateName);
        };
      });

      // Publish all meta states
      bindService.bindGlobalService<MetaState[]>("meta-states").toDynamicValue(context => {
        // Fixing a mysterious bug: constant value componentInterfaces.metaState is bound to parent container only, but not to child?!
        let containerToUse = context.container;
        if (!containerToUse.isBound(componentInterfaces.metaState)) {
          if (containerToUse.parent !== null && containerToUse.parent.isBound(componentInterfaces.metaState)) {
            containerToUse = containerToUse.parent;
          } else {
            return [];
          }
        }

        return containerToUse.getAll<MetaState>(componentInterfaces.metaState);
      });

      // Returns all intents
      bindService.bindGlobalService<intent[]>("used-intents").toDynamicValue(context => {
        
        let meta = context.container.get<MetaState[]>("core:state-machine:meta-states");
        return meta
          .map(m => m.intents)
          .reduce((previous, current) => previous.concat(current), [])
          .filter((element, position, self) => self.indexOf(element) === position);
      });

      // Returns all state names
      bindService.bindGlobalService<string[]>("state-names").toDynamicValue(context => {
        return context.container.get<MetaState[]>("core:state-machine:meta-states").map(m => m.name);
      });
    },

    request: (bindService) => {
      // Returns current state machine: State machine with current state set up
      bindService.bindGlobalService<StateMachine>("current-state-machine").to(StateMachineImpl).inSingletonScope();

      // Provider for current state name: Gets the name of the current state from session. Returns NULL if current state is not present.
      bindService.bindGlobalService<Promise<string>>("current-state-name-provider").toProvider<string>(context => {
        return () => {
          return context.container.get<() => Session>("core:unifier:current-session-factory")().get("__current_state");
        };
      });

      // Provider for current state. Returns current state or MAIN STATE if no state is present.
      bindService.bindGlobalService("current-state-provider").toProvider<{instance: State, name: string}>(context => {
        return () => {
          let factory = context.container.get<Function>("core:state-machine:state-factory");
          return context.container.get<() => Promise<string>>("core:state-machine:current-state-name-provider")().then((name) => {
            if (name === null) name = MAIN_STATE_NAME;
            return {instance: factory(name), name: name};
          });
        };
      });
    }
  }
};