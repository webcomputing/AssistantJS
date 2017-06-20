import { MinimalRequestExtraction, intent, GenericIntent } from "../../../../src/components/unifier/interfaces";
import { Component } from "../util/component";

export function createExtraction(intent: intent = GenericIntent.Yes, entities = {}, sessionId = "session-" + Math.random(), language = "de"): MinimalRequestExtraction {
  return {
    intent: intent,
    sessionID: sessionId,
    entities: entities,
    language: language,
    component: new Component("ExtractorComponent")
  }
}

export const extraction = createExtraction();