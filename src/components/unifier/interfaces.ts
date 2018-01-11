import { ExecutableExtension, Component, MessageBus } from "inversify-components";
import { RequestContext } from "../root/interfaces";
import { Session } from "../services/interfaces";
import { SpecSetup } from "../../spec-setup";
import { CardResponse } from "./responses/card-response";
import { ChatResponse } from "./responses/chat-response";
import { SuggestionChipsResponse } from "./responses/suggestion-chips-response";

export declare type intent = string | GenericIntent;

export const componentInterfaces = {
  "requestProcessor": Symbol("request-processor"),
  "sessionEndedCallback": Symbol("session-ended-callback"),
  "platformGenerator": Symbol("platform-generator"),
  "utteranceTemplateService": Symbol("utterance-template-service"),
  "entityMapping": Symbol("entity-mapping"),
  "beforeKillSession": Symbol("hooks-before-kill-session"),
  "afterKillSession": Symbol("hooks-after-kill-session")
};

/** End user interfaces */

export interface ResponseFactory {
  /** If set to false, created response objects will throw an exception if an unsupported feature if used */
  failSilentlyOnUnsupportedFeatures: boolean;

  /** Creates a Voiceable response object which decides wheter or wheter not to use SSML based on input and platform features */
  createVoiceResponse(): Voiceable;

  /** Creates a Voiceable response object without SSML availability */
  createSimpleVoiceResponse(): Voiceable;

  /** Creates a Voiceable response object with SSML enabled. Throws an exception of SSML is not possible on platform. */
  createSSMLResponse(): Voiceable;

  /** Creates a response object for adding suggestion chips to the current response */
  createSuggestionChipsResponse(): SuggestionChipsResponse;

  /** Creates a response object for adding text/chat messsages (for displaying) to the current response */
  createChatResponse(): ChatResponse;

  /** Creates and sends an empty response */
  createAndSendEmptyResponse(): {};

  /** 
   * Sends a authentication prompt if available on current platform (else throws exception), possibly allows to add a message to it
   * @param text String to add say in authentication prompt
   */
  createAndSendUnauthenticatedResponse(text?: string): {};

  /** Creates a card response for adding simple graphical elements to your response */
  createCardResponse(): CardResponse;
}

export interface Voiceable {
  /**
   * Sends voice message and ends session
   * @param {string} text Text to say to user
   */
  endSessionWith(text: string);

  /**
   * Sends voice message but does not end session, so the user is able to respond
   * @param {string} text Text to say to user
   * @param {string[]} [reprompts] If the user does not answer in a given time, these reprompt messages will be used.
   */
  prompt(text: string, ...reprompts: string[]);
}

/** Currently, we are not allowed to use camelCase here! So try to just use a single word! */
export enum GenericIntent {
  Invoke,
  Unanswered,
  Unhandled,
  Help,
  Yes,
  No,
  Cancel,
  Stop
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
      GenericIntent.Unanswered,
      GenericIntent.Unhandled
    ];

    return unspeakableIntents.indexOf(intent) === -1;
  }
}

export interface OptionalConfiguration {
  utterancePath?: string;
  entities?: { [type: string]: string[] };

  /** If set to false, created response objects will throw an exception if an unsupported feature if used */
  failSilentlyOnUnsupportedFeatures?: boolean;
}
export interface Configuration extends OptionalConfiguration {}

export interface EntityDictionary {
  store: {[name: string]: any};
  contains(name: string): boolean;
  get(name: string): string | undefined;
  set(name: string, value: any);

  /** 
   * Returns the element in validValues which is as close as possible to the entity value for name.
   * Returns undefined if there is no entity for name. Calculates a Levenshtein distance to find out the closest valid value.
   * @param name Name of the entity
   * @param validValues List of all valid values
   * @param maxDistance If given, returns undefined if the closest match's Levenshtein distance is > than this value 
  */
  getClosest(name: string, validValues: string[], maxDistance?: number): string | undefined;

  /** 
   * Returns a list containing all values from validValues and their distances to the entity value.
   * Returns undefined if there is no entity for name. Calculates a Levenshtein distance to find out the distance values.
   * @param name Name of the entity
   * @param validValues List of all valid values
  */
  getDistanceSet(name: string, validValues: string[]): undefined | {
    value: string;
    distance: number;
  }[];

  /** 
   * Stores current entity dictionary to a given session to allow restoring all contained entities later.
   * @param session The session to store into
   * @param storeKey The key to use to store the entities. You possibly don't want to change this, except you are using multiple entitiy stores.
   */
  storeToSession(session: Session, storeKey?: string): Promise<void>;

  /** 
   * Reads current entity dictionary from given session and merges with entities in this request. 
   * @param session The session to read from (same as in storeToSession)
   * @param preferCurrentStore If set to true (default), entities in this request overwrite stored ones (in case of same names). Else it's the other way around.
   * @param storeKey The key to use to store the entities. You possibly don't want to change this, except you are using multiple entitiy stores.
   */
  readFromSession(session: Session, preferCurrentStore?: boolean, storeKey?: string): Promise<void>;
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

/** Common fields between PlatformRequestExtraction and MinimalRequestExtraction */
export interface CommonRequestExtraction {
  /** Set of entities */
  entities?: { [name: string]: any; };

  /** Intent to call */
  readonly intent: intent;

  /** Given session id */
  readonly sessionID: string;

  /** Language of this request */
  readonly language: string;
}

/** Result of extractors (platform-view). As a user, you should always use MinimalRequestExtraction. */
export interface PlatformRequestExtraction extends CommonRequestExtraction {
  component: Component;
}

export interface MinimalRequestExtraction extends CommonRequestExtraction {
  /** Name of platform responsible for this extraction (equals to component.name) */
  platform: string;
}

export namespace OptionalExtractions {
  /** Interface for extraction of oauth key */
  export interface OAuthExtraction extends MinimalRequestExtraction {
    /** The oauth token, or null, if not present in current extraction */
    oAuthToken: string | null;
  }

  /** Interface for extraction of platform-specific temporal auth */
  export interface TemporalAuthExtraction extends MinimalRequestExtraction {
    /** The temporal auth token, or null, if not present in current extraction */
    temporalAuthToken: string | null;
  }

  /** Interface for extraction of spoken text */
  export interface SpokenTextExtraction extends MinimalRequestExtraction {
    /** The spoken text. NULL values are not allowed here: If a platform supports spoken-text-extraxtion, it has to return to spoken text. */
    spokenText: string;
  }

  export interface DeviceExtraction extends MinimalRequestExtraction {
    /** 
     * Name of platform-specific device, name is given and filled by platform.
     * NULLL values are not allowed here: If a platform supports devices, it has to return the used one.
    */
    device: string;
  }

  /** For internal feature checking since TypeScript does not emit interfaces */
  export const FeatureChecker = {
    OAuthExtraction: ["oAuthToken"],
    SpokenTextExtraction: ["spokenText"],
    TemporalAuthExtraction: ["temporalAuthToken"],
    DeviceExtraction: ["device"]
  }
}

/** Response handler interfaces */

export interface MinimalResponseHandler {
  endSession: boolean;
  voiceMessage: string | null;
  sendResponse(): void;
}

export interface PlatformSpecHelper {
  /** Link to assistantJS SpecSetup */
  specSetup: SpecSetup;

  /** 
   * Pretends call of given intent (and entities, ...)
   * @param {intent} intent intent to call
   * @param {boolean} autoStart if set to true, setup.runMachine() will be called automatically
   * @param {object} additionalExtractions Extractions (entities, oauth, ...) in addition to intent
   * @param {object} additionalContext additional context info (in addition to default mock) to add to request context
   */
  pretendIntentCalled(intent: intent, autoStart?:boolean, additionalExtractions?: any, additionalContext?: any): Promise<MinimalResponseHandler>;
}


export namespace OptionalHandlerFeatures {
  export interface AuthenticationHandler {
    forceAuthenticated: boolean;
  }

  export interface SSMLHandler {
    isSSML: boolean;
  }

  export interface Reprompt {
    reprompts: string[] | null;
  }

  export namespace GUI {
    export namespace Card {
      export interface Simple {
        cardTitle: string | null;
        cardBody: string | null;
      }

      export interface Image extends Simple {
        cardImage: string | null;
      }
    }

    export interface SuggestionChip {
      suggestionChips: string[] | null;
    }

    export interface ChatBubble {
      chatBubbles: string[] | null;
    }
  }


  /** For internal feature checking since TypeScript does not emit interfaces */
  export const FeatureChecker = {
    AuthenticationHandler: ["forceAuthenticated"],
    ChatBubble: ["chatBubbles"],
    Reprompt: ["reprompts"],
    SSMLHandler: ["isSSML"],
    SimpleCard: ["cardBody", "cardTitle"],
    ImageCard: ["cardBody", "cardTitle", "cardImage"],
    SuggestionChip: ["suggestionChips"]
  }
}