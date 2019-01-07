import { Constructor } from "../../assistant-source";
import { Filter } from "./public-interfaces";

export const filterMetadataKey = Symbol("metadata-key: filter");

export function filter(...args: Array<Constructor<Filter> | { filter: Constructor<Filter>; params: { [key: string]: any } }>) {
  const metadata = { filters: args };

  return function(targetClass: any, methodName?: string) {
    if (typeof methodName === "undefined") {
      Reflect.defineMetadata(filterMetadataKey, metadata, targetClass);
    } else {
      Reflect.defineMetadata(filterMetadataKey, metadata, targetClass[methodName]);
    }
  };
}
