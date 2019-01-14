import { Constructor } from "../../assistant-source";
import { Filter } from "./public-interfaces";

export const filterMetadataKey = Symbol("metadata-key: filter");

/* Describes what's inside the Reflect.getMetadata(filterMetadataKey) */
export type FilterDecoratorContent = Array<{
  filter: Constructor<Filter>;
  params: object | undefined;
}>;

export function filter<FilterArguments extends object>(filterClass: Constructor<Filter>, filterArguments?: FilterArguments) {
  return function(targetClass: any, methodName?: string) {
    // Get current metadata content
    const target = typeof methodName === "undefined" ? targetClass : targetClass[methodName];
    const currentContent: FilterDecoratorContent = Reflect.getMetadata(filterMetadataKey, target) || [];

    // Add new filter to it
    currentContent.unshift({ filter: filterClass, params: filterArguments });
    Reflect.defineMetadata(filterMetadataKey, currentContent, target);
  };
}
