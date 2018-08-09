import { MinimalRequestExtraction } from "./public-interfaces";
import { BasicHandable } from "./response-handler";

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
 * @param {BasicHandable} container The response handler which might support the feature
 * @param {string[]} feature The feature to check. Just pass a value of the FeatureChecker object from OptionalFeatures
 */
export function featureIsAvailable<FeatureInterface>(container: BasicHandable<any>, feature: string[]): container is FeatureInterface & BasicHandable<any>;

export function featureIsAvailable<FeatureInterface>(container: MinimalRequestExtraction | BasicHandable<any>, feature: string[]) {
  const objectKeys = Object.keys(container);
  return feature.filter(f => objectKeys.indexOf(f) === -1).length === 0;
}
