import { State } from "../state-machine/public-interfaces";

export const stayInContextMetadataKey = Symbol("metadata-key: stayInContext");

export function stayInContext(duration: (...args: any[]) => boolean) {
  const metadata = { stayInContext: duration };

  return function(targetClass: any) {
    Reflect.defineMetadata(stayInContextMetadataKey, metadata, targetClass);
  };
}
