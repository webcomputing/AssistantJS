import { State } from "../state-machine/public-interfaces";

export const stayInContextMetadataKey = Symbol("metadata-key: stayInContext");

// tslint:disable-next-line:ban-types
export function stayInContext(duration: Date | number | State.Constructor | Function) {
  const metadata = { stayInContext: duration };

  return function(targetClass: any) {
    Reflect.defineMetadata(stayInContextMetadataKey, metadata, targetClass);
  };
}
