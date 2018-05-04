import { State } from "../state-machine/public-interfaces";

export const stayInContextMetadataKey = Symbol("metadata-key: stayInContext");

export function stayInContext(addToContext: (...args: any[]) => boolean) {
  const metadata = { stayInContext: addToContext };

  return function(targetClass: any) {
    Reflect.defineMetadata(stayInContextMetadataKey, metadata, targetClass);
  };
}
