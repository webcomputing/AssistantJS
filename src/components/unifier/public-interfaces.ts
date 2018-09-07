import { Component, ExecutableExtension } from "inversify-components";
import { SpecHelper } from "../../spec-helper";
import { RequestContext } from "../root/public-interfaces";
import { Session } from "../services/public-interfaces";
import { Configuration } from "./private-interfaces";
import { BasicAnswerTypes, BasicHandable } from "./response-handler";

/** Intent type - intents are either strings or type of GenericIntent */
export declare type intent = string | GenericIntent;

export interface Voiceable {
  /**
   * Sends voice message and ends session
   * @param {string} text Text to say to user
   */
  endSessionWith(text: string | Promise<string>): void;

  /**
   * Sends voice message but does not end session, so the user is able to respond
   * @param {string} text Text to say to user
   * @param {string[]} [reprompts] If the user does not answer in a given time, these reprompt messages will be used.
   */
  prompt(inputText: string | Promise<string>, ...inputReprompts: Array<string | Promise<string>>): void;
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

/** Custom entities can and should be used for anything that's not covered by system entities */
export interface CustomEntity {
  /**
   * Names of the entities which are mentioned in the utterances
   */
  names: string[];
  /**
   * Allowed values of this entity set. Needs language id as hash key and a list
   * of string values or objects with string value and possible synonyms.
   */
  values: {
    [language: string]: Array<{
      value: string;
      synonyms: string[];
    }>;
  };
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
    // tslint:disable-next-line:prefer-array-literal
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
     * @param {{[name: string]: EntityMap}} entityMappings Mappings of entity types and values
     * @return {void|Promise<void>}
     */
    execute(
      language: string,
      buildDir: string,
      intentConfigurations: IntentConfiguration[],
      entityMappings: { [name: string]: EntityMap }
    ): void | Promise<void>;
  }

  /** Mapping of entity types and names */
  export interface EntityMapping {
    [type: string]: string;
  }

  /** Represents a mapping between an entity type and its allowed values */
  export interface EntityMap {
    /** Linked entity type */
    type: string;
    /** Allowed values of this entity set */
    values?: Array<{
      value: string;
      synonyms: string[];
    }>;
  }

  /** Manage the mapped entities and its types */
  export interface EntityMapper {
    /** Name of AssistantJS entity to link with this entity set */
    store: {
      [language: string]: {
        [name: string]: EntityMap;
      };
    };
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

/**
 * Extension interface to modify extractions after the Extractor has made them
 */
export interface RequestExtractionModifier {
  /**
   * Modifies the RequestExtraction
   * @param extraction the original or previous extraction
   */
  modify(extraction: MinimalRequestExtraction): Promise<MinimalRequestExtraction>;
}

/** Common fields between PlatformRequestExtraction and MinimalRequestExtraction */
export interface CommonRequestExtraction {
  /** Set of entities */
  entities?: { [name: string]: any };

  /** Intent to call */
  intent: intent;

  /** Given session id */
  sessionID: string;

  /** Language of this request */
  language: string;
}

/** Result of extractors (platform-view). As a user, you should always use MinimalRequestExtraction. */
export interface PlatformRequestExtraction<ComponentConfiguration = {}> extends CommonRequestExtraction {
  component: Component<ComponentConfiguration>;
}

/** The minimum set of information a RequestExtractor has to extract from a request */
export interface MinimalRequestExtraction extends CommonRequestExtraction {
  /** Name of platform responsible for this extraction (equals to component.name) */
  platform: string;
}

/** Optional, additional informations which extractors may extract from a request */
export namespace OptionalExtractions {
  /** Interface for extraction of oauth key */
  export interface OAuth {
    /** The oauth token, or null, if not present in current extraction */
    oAuthToken: string | null;
  }

  /** Interface for extraction of platform-specific temporal auth */
  export interface TemporalAuth {
    /** The temporal auth token, or null, if not present in current extraction */
    temporalAuthToken: string | null;
  }

  /** Interface for extraction of spoken text */
  export interface SpokenText {
    /** The spoken text. NULL values are not allowed here: If a platform supports spoken-text-extraxtion, it has to return to spoken text. */
    spokenText: string;
  }

  export interface Device {
    /**
     * Name of platform-specific device, name is given and filled by platform.
     * NULL values are not allowed here: If a platform supports devices, it has to return the used one.
     */
    device: string;
  }

  export interface Timestamp {
    /**
     * Timestamp of the platform-specific request.
     * NULL values are not allowed here: If a platform supports Timestamp, it has to return this.
     */
    requestTimestamp: string;
  }

  export interface SessionData {
    /**
     * Blob of all session data or NULL, if current request doesn't contain any session data.
     */
    sessionData: string | null;
  }

  /** Interface for additional domainspecific Paramters */
  export interface AdditionalParameters {
    /**
     * Key-Value Store for any additional paramters
     */
    additionalParameters: { [paramter: string]: any };
  }

  /** For internal feature checking since TypeScript does not emit interfaces */
  // tslint:disable-next-line:variable-name
  export const FeatureChecker = {
    /** Are OAuth tokens available? */
    OAuthExtraction: ["oAuthToken"] /** Is the spoken text available? */,
    SpokenTextExtraction: ["spokenText"] /** Is a platform-specific temporal auth token available? */,
    TemporalAuthExtraction: ["temporalAuthToken"] /** Are information about the used device available? */,
    DeviceExtraction: ["device"],
    TimestampExtraction: ["requestTimestamp"],
    SessionData: ["sessionData"],
  };
}

/**
 * optional features a custom handler can use
 */
export namespace OptionalHandlerFeatures {
  /**
   * This interface defines which methodes are necessary for ResponseHandler to handle Sessions
   */
  export interface SessionData<MergedAnswerTypes extends BasicAnswerTypes> {
    /**
     * Adds Data to session
     *
     * Most of the time it is better to use the @see {@link Session}-Implementation, as the Session-Implemention will set it automatically to the handler
     * or use another SessionStorage like Redis. And it has some more features.
     */
    setSessionData(sessionData: MergedAnswerTypes["sessionData"] | Promise<MergedAnswerTypes["sessionData"]>): this;

    /**
     * gets the current SessionData as Promise or undefined if no session is set
     */
    getSessionData(): Promise<MergedAnswerTypes["sessionData"]> | undefined;
  }

  /**
   * Adds SuggestionChips to Handler
   */
  export interface SuggestionChips<MergedAnswerTypes extends BasicAnswerTypes> {
    /**
     * Add some sugestions for Devices with a Display after the response is shown and/or read to the user
     * @param suggestionChips Texts to show (mostly) under the previous responses (prompts)
     */
    setSuggestionChips(suggestionChips: MergedAnswerTypes["suggestionChips"] | Promise<MergedAnswerTypes["suggestionChips"]>): this;
  }

  export interface Reprompts<MergedAnswerTypes extends BasicAnswerTypes> {
    /**
     * Sends voice message
     * @param text Text to say to user
     * @param reprompts {optional} If the user does not answer in a given time, these reprompt messages will be used.
     */
    prompt(
      inputText: MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>,
      ...reprompts: Array<MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>>
    ): this; // cannot set type via B["reprompts"] as typescript thinks this type is not an array

    /**
     * Adds voice messages when the User does not answer in a given time
     * @param reprompts {optional} If the user does not answer in a given time, these reprompt messages will be used.
     */
    setReprompts(
      reprompts:
        | Array<MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>>
        | Promise<Array<MergedAnswerTypes["voiceMessage"]["text"]>>
    ): this;
  }

  export interface Card<MergedAnswerTypespe extends BasicAnswerTypes> {
    /**
     * Adds a common Card to all Handlers
     * @param card Card which should be shown
     */
    setCard(card: MergedAnswerTypespe["card"] | Promise<MergedAnswerTypespe["card"]>): this;
  }

  export interface ChatBubbles<MergedAnswerTypes extends BasicAnswerTypes> {
    /**
     * Add multiple texts as seperate text-bubbles
     * @param chatBubbles Array of texts to shown as Bubbles
     */
    setChatBubbles(chatBubbles: MergedAnswerTypes["chatBubbles"] | Promise<MergedAnswerTypes["chatBubbles"]>): this;
  }

  export interface Authentication {
    /**
     * Sets the current Session as Unauthenticated.
     */
    setUnauthenticated(): this;
  }

  // tslint:disable-next-line:variable-name
  export const FeatureChecker = {
    Authentication: ["setUnauthenticated"],
    Card: ["setCard"],
    ChatBubbles: ["setChatBubbles"],
    Reprompt: ["setReprompts"],
    SessionData: ["getSessionData", "setSessionData"],
    SuggestionChips: ["setSuggestionChips"],
  };
}

/**
 * Export all interfaces from the response handle specific types
 */
export { BasicAnswerTypes, BasicHandable, BeforeResponseHandler, AfterResponseHandler, ResponseHandlerExtensions } from "./response-handler/handler-types";

/**
 * Export mixins
 */
export { AuthenticationMixin, CardMixin, ChatBubblesMixin, RepromptsMixin, SessionDataMixin, SuggestionChipsMixin } from "./response-handler/mixins";

/** Interface to implement if you want to offer a platform-specific spec helper */
export interface PlatformSpecHelper<MergedAnswerTypes extends BasicAnswerTypes, MergedHandler extends BasicHandable<MergedAnswerTypes>> {
  /** Link to assistantJS SpecSetup */
  specSetup: SpecHelper;

  /**
   * Pretends call of given intent (and entities, ...)
   * @param {intent} intent intent to call
   * @param {boolean} autoStart if set to true, setup.runMachine() will be called automatically
   * @param {object} additionalExtractions Extractions (entities, oauth, ...) in addition to intent
   * @param {object} additionalContext additional context info (in addition to default mock) to add to request context
   */
  pretendIntentCalled(intent: intent, autoStart?: boolean, additionalExtractions?: any, additionalContext?: any): Promise<MergedHandler>;
}

/** Configuration object for AssistantJS user for unifier component */
export interface UnifierConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}

/**
 * Combination of normal Type and Promise of Type
 */
export type OptionallyPromise<T> = T | Promise<T>;
