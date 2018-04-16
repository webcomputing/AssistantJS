import { GenericIntent, intent, MinimalRequestExtraction } from "../../../../src/components/unifier/public-interfaces";
import { Component } from "../util/component";

export function createExtraction(
  intent: intent = GenericIntent.Yes,
  entities = {},
  sessionId = "session-" + Math.random(),
  language = "de"
): MinimalRequestExtraction {
  return {
    intent,
    sessionID: sessionId,
    entities,
    language,
    platform: "ExtractorComponent",
  };
}

export const extraction = createExtraction();
