import { inject, injectable } from "inversify";
import { Filter, FilterClass, Hooks } from "../../assistant-source";
import { injectionNames } from "../../injection-names";
import { ComponentSpecificLoggerFactory, Logger } from "../root/public-interfaces";
import { filterMetadataKey } from "./filter";
import { COMPONENT_NAME } from "./private-interfaces";
import { State } from "./public-interfaces";

@injectable()
export class BeforeIntentHook {
  private state!: State.Required;
  private stateName!: string;
  private intent!: string;
  private logger: Logger;

  constructor(@inject(injectionNames.componentSpecificLoggerFactory) loggerFactory: ComponentSpecificLoggerFactory) {
    this.logger = loggerFactory(COMPONENT_NAME);
  }

  /** Hook method, the only method which will be called */
  public execute: Hooks.BeforeIntentHook = async (mode, state, stateName, intent, machine) => {
    this.logger.debug({ intent, state: stateName }, "Executing filter hook");
    this.state = state;
    this.stateName = stateName;
    this.intent = intent;

    const stateFilter = this.retrieveStateFilterFromMetadata();
    const intentFilter = this.retrieveIntentFilterFromMetadata();

    let redirect: { state: string; intent: string; args?: any[] } | undefined;

    if (typeof stateFilter === "undefined") {
      if (typeof intentFilter === "undefined") {
        return true;
      }

      redirect = new intentFilter().execute();

      if (redirect) {
        await machine.transitionTo(redirect.state);
        await machine.handleIntent(redirect.intent, redirect.args);
        return false;
      }
      return false;
    }

    redirect = new stateFilter().execute();

    if (redirect) {
      await machine.transitionTo(redirect.state);
      await machine.handleIntent(redirect.intent, redirect.args);
      return false;
    }
    return true;
  };

  private retrieveStateFilterFromMetadata(): FilterClass | undefined {
    return Reflect.getMetadata(filterMetadataKey, this.state.constructor).filter;
  }

  private retrieveIntentFilterFromMetadata(): FilterClass | undefined {
    return Reflect.getMetadata(filterMetadataKey, this.state[this.intent]).filter;
  }
}
