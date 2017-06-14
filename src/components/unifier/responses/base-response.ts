import { MinimalResponseHandler, MinimalRequestExtraction } from "../interfaces";

export class BaseResponse {
  extraction: MinimalRequestExtraction;
  handler: MinimalResponseHandler;

  constructor(extraction: MinimalRequestExtraction) {
    this.extraction = extraction;
    this.handler = extraction.getHandler();
  }

  /** Checks whether a given feature (see FeatureChecker) is available, by checking if all given attributes are present in handler */
  featureIsAvailable(feature: string[]) {
    return BaseResponse.featureIsAvailable(this.handler, feature);
  }

  /** Checks whether a given feature (see FeatureChecker) is available, by checking if all given attributes are present in handler */
  static featureIsAvailable(handler: MinimalResponseHandler, feature: string[]) {
    let objectKeys = Object.keys(handler);
    return feature.filter(f => objectKeys.indexOf(f) === -1).length === 0;
  }
}