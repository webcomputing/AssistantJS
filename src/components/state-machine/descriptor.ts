import { ComponentDescriptor } from "inversify-components";

import { injectionNames } from "../../injection-names";

import { TranslateHelper } from "../i18n/translate-helper";
import { Logger } from "../root/public-interfaces";
import { Session } from "../services/public-interfaces";
import { intent, MinimalRequestExtraction } from "../unifier/public-interfaces";

import { Hooks } from "../joined-interfaces";
import { BasicHandler } from "../unifier/response-handler";
import { ExecuteFiltersHook } from "./execute-filters-hook";
import { componentInterfaces } from "./private-interfaces";
import { Filter, MAIN_STATE_NAME, State } from "./public-interfaces";
import { Runner } from "./runner";
import { StateMachine as StateMachineImpl } from "./state-machine";

export const descriptor: ComponentDescriptor = {
  name: "core:state-machine",
  interfaces: componentInterfaces,
  bindings: {
    root: (bindService, lookupService) => {
      // Sets State Machine as runner after reducing context
      bindService.bindExecutable(lookupService.lookup("core:root").getInterface("afterContextExtension"), Runner);

      // See StateFactory interface
      bindService.bindGlobalService<State.Factory>("state-factory").toFactory<State.Required>(context => {
        return (stateName?: string) => {
          if (typeof stateName === "undefined" || stateName === null || stateName === "") {
            // tslint:disable-next-line:no-parameter-reassignment
            stateName = MAIN_STATE_NAME;
          }

          // Throw message if no states are defined
          if (!context.container.isBound(componentInterfaces.state)) {
            throw new Error("There are no states defined. You have to define states in order to use the state machine.");
          }

          // Throw message if searched state is not defined
          if (!context.container.isBoundTagged(componentInterfaces.state, "name", stateName)) throw new Error("There is no state defined: '" + stateName + "'");

          return context.container.getTagged<State.Required>(componentInterfaces.state, "name", stateName);
        };
      });

      // Publish all meta states
      bindService.bindGlobalService<State.Meta[]>("meta-states").toDynamicValue(context => {
        // Fixing a mysterious bug: constant value componentInterfaces.metaState is bound to parent container only, but not to child?!
        let containerToUse = context.container;
        if (!containerToUse.isBound(componentInterfaces.metaState)) {
          if (containerToUse.parent !== null && containerToUse.parent.isBound(componentInterfaces.metaState)) {
            containerToUse = containerToUse.parent;
          } else {
            return [];
          }
        }

        return containerToUse.getAll<State.Meta>(componentInterfaces.metaState);
      });

      // Returns all intents
      bindService.bindGlobalService<intent[]>("used-intents").toDynamicValue(context => {
        const meta = context.container.get<State.Meta[]>("core:state-machine:meta-states");
        return meta
          .map(m => m.intents)
          .reduce((previous, current) => previous.concat(current), [])
          .filter((element, position, self) => self.indexOf(element) === position);
      });

      // Returns all state names
      bindService.bindGlobalService<string[]>("state-names").toDynamicValue(context => {
        return context.container.get<State.Meta[]>("core:state-machine:meta-states").map(m => m.name);
      });
    },

    request: (bindService, lookupService) => {
      // Returns set of dependencies fitting for BaseState
      bindService.bindGlobalService<State.SetupSet>("current-state-setup-set").toDynamicValue(context => {
        return {
          responseHandler: context.container.get<BasicHandler<any>>(injectionNames.current.responseHandler),
          translateHelper: context.container.get<TranslateHelper>(injectionNames.current.translateHelper),
          extraction: context.container.get<MinimalRequestExtraction>(injectionNames.current.extraction),
          logger: context.container.get<Logger>(injectionNames.current.logger),
        };
      });

      // Returns current state machine: State machine with current state set up
      bindService
        .bindGlobalService("current-state-machine")
        .to(StateMachineImpl)
        .inSingletonScope();

      // Provider for current state name: Gets the name of the current state from session. Returns MAIN STATE if nothing is saved in session.
      bindService.bindGlobalService<State.CurrentNameProvider>("current-state-name-provider").toProvider<string>(context => {
        return () => {
          return context.container
            .get<() => Session>(injectionNames.current.sessionFactory)()
            .get("__current_state")
            .then(sessionValue => {
              return sessionValue ? sessionValue : MAIN_STATE_NAME;
            });
        };
      });

      // Provider for current state. Returns current state or MAIN STATE if no state is present.
      bindService.bindGlobalService<State.CurrentProvider>("current-state-provider").toProvider<{ instance: State.Required; name: string }>(context => {
        return () => {
          const factory = context.container.get<State.Factory>("core:state-machine:state-factory");

          return context.container
            .get<() => Promise<string>>("core:state-machine:current-state-name-provider")()
            .then(async stateName => {
              return { instance: factory(stateName), name: stateName };
            });
        };
      });

      // Provider for context states. Returns array of states or empty array if no state is present.
      bindService.bindGlobalService("current-context-states-provider").toProvider<Array<{ instance: State.Required; name: string }>>(context => {
        return () => {
          const factory = context.container.get<Function>("core:state-machine:state-factory");
          return context.container
            .get<() => Session>(injectionNames.current.sessionFactory)()
            .get("__context_states")
            .then(contextStates => {
              if (contextStates) {
                const contextStatesArr: string[] = JSON.parse(contextStates);
                return Array.isArray(contextStatesArr) ? contextStatesArr.map(stateName => ({ instance: factory(stateName), name: stateName })) : [];
              }
              return [];
            });
        };
      });

      bindService.bindLocalServiceToSelf(ExecuteFiltersHook);

      // Returns before intent hook
      bindService
        .bindExtension<Hooks.BeforeIntentHook>(lookupService.lookup("core:state-machine").getInterface("beforeIntent"))
        .toDynamicValue(context => context.container.get(ExecuteFiltersHook).execute);
    },
  },
};
