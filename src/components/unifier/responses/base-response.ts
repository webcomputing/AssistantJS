import { MinimalResponseHandler } from "../interfaces";
import { featureIsAvailable } from "../feature-checker";
import { log } from "../../../setup";
import { inspect as utilInspect } from "util";

export class BaseResponse {
  /** Response handler of the currently used platform */
  protected handler: MinimalResponseHandler;

  /** If set to false, this response object will throw an exception if an unsupported feature if used */
  failSilentlyOnUnsupportedFeatures: boolean;

  /**
   * Constructs a new instance
   * @param {MinimalResponseHandler} handler The currently acting response handler
   * @param {boolean} failSilentlyOnUnsupportedFeatures If set to true, response class won't throw an error if a feature is unsupported
   */
  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean) {
    this.handler = handler;
    this.failSilentlyOnUnsupportedFeatures = failSilentlyOnUnsupportedFeatures;
  }

  /** Checks whether a given feature (see FeatureChecker) is available, by checking if all given attributes are present in handler */
  protected featureIsAvailable(feature: string[]) {
    return BaseResponse.featureIsAvailable(this.handler, feature);
  }

  /**
   * Checks if a given feature is available and throws error otherwise.
   * @param {string[]} feature The feature which should be available
   * @param {string} message Error message if feature is not available
   */
  protected reportIfUnavailable(feature: string[], message: string) {
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