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
): container is FeatureInterface & MinimalRequestExtraction {
  const objectKeys = Object.keys(container);
  return feature.filter(f => objectKeys.indexOf(f) === -1).length === 0;
}

export function handlerFeatureIsAvailable(handler: BasicHandable<any>, featureOrFunctionName: string[]) {
  const objectKeys = [...handler.whitelist, ...handler.specificWhitelist];
  return featureOrFunctionName.filter(f => objectKeys.indexOf(f) === -1).length === 0;
}
