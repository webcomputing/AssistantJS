import * as crypto from "crypto";

import { LoggerMiddleware } from "../root/public-interfaces";
import { MinimalRequestExtraction } from "./public-interfaces";


export function createUnifierLoggerMiddleware(extraction?: MinimalRequestExtraction): LoggerMiddleware {
  if (typeof extraction === "undefined" || typeof extraction.sessionID === "undefined") {
    return (currentLogger) => currentLogger;
  }

  const sessionSlug = crypto.createHash('sha1').update(extraction.sessionID).digest('hex').slice(0, 7);
  return (currentLogger) => currentLogger.child({ sessionSlug: sessionSlug });
}