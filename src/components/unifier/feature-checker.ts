import { MinimalResponseHandler, MinimalRequestExtraction } from "./interfaces";

/** 
 * Checks whether a given feature exists in an extraction result or is supported by a response handler.
 * @param container The extraction result or the response handler which might contain the feature
 * @param feature The feature to check. Just pass a value of the FeatureChecker object in OptionalExtractions or OptionalFeatures (=> unifierInterfaces)
 */
export function featureIsAvailable(container: MinimalRequestExtraction | MinimalResponseHandler, feature: string[]): boolean {
  let objectKeys = Object.keys(container);
  return feature.filter(f => objectKeys.indexOf(f) === -1).length === 0;
}