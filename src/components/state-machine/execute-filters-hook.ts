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

  public execute: Hooks.BeforeIntentHook = async (mode, state, stateName, intent, machine, ...args) => {
    this.logger.debug({ intent, state: stateName }, "Executing filter hook");

    /** Prioritize filters by retrieving state filters first, followed by intent filters */
    const prioritizedFilters = [...this.retrieveStateFiltersFromMetadata(state), ...this.retrieveIntentFiltersFromMetadata(state, intent)];

    /** Check for each retrieved filter if there is a registered filter matching it */
    for (const prioritizedFilter of prioritizedFilters) {
      const hasParams = typeof prioritizedFilter === "object" && prioritizedFilter !== null;
      const prioritizedFilterConstructor = hasParams
        ? (prioritizedFilter as { filter: Constructor<Filter>; params: { [key: string]: any } }).filter
        : prioritizedFilter;

      /** Find the first matching registered filter */

      const fittingFilter = this.filters.find(filter => filter.constructor === prioritizedFilterConstructor);

      /** If there is a matching filter registered, execute it */
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

        /** If filter returns redirecting object => redirect */
        if (typeof filterResult === "object") {
          const filterArgs = filterResult.args ? filterResult.args : args;
          await machine.redirectTo(filterResult.state, filterResult.intent, ...filterArgs);
          return false;
        }

        /** If filter returns false => use hook failure to stop planned intent execution (which means that filter handles a response itself) */
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

    /** In every other case just return true (=> no filtering needed, planned intent will be executed) */
    return true;
  };

  /**
   * Returns 'filters'-property of metadata-object of state or [] if not set
   * @param state State to which metadata will be checked
   */
  private retrieveStateFiltersFromMetadata(
    state: State.Required
  ): Array<Constructor<Filter> | { filter: Constructor<Filter>; params: { [key: string]: any } }> {
    const metadata = Reflect.getMetadata(filterMetadataKey, state.constructor);
    return metadata ? metadata.filters : [];
  }

  /**
   * Returns 'filters'-property of metadata-object of intent or [] if not set
   * @param state State to which metadata will be checked
   * @param intent Intent to which metadata will be checked
   */
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
