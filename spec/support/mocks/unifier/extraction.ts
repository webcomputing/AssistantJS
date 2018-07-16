import { GenericIntent, intent as intentType, MinimalRequestExtraction, OptionalExtractions } from "../../../../src/components/unifier/public-interfaces";
import { Component } from "../util/component";

export const PLATFORM = "ExtractorComponent";

export function createExtraction(
  intent: intentType = GenericIntent.Yes,
  entities = {},
  sessionId = "session-" + Math.random(),
  language = "de"
): MinimalRequestExtraction & OptionalExtractions.SessionData {
  return {
    intent,
    entities,
    language,
    sessionID: sessionId,
    platform: PLATFORM,
    sessionData: null,
  };
}

export const extraction = createExtraction();
