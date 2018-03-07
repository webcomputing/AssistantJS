import { MinimalResponseHandler, MinimalRequestExtraction } from "./public-interfaces";

/** 
 * Checks whether a given feature exists in an extraction result.
 * @param {MinimalRequestExtraction} container The extraction result which might contain the given feature
 * @param {string[]} feature The feature to check. Just pass a value of the FeatureChecker object from OptionalExtractions
 */
export function featureIsAvailable<FeatureInterface extends MinimalRequestExtraction>(container: MinimalRequestExtraction, feature: string[]): container is FeatureInterface;

/** 
 * Checks whether a given feature is supported by a response handler.
 * @param {MinimalResponseHandler} container The response handler which might support the feature
 * @param {string[]} feature The feature to check. Just pass a value of the FeatureChecker object from OptionalFeatures
 */
export function featureIsAvailable<FeatureInterface extends MinimalResponseHandler>(container: MinimalResponseHandler, feature: string[]): container is FeatureInterface;

export function featureIsAvailable<FeatureInterface>(container: MinimalRequestExtraction | MinimalResponseHandler, feature: string[]) {
  let objectKeys = Object.keys(container);
  return feature.filter(f => objectKeys.indexOf(f) === -1).length === 0;
}