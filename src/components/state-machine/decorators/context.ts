import { ClearContextCallback, StayInContextCallback } from "../public-interfaces";

export const stayInContextMetadataKey = Symbol("metadata-key: stayInContext");
export const clearContextMetadataKey = Symbol("metadata-key: clearContext");

/**
 * Adds given Function to Metadata of target class
 * @param addToContext Function to add
 */
export function stayInContext(addToContext?: StayInContextCallback) {
  return defineMetatdataCallback(stayInContextMetadataKey, addToContext);
}

/**
 * Adds given Function to Metadata of target class
 * @param needsClear Function to add
 */
export function clearContext(needsClear?: ClearContextCallback) {
  return defineMetatdataCallback(clearContextMetadataKey, needsClear);
}

/**
 * Defines given function as Metadata to target class using given key
 * @param metaDataKey Key
 * @param callback Function to define as Metadata
 */
function defineMetatdataCallback(metaDataKey: symbol, callback?: () => boolean) {
  const metadata = callback ? { callback } : { callback: () => true };

  return function(targetClass: any) {
    Reflect.defineMetadata(metaDataKey, metadata, targetClass);
  };
}
