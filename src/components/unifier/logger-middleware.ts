import * as crypto from "crypto";

import { LoggerMiddleware } from "../root/public-interfaces";
import { featureIsAvailable } from "./feature-checker";
import { MinimalRequestExtraction, OptionalExtractions } from "./public-interfaces";

export function createUnifierLoggerMiddleware(extraction?: MinimalRequestExtraction): LoggerMiddleware {
  if (typeof extraction === "undefined" || typeof extraction.sessionID === "undefined") {
    return currentLogger => currentLogger;
  }

  let loggingParams: { sessionSlug: string; device?: string; platform: string };

  // Append created session slug and platform name to logging params
  loggingParams = {
    sessionSlug: crypto
      .createHash("sha1")
      .update(extraction.sessionID)
      .digest("hex")
      .slice(0, 7),
    platform: extraction.platform,
  };

  // Append device name to logging params - if given
  if (featureIsAvailable<OptionalExtractions.Device>(extraction, OptionalExtractions.FeatureChecker.DeviceExtraction)) {
    loggingParams.device = extraction.device;
  }

  return currentLogger => currentLogger.child(loggingParams);
}
