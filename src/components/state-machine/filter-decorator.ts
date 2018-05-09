import { Filter } from "./public-interfaces";

export const filterMetadataKey = Symbol("metadata-key: filter");

export function filter(filterClasses: Filter.Constructor[]) {
  const metadata = { filter: filterClasses };

  return function(targetClass: any, methodName?: string) {
    if (typeof methodName === "undefined") {
      Reflect.defineMetadata(filterMetadataKey, metadata, targetClass);
    } else {
      Reflect.defineMetadata(filterMetadataKey, metadata, targetClass[methodName]);
    }
  };
}
