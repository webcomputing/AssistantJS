import { Constructor } from "../../assistant-source";
import { Filter, State } from "./public-interfaces";

export const filterMetadataKey = Symbol("metadata-key: filter");

/* Describes what's inside the Reflect.getMetadata(filterMetadataKey) */
export type FilterDecoratorContent = Array<{
  filter: Constructor<Filter<object | undefined>>;
  params: object | undefined;
}>;

/** Describes how to use the @filter() decorator: You need to pass params if your filter expects some */
interface FilterDecorator {
  /**
   * If you decorate on of your states or intents with @filter, the given filter class will be executed every time before the intent is called or any intent of the state is called.
   * Since your given filterClass does not accept any additional parameters, you don't need to pass a second argument.
   * You are free to use as many @filter() decorators with your intents / states as you need to.
   * @param filterClass The filter to execute before this intent / any intent of this state is called
   */
  (filterClass: Constructor<Filter<undefined>>): (targetClass: any, methodName?: string) => void;

  /**
   * If you decorate on of your states or intents with @filter, the given filter class will be executed every time before the intent is called or any intent of the state is called.
   * Since your given filterClass needs some additional arguments, you have to pass them here, too.
   * You are free to use as many @filter() decorators with your intents / states as you need to.
   * @param filterClass The filter to execute before this intent / any intent of this state is called
   * @param filterArguments The arguments which are expected by your filterClass
   */
  <FilterArguments extends object>(filterClass: Constructor<Filter<FilterArguments>>, filterArguments: FilterArguments): (
    targetClass: any,
    methodName?: string
  ) => void;
}

/**
 * If you decorate on of your states or intents with @filter, the given filter class will be executed every time before the intent is called or any intent of the state is called.
 * If you expect any filterArguments, you have to pass them here.
 */
export const filter: FilterDecorator = function<FilterArguments extends object>(
  filterClass: Constructor<Filter<FilterArguments>>,
  filterArguments?: FilterArguments
) {
  return function(targetClass: State.Required, methodName?: string) {
    // Get current metadata content
    const target = typeof methodName === "undefined" ? targetClass : targetClass[methodName];
    const currentContent: FilterDecoratorContent = Reflect.getMetadata(filterMetadataKey, target) || [];

    // Add new filter to it
    currentContent.unshift({ filter: filterClass, params: filterArguments });
    Reflect.defineMetadata(filterMetadataKey, currentContent, target);
  };
};
