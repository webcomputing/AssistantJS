import { ClearContextCallback } from "../public-interfaces";

export const clearContextMetadataKey = Symbol("metadata-key: clearContext");

export function clearContext(needsClear?: ClearContextCallback) {
  const metadata = needsClear ? { clearContext: needsClear } : { clearContext: () => true };

  return function(targetClass: any) {
    Reflect.defineMetadata(clearContextMetadataKey, metadata, targetClass);
  };
}
