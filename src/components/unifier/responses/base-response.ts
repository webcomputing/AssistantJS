import { MinimalResponseHandler } from "../interfaces";
import { featureIsAvailable } from "../feature-checker";

export class BaseResponse {
  handler: MinimalResponseHandler;

  constructor(handler: MinimalResponseHandler) {
    this.handler = handler;
  }

  /** Checks whether a given feature (see FeatureChecker) is available, by checking if all given attributes are present in handler */
  featureIsAvailable(feature: string[]) {
    return BaseResponse.featureIsAvailable(this.handler, feature);
  }

  /** Checks whether a given feature (see FeatureChecker) is available, by checking if all given attributes are present in handler */
  static featureIsAvailable(handler: MinimalResponseHandler, feature: string[]) {
    return featureIsAvailable(handler, feature);
  }
}