import { MinimalRequestExtraction } from "./public-interfaces";
import { BasicHandler } from "./response-handler";

/**
 * Checks whether a given feature exists in an extraction result.
 * @param {MinimalRequestExtraction} container The extraction result which might contain the given feature
 * @param {string[]} feature The feature to check. Just pass a value of the FeatureChecker object from OptionalExtractions
 */
export function featureIsAvailable<FeatureInterface>(
  container: MinimalRequestExtraction,
  feature: string[]
): container is FeatureInterface & MinimalRequestExtraction;

export function featureIsAvailable<FeatureInterface>(container: MinimalRequestExtraction | BasicHandler<any>, feature: string[]) {
  const objectKeys = Object.keys(container);
  return feature.filter(f => objectKeys.indexOf(f) === -1).length === 0;
}
