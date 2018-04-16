import { EntitySet } from "./public-interfaces";

export const componentInterfaces = {
  afterKillSession: Symbol("hooks-after-kill-session"),
  afterSendResponse: Symbol("after-send-response"),
  beforeKillSession: Symbol("hooks-before-kill-session"),
  beforeSendResponse: Symbol("before-send-response"),
  entityMapping: Symbol("entity-mapping"),
  platformGenerator: Symbol("platform-generator"),
  requestProcessor: Symbol("request-processor"),
  sessionEndedCallback: Symbol("session-ended-callback"),
  utteranceTemplateService: Symbol("utterance-template-service"),
};

export namespace Configuration {
  /** A set of key names which are not masked in logs. For example: ["intent", { entities: ["firstName", "LastName"] }]. Defaults to ["platform", "device", "intent", "language"] */
  export type LogWhitelistSet = Array<string | { [keyName: string]: LogWhitelistSet }>;

  /** Configuration defaults -> all of these keys are optional for user */
  export interface Defaults {
    /** Path to your utterances. Regularly, you shouldn't need to change this. */
    utterancePath: string;

    /** Maps all entities of your app to their respective internal types. You later have to map these types to platform-specific types. */
    entities: { [type: string]: string[] };

    /** Sets of custom entities and allowed / example entity values */
    entitySets: { [name: string]: EntitySet };

    /** If set to false, created response objects will throw an exception if an unsupported feature if used */
    failSilentlyOnUnsupportedFeatures: boolean;

    /** A set of key names which are not masked in logs. For example: ["intent", { entities: ["firstName", "LastName"] }]. Defaults to ["platform", "device", "intent", "language"] */
    logExtractionWhitelist: LogWhitelistSet;
  }

  /** Required configuration options, no defaults are used here */
  // tslint:disable-next-line:no-empty-interface
  export interface Required {}

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {}
}
