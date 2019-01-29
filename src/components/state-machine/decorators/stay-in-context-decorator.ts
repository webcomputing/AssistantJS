import { State } from "../public-interfaces";

export const stayInContextMetadataKey = Symbol("metadata-key: stayInContext");

export function stayInContext(
  addToContext?: (
    currentStateName?: string,
    currentStateInstance?: State.Required,
    contextStateNames?: string[],
    intentHistory?: Array<{ stateName: string; intentMethodName: string }>,
    stateNameToTransitionTo?: string
  ) => boolean
) {
  const metadata = addToContext ? { stayInContext: addToContext } : { stayInContext: () => true };

  return function(targetClass: any) {
    Reflect.defineMetadata(stayInContextMetadataKey, metadata, targetClass);
  };
}
