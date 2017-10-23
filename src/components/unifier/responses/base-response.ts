import { MinimalResponseHandler } from "../interfaces";
import { featureIsAvailable } from "../feature-checker";
import { log } from "../../../setup";
import { inspect as utilInspect } from "util";

export class BaseResponse {
  handler: MinimalResponseHandler;
  failSilentlyOnUnsupportedFeatures: boolean;

  /**
   * Constructs a new instance
   * @param {MinimalResponseHandler} handler The currently acting response handler
   * @param {boolean} failSilentlyOnUnsupportedFeatures If set to true, response class won't throw an error if a feature is unsupported
   */
  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures = false) {
    this.handler = handler;
    this.failSilentlyOnUnsupportedFeatures = failSilentlyOnUnsupportedFeatures;
  }

  /** Checks whether a given feature (see FeatureChecker) is available, by checking if all given attributes are present in handler */
  featureIsAvailable(feature: string[]) {
    return BaseResponse.featureIsAvailable(this.handler, feature);
  }

  /**
   * Checks if a given feature is available and throws error otherwise.
   * @param {string[]} feature The feature which should be available
   * @param {string} message Error message if feature is not available
   */
  reportIfUnavailable(feature: string[], message: string) {
    if (!this.featureIsAvailable(feature)) {
      const errorMessage = message + " - Used response handler = " + utilInspect(this.handler);    
      log(errorMessage);
      if (!this.failSilentlyOnUnsupportedFeatures) throw new Error(errorMessage);
    }
  }

  /** Checks whether a given feature (see FeatureChecker) is available, by checking if all given attributes are present in handler */
  static featureIsAvailable(handler: MinimalResponseHandler, feature: string[]) {
    return featureIsAvailable(handler, feature);
  }
}