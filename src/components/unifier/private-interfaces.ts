export const componentInterfaces = {
  "requestProcessor": Symbol("request-processor"),
  "sessionEndedCallback": Symbol("session-ended-callback"),
  "platformGenerator": Symbol("platform-generator"),
  "utteranceTemplateService": Symbol("utterance-template-service"),
  "entityMapping": Symbol("entity-mapping"),
  "beforeKillSession": Symbol("hooks-before-kill-session"),
  "afterKillSession": Symbol("hooks-after-kill-session")
};

export namespace Configuration {
  /** A set of key names which are not masked in logs. For example: ["intent", { entities: ["firstName", "LastName"] }]. Defaults to ["platform", "device", "intent", "language"] */
  export type LogWhitelistSet = ( string | { [keyName: string]: LogWhitelistSet } )[];

  /** Configuration defaults -> all of these keys are optional for user */
  export interface Defaults {
    /** Path to your utterances. Regularly, you shouldn't need to change this. */
    utterancePath: string;
  
    /** Maps all entities of your app to their respective internal types. You later have to map these types to platform-specific types. */
    entities: { [type: string]: string[] };
  
    /** If set to false, created response objects will throw an exception if an unsupported feature if used */
    failSilentlyOnUnsupportedFeatures: boolean;
  
    /** A set of key names which are not masked in logs. For example: ["intent", { entities: ["firstName", "LastName"] }]. Defaults to ["platform", "device", "intent", "language"] */
    logExtractionWhitelist: LogWhitelistSet;
  }

  /** Required configuration options, no defaults are used here */
  export interface Required {}

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {};
}