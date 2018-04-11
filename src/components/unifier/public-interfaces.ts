import { Component, ExecutableExtension } from "inversify-components";
import { SpecSetup } from "../../spec-setup";
import { RequestContext } from "../root/public-interfaces";
import { Session } from "../services/public-interfaces";
import { Configuration } from "./private-interfaces";
import { CardResponse } from "./responses/card-response";
import { ChatResponse } from "./responses/chat-response";
import { SuggestionChipsResponse } from "./responses/suggestion-chips-response";

/** Intent type - intents are either strings or type of GenericIntent */
export declare type intent = string | GenericIntent;

/** Main AssistantJS class to send responses to the user. */
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
  endSessionWith(text: string): void | Promise<void>;

  /**
   * Sends voice message but does not end session, so the user is able to respond
   * @param {string} text Text to say to user
   * @param {string[]} [reprompts] If the user does not answer in a given time, these reprompt messages will be used.
   */
  prompt(text: string | Promise<string>, ...reprompts: Array<string | Promise<string>>): void | Promise<void>;
}

// Currently, we are not allowed to use camelCase here! So try to just use a single word!

/** Intents which are not specific to a given platform. */
export enum GenericIntent {
  /** Fired automatically if the voice app is launched */
  Invoke,

  /** Fired automatically if there was no response */
  Unanswered,

  /** Called if no other intent of this state was matched */
  Unhandled,

  /** Say: "Help me" or "What can I do?" */
  Help,

  /** Say: "Yes", "Okay" */
  Yes,

  /** Say: "No" */
  No,

  /** Say: "Cancel" */
  Cancel,

  /** Say: "Stop" */
  Stop,
}

/** Intents which are not specific to a given platform. */
export namespace GenericIntent {
  /**
   * Returns true if a given platform intent is speakable. Unspeakable intents
   * are only callable implicitly, for example GenericIntent.Invoke if the voice app is launched.
   * @param platform intent to check
   */
  export function isSpeakable(currIntent: GenericIntent) {
    const unspeakableIntents: GenericIntent[] = [GenericIntent.Invoke, GenericIntent.Unanswered, GenericIntent.Unhandled];

    return unspeakableIntents.indexOf(currIntent) === -1;
  }
}

/** A custom entity set to use in your utterances and AssistantJS configuration */
export interface EntitySet {
  /** Name of AssistantJS entity to link with this entity set */
  mapsTo: string;
  /**
   * Allowed values of this entity set. Needs language id as hash key and a list
   * of string values or objects with string value and possible synonyms.
   */
  values: { [language: string]: Array<string | { value: string; synonyms: string[] }> };
}

/** Manages access to entities */
export interface EntityDictionary {
  /** Object containing all current entities */
  store: { [name: string]: any };

  /** Checks if the given entity is contained in the store */
  contains(name: string): boolean;

  /** Gets the value of an entity, if the entity is defined */
  get(name: string): string | undefined;

  /** Sets a value of an entity. */
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
  getDistanceSet(
    name: string,
    validValues: string[]
  ):
    | undefined
    | Array<{
        value: string;
        distance: number;
      }>;

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

/** Bundled interfaces for platform generators */
export namespace PlatformGenerator {
  /** Mapping of intent, utterances and entities */
  export interface IntentConfiguration {
    /** The intent */
    intent: intent;

    /** Configured utterances of this intent */
    utterances: string[];

    /** Configured entities of this intent */
    entities: string[];

    /** Configured entitySet of this intent */
    entitySets: { [name: string]: EntitySet };
  }

  /** Service extension, gets utterances by language */
  export interface UtteranceTemplateService {
    /**
     * Gets intent-dependent utterances for specific langauge
     * @param {string} langauge Language to get intent-specific utterances for
     * @return {[intent: string]: string[]} Hash having intent as key and utterances as values
     */
    getUtterancesFor(language: string): { [intent: string]: string[] };
  }

  /** Extension interface to implement a platform generator */
  export interface Extension {
    /**
     * Is called if user wants to generate build on your platform (can be async, see return value)
     * @param {string} langauge langauge to build in
     * @param {string} buildDir path of the build directory
     * @param {IntentConfiguration[]} intentConfiguration Mapping of intent, utterances and entities
     * @param {EntityMapping} entityMapping Mapping of entity types and names
     * @return {void|Promise<void>}
     */
    execute(language: string, buildDir: string, intentConfigurations: IntentConfiguration[], entityMapping: EntityMapping): void | Promise<void>;
  }

  /** Mapping of entity types and names */
  export interface EntityMapping {
    [type: string]: string;
  }
}

/** Extension interface for request extractors */
export interface RequestExtractor<ComponentConfiguration = {}> {
  /** Link to component metadata */
  component: Component<ComponentConfiguration>;

  /**
   * Checks if given context can be processed by this extractor
   * @param {RequestContext} context Given request context
   * @return {Promise<boolean>} True if current context can be processed by this extractor
   */
  fits(context: RequestContext): Promise<boolean>;

  /**
   * Extracts information out of request. The minimum set of information to extract is described by MinimalRequestExtraction.
   * @param {RequestContext} context Request context to extract information from
   * @return {Promise<MinimalRequestExtract>} Set of request information, has to fulfill MinimalRequestExtraction, but can also contain additional information.
   *   See also OptionalExtration interface for more information.
   */
  extract(context: RequestContext): Promise<MinimalRequestExtraction>;
}

/** Common fields between PlatformRequestExtraction and MinimalRequestExtraction */
export interface CommonRequestExtraction {
  /** Set of entities */
  entities?: { [name: string]: any };

  /** Intent to call */
  readonly intent: intent;

  /** Given session id */
  readonly sessionID: string;

  /** Language of this request */
  readonly language: string;
}

/** Result of extractors (platform-view). As a user, you should always use MinimalRequestExtraction. */
export interface PlatformRequestExtraction<ComponentConfiguration = {}> extends CommonRequestExtraction {
  component: Component<ComponentConfiguration>;
}

/** The minimum set of information a RequestExtractor has to extract from a request */
export interface MinimalRequestExtraction extends CommonRequestExtraction {
  /** Name of platform responsible for this extraction (equals to component.name) */
  readonly platform: string;
}

/** Optional, additional informations which extractors may extract from a request */
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
  // tslint:disable-next-line:variable-name
  export const FeatureChecker = {
    /** Are OAuth tokens available? */
    OAuthExtraction: ["oAuthToken"],

    /** Is the spoken text available? */
    SpokenTextExtraction: ["spokenText"],

    /** Is a platform-specific temporal auth token available? */
    TemporalAuthExtraction: ["temporalAuthToken"],

    /** Are information about the used device available? */
    DeviceExtraction: ["device"],
  };
}
/** Minimum interface a response handler has to fulfill */
export interface MinimalResponseHandler {
  /** If set to false, the session should go on after sending the response */
  endSession: boolean;
  /** Voice message to speak to the user */
  voiceMessage: string | null;
  /** Called automatically if the response should be sent */
  sendResponse(): void;
}

/**
 * In addition to the basic features every response handler has to support (see MinimalResponseHandler),
 * every response handler may also support a subset of these features
 */
export namespace OptionalHandlerFeatures {
  /** If implemented, a response handler is able to inform the assistant about a missing oauth token */
  export interface AuthenticationHandler extends MinimalResponseHandler {
    /** If set to true, the assistant will be informed about a missing oauth token */
    forceAuthenticated: boolean;
  }

  /** If implemented, a response handler is able to parse SSML voice message */
  export interface SSMLHandler extends MinimalResponseHandler {
    /** If set to true, this voice message is in SSML format */
    isSSML: boolean;
  }

  /** If implemented, the response handler's platform supports reprompts */
  export interface Reprompt extends MinimalResponseHandler {
    /** Reprompts for the current voice message */
    reprompts: string[] | null;
  }

  export namespace GUI {
    export namespace Card {
      /** If implemented, the response handler's platform supports simple cards, containing text title and body */
      export interface Simple extends MinimalResponseHandler {
        /** The card's title */
        cardTitle: string | null;

        /** The card's body */
        cardBody: string | null;
      }

      /* If implemented, the response handler's platform supports simple cards containing an image */
      export interface Image extends Simple {
        /** The image to display in the card */
        cardImage: string | null;
      }
    }

    /** If implemented, the response handler's platform supports suggestion chips */
    export interface SuggestionChip extends MinimalResponseHandler {
      /** The suggestion chips to show */
      suggestionChips: string[] | null;
    }

    /** If implemented, the response handler's platform supports chat messages, which may differ to the given voice message */
    export interface ChatBubble extends MinimalResponseHandler {
      /** An array containing all chat messages / chat bubbles to display */
      chatBubbles: string[] | null;
    }
  }

  /** For internal feature checking since TypeScript does not emit interfaces */
  // tslint:disable-next-line:variable-name
  export const FeatureChecker = {
    /** Can we force the existance of OAuth tokens? */
    AuthenticationHandler: ["forceAuthenticated"],

    /** Are chat messages / chat bubbles available? */
    ChatBubble: ["chatBubbles"],

    /** Does this response handler support reprompts? */
    Reprompt: ["reprompts"],

    /** Does this response handler support SSML? */
    SSMLHandler: ["isSSML"],

    /** Does this response handler support cards containing a textual title and body? */
    SimpleCard: ["cardBody", "cardTitle"],

    /** Are cards containing a textual title, body and an image available? */
    ImageCard: ["cardBody", "cardTitle", "cardImage"],

    /** Does this response handler support suggestion chips? */
    SuggestionChip: ["suggestionChips"],
  };
}

/** Interface to implement if you want to offer a platform-specific spec helper */
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
  pretendIntentCalled(intent: intent, autoStart?: boolean, additionalExtractions?: any, additionalContext?: any): Promise<MinimalResponseHandler>;
}

/** Configuration object for AssistantJS user for unifier component */
export interface UnifierConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}

/** Interface to Implement if you want to use beforeSendResponse extensionpoint */
export interface BeforeResponseHandler {
  execute(responseHandler: MinimalResponseHandler);
}

/** Interface to Implement if you want to use beforeSendResponse extensionpoint */
export interface AfterResponseHandler {
  execute(responseHandler: MinimalResponseHandler);
}

/** Interface to get all Before- and AfterResponseHandler */
export interface ResponseHandlerExtensions {
  beforeExtensions: BeforeResponseHandler[];
  afterExtensions: AfterResponseHandler[];
}
