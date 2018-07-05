import { inject, injectable, multiInject, optional } from "inversify";
import { injectionNames } from "../../injection-names";
import { ComponentSpecificLoggerFactory, Logger } from "../root/public-interfaces";
import { Constructor } from "./../../assistant-source";
import { Hooks } from "./../joined-interfaces";
import { filterMetadataKey } from "./filter-decorator";
import { COMPONENT_NAME, componentInterfaces } from "./private-interfaces";
import { Filter, State } from "./public-interfaces";

@injectable()
export class ExecuteFiltersHook {
  private state!: State.Required;
  private stateName!: string;
  private intent!: string;
  private logger: Logger;
  private filters: Filter[];

  constructor(
    @inject(injectionNames.componentSpecificLoggerFactory) loggerFactory: ComponentSpecificLoggerFactory,
    @optional()
    @multiInject(componentInterfaces.filter)
    filters: Filter[]
  ) {
    this.logger = loggerFactory(COMPONENT_NAME);
    this.filters = typeof filters !== "undefined" ? filters : [];
  }

  /** Hook method, the only method which will be called */
  public execute: Hooks.BeforeIntentHook = async (mode, state, stateName, intent, machine) => {
    this.logger.debug({ intent, state: stateName }, "Executing filter hook");
    this.state = state;
    this.stateName = stateName;
    this.intent = intent;

    const prioritizedFilters = [...this.retrieveStateFiltersFromMetadata(), ...this.retrieveIntentFiltersFromMetadata()];

    for (const prioritizedFilter of prioritizedFilters) {
      const fittingFilter = this.filters.find(filter => filter.constructor === prioritizedFilter);
      if (fittingFilter) {
        const filterResult = await Promise.resolve(fittingFilter.execute());

        if (typeof filterResult === "object") {
          const args = filterResult.args ? filterResult.args : [];
          await machine.redirectTo(filterResult.state, filterResult.intent, ...args);
          return false;
        }

        if (filterResult === false) {
          return false;
        }
      } else {
        this.logger.warn(`No matching filter class found for ${prioritizedFilter.name}`);
      }
    }
    return true;
  };

  private retrieveStateFiltersFromMetadata(): Array<Constructor<Filter>> {
    const metadata = Reflect.getMetadata(filterMetadataKey, this.state.constructor);
    return metadata ? metadata.filters : [];
  }

  private retrieveIntentFiltersFromMetadata(): Array<Constructor<Filter>> {
    if (typeof this.intent !== "undefined" && typeof this.state[this.intent] !== "undefined") {
      const metadata = Reflect.getMetadata(filterMetadataKey, this.state[this.intent]);
      return metadata ? metadata.filters : [];
    }
    return [];
  }
}
