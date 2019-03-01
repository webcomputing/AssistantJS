export const componentInterfaces = {
  afterSendResponse: Symbol("after-send-response"),
  beforeSendResponse: Symbol("before-send-response"),
  entityMapping: Symbol("entity-mapping"),
  platformGenerator: Symbol("platform-generator"),
  requestProcessor: Symbol("request-processor"),
  requestModifier: Symbol("request-modifier"),
  utteranceTemplateService: Symbol("utterance-template-service"),
};

export namespace Configuration {
  /** A set of key value names which are not masked in logs. e.g.: { entities: ["firstName", "LastName"] } */
  export interface LogWhitelistElement {
    [keyName: string]: LogWhitelistSet;
  }

  /** A set of key names which are not masked in logs. For example: ["intent", { entities: ["firstName", "LastName"] }]. Defaults to ["platform", "device", "intent", "language"] */
  export type LogWhitelistSet = Array<string | LogWhitelistElement>;

  /** Configuration object for context deriver */
  export interface ContextDeriverOptions {
    /** Priority list of request extractors (give their component names). When context deriver finds more than one suitable extractor, it decides by using this list. */
    requestExtractorPriority?: string[];
    /** Disables choosing suitable request extractor by most supported features. Only applies if also using `requestExtractorPriority`. */
    disableMostFeaturesWin?: boolean;
  }

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

    /** Context deriver options */
    contextDeriver?: ContextDeriverOptions;
  }

  /** Required configuration options, no defaults are used here */
  // tslint:disable-next-line:no-empty-interface
  export interface Required {}

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {}
}
