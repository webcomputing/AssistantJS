import { inject, injectable, multiInject, optional } from "inversify";
import { Constructor } from "../../assistant-source";
import { injectionNames } from "../../injection-names";
import { Hooks } from "../joined-interfaces";
import { ComponentSpecificLoggerFactory, Logger } from "../root/public-interfaces";
import { filterMetadataKey } from "./filter-decorator";
import { COMPONENT_NAME, componentInterfaces } from "./private-interfaces";
import { Filter, State } from "./public-interfaces";

@injectable()
export class ExecuteFiltersHook {
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
  public execute: Hooks.BeforeIntentHook = async (mode, state, stateName, intent, machine, ...args) => {
    this.logger.debug({ intent, state: stateName }, "Executing filter hook");

    const prioritizedFilters = [...this.retrieveStateFiltersFromMetadata(state), ...this.retrieveIntentFiltersFromMetadata(state, intent)];

    for (const prioritizedFilter of prioritizedFilters) {
      const hasParams = typeof prioritizedFilter === "object" && prioritizedFilter !== null;
      const prioritizedFilterConstructor = hasParams
        ? (prioritizedFilter as { filter: Constructor<Filter>; params: { [key: string]: any } }).filter
        : prioritizedFilter;

      const fittingFilter = this.filters.find(filter => filter.constructor === prioritizedFilterConstructor);
      if (fittingFilter) {
        const filterResult = await Promise.resolve(
          fittingFilter.execute(
            state,
            stateName,
            intent,
            hasParams ? (prioritizedFilter as { filter: Constructor<Filter>; params: { [key: string]: any } }).params : {},
            ...args
          )
        );

        if (typeof filterResult === "object") {
          const filterArgs = filterResult.args ? filterResult.args : args;
          await machine.redirectTo(filterResult.state, filterResult.intent, ...filterArgs);
          return false;
        }

        if (filterResult === false) {
          return false;
        }
      } else {
        this.logger.warn(
          `No matching filter class found for ${
            hasParams
              ? (prioritizedFilter as { filter: Constructor<Filter>; params: { [key: string]: any } }).filter.name
              : (prioritizedFilter as Constructor<Filter>).name
          }`
        );
      }
    }
    return true;
  };

  private retrieveStateFiltersFromMetadata(
    state: State.Required
  ): Array<Constructor<Filter> | { filter: Constructor<Filter>; params: { [key: string]: any } }> {
    const metadata = Reflect.getMetadata(filterMetadataKey, state.constructor);
    return metadata ? metadata.filters : [];
  }

  private retrieveIntentFiltersFromMetadata(
    state: State.Required,
    intent: string
  ): Array<Constructor<Filter> | { filter: Constructor<Filter>; params: { [key: string]: any } }> {
    if (typeof state[intent] !== "undefined") {
      const metadata = Reflect.getMetadata(filterMetadataKey, state[intent]);
      return metadata ? metadata.filters : [];
    }

    return [];
  }
}
