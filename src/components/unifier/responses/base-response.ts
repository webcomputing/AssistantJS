import { Logger } from "../../root/interfaces";
import { MinimalResponseHandler } from "../interfaces";
import { featureIsAvailable } from "../feature-checker";

export class BaseResponse {
  /**
   * Constructs a new instance
   * @param {MinimalResponseHandler} handler The currently acting response handler
   * @param {boolean} failSilentlyOnUnsupportedFeatures If set to true, response class won't throw an error if a feature is unsupported
   * @param {Logger} logger Logger to use
   */
  constructor(
    protected handler: MinimalResponseHandler, 
    public failSilentlyOnUnsupportedFeatures: boolean, 
    public logger: Logger
  ) {}

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
      const errorMessage = message + " - Used response handler = " + this.handler.constructor.name;    
      this.logger.warn(errorMessage);
      if (!this.failSilentlyOnUnsupportedFeatures) throw new Error(errorMessage);
    }
  }

  /** Checks whether a given feature (see FeatureChecker) is available, by checking if all given attributes are present in handler */
  static featureIsAvailable(handler: MinimalResponseHandler, feature: string[]) {
    return featureIsAvailable(handler, feature);
  }
}