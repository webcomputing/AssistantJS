import { State } from "../state-machine/public-interfaces";

export const clearContextMetadataKey = Symbol("metadata-key: clearContext");

export function clearContext(needsClear: (...args: any[]) => boolean) {
  const metadata = { clearContext: needsClear };

  return function(targetClass: any) {
    Reflect.defineMetadata(clearContextMetadataKey, metadata, targetClass);
  };
}
