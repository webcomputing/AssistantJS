import { State } from "../public-interfaces";

export const clearContextMetadataKey = Symbol("metadata-key: clearContext");

export function clearContext(
  needsClear?: (
    currentStateName?: string,
    currentStateInstance?: State.Required,
    contextStateNames?: string[],
    intentHistory?: Array<{ stateName: string; intentMethodName: string }>
  ) => boolean
) {
  const metadata = needsClear ? { clearContext: needsClear } : { clearContext: () => true };

  return function(targetClass: any) {
    Reflect.defineMetadata(clearContextMetadataKey, metadata, targetClass);
  };
}
