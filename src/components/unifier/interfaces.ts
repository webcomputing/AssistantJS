import { ExecutableExtension, Component, MessageBus } from "ioc-container";
import { RequestContext } from "../root/interfaces";

export declare type intent = string | GenericIntent;

export const componentInterfaces = {
  "requestProcessor": Symbol("request-processor"),
  "sessionEndedCallback": Symbol("session-ended-callback"),
  "platformGenerator": Symbol("platform-generator"),
  "utteranceTemplateService": Symbol("utterance-template-service"),
  "entityMapping": Symbol("entitiy-mapping")
};

/** End user interfaces */

export interface ResponseFactory {
  /** Creates a Voiceable response object which decides wheter or wheter not to use SSML based on input and platform features */
  createVoiceResponse(): Voiceable;

  /** Creates a Voiceable response object without SSML availability */
  createSimpleVoiceResponse(): Voiceable;

  /** Creates a Voiceable response object with SSML enabled. Throws an exception of SSML is not possible on platform. */
  createSSMLResponse(): Voiceable;

  /** Creates and sends an empty response */
  createAndSendEmptyResponse(): {};

  /** 
   * Sends a authentication prompt if available on current platform (else throws exception), possibly allows to add a message to it
   * @param text String to add say in authentication prompt
   */
  createAndSendUnauthenticatedResponse(text?: string): {};
}

export interface Voiceable {
  endSessionWith(text: String);
  prompt(text: String);
}

export enum GenericIntent {
  Invoke,
  EndSession,
  Unhandled,
  Help,
  Yes,
  No,
  Cancel
}

export namespace GenericIntent {
  /**
   * Returns true if a given platform intent is speakable. Unspeakable intents
   * are only callable implicitly, for example GenericIntent.EndSession if session was ended by client.
   * @param platform intent to check
   */
  export function isSpeakable(intent: GenericIntent) {
    let unspeakableIntents: GenericIntent[] = [
      GenericIntent.Invoke,
      GenericIntent.EndSession,
      GenericIntent.Unhandled
    ];

    return unspeakableIntents.indexOf(intent) === -1;
  }
}

export interface OptionalConfiguration {
  utterancePath?: string;
  entities?: { [type: string]: string[] };
}
export interface Configuration extends OptionalConfiguration {}

export interface EntityDictionary {
  store: {[name: string]: any};
  contains(name: string): boolean;
  get(name: string): any | undefined;
  set(name: string, value: any);
}

/** Generator interfaces */

export interface GenerateIntentConfiguration {
  intent: intent;
  utterances: string[];
  entities: string[];
}

export interface GeneratorUtteranceTemplateService {
  getUtterancesFor(language: string): {[intent: string]: string[]};
}

export interface PlatformGenerator {
  execute(language: string, buildDir: string, intentConfigurations: GenerateIntentConfiguration[], entityMapping: GeneratorEntityMapping);
}

export interface GeneratorEntityMapping {
  [type: string]: string;
}

/** Extractor interfaces */

export interface RequestConversationExtractor {
  component: Component;
  fits(context: RequestContext): Promise<boolean>;
  extract(context: RequestContext): Promise<MinimalRequestExtraction>;
}

export interface MinimalRequestExtraction {
  component: Component;
  entities?: { [name: string]: any; };
  readonly intent: intent;
  readonly sessionID: string;
  readonly language: string;
}

export namespace OptionalExtractions {
  export interface OAuthExtraction extends MinimalRequestExtraction {
    oAuthToken: string | undefined;
  }

  export interface SpokenTextExtraction extends MinimalRequestExtraction {
    spokenText: string;
  }

  /** For internal feature checking since TypeScript does not emit interfaces */
  export const FeatureChecker = {
    OAuthExtraction: ["oAuthToken"],
    SpokenTextExtraction: ["spokenText"]
  }
}

/** Response handler interfaces */

export interface MinimalResponseHandler {
  endSession: boolean;
  voiceMessage: string;
  sendResponse(): void;
}


export namespace OptionalHandlerFeatures {
  export interface AuthenticationHandler extends MinimalResponseHandler {
    forceAuthenticated: boolean;
  }

  export interface SSMLHandler extends MinimalResponseHandler {
    isSSML: boolean;
  }

  /** For internal feature checking since TypeScript does not emit interfaces */
  export const FeatureChecker = {
    AuthenticationHandler: ["forceAuthenticated"],
    SSMLHandler: ["isSSML"]
  }
}