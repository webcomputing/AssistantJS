import { MinimalRequestExtraction, MinimalResponseHandler } from "./public-interfaces";

/**
 * Checks whether a given feature exists in an extraction result.
 * @param {MinimalRequestExtraction} container The extraction result which might contain the given feature
 * @param {string[]} feature The feature to check. Just pass a value of the FeatureChecker object from OptionalExtractions
 */
export function featureIsAvailable<FeatureInterface>(
  container: MinimalRequestExtraction,
  feature: string[]
): container is FeatureInterface & MinimalRequestExtraction;

/**
 * Checks whether a given feature is supported by a response handler.
 * @param {MinimalResponseHandler} container The response handler which might support the feature
 * @param {string[]} feature The feature to check. Just pass a value of the FeatureChecker object from OptionalFeatures
 */
export function featureIsAvailable<FeatureInterface>(
  container: MinimalResponseHandler,
  feature: string[]
): container is FeatureInterface & MinimalResponseHandler;

export function featureIsAvailable<FeatureInterface>(container: MinimalRequestExtraction | MinimalResponseHandler, feature: string[]) {
  const objectKeys = Object.keys(container);
  return feature.filter(f => objectKeys.indexOf(f) === -1).length === 0;
}
