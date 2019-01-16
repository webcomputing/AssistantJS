import { OptionalHandlerFeatures } from "../public-interfaces";

/**
 * This interface defines the types which can be used on all Handlers
 * Handler should extend this interface to define own specific types.
 * Then multiple interfaces of diffrent Handler can be merged together.
 */
export interface BasicAnswerTypes {
  /** type to represent a simple Card */
  card: {
    /** The card's title */
    title: string;

    /** The card's body */
    description: string;

    /** The image to display in the card */
    cardImage?: string;
  };

  /** Minimal type to represent SuggestionChips */
  suggestionChips: string[];

  /** Minimal type to represent ChatBubbles, an array containing all chat messages / chat bubbles to display */
  chatBubbles: string[];

  /** Minimal type to represent a simple voicemessage or prompt  */
  voiceMessage: {
    text: string;

    /** if true the text contains ssml */
    isSSML: boolean;
  };

  /** If used, the response handler's platform supports reprompts, Reprompts for the current voice message */
  reprompts: Array<BasicAnswerTypes["voiceMessage"]>;

  /** If used, the response handler's platform supports storing of session data, Blob of all session data to set */
  sessionData: string;

  /** if true the session should get authenticated */
  shouldAuthenticate: boolean;

  /**
   * If used, a response handler is able to inform the assistant about a missing oauth token
   * If set to true, the assistant will be informed about a missing oauth token
   */
  shouldSessionEnd: boolean;

  /**
   * HTTP-Status-Code for Response.
   * Warning: Use only if you know, what you are doing.
   * Default: 200 --> OK
   */
  httpStatusCode: number;
}

/**
 * Interface to Implement if you want to use beforeSendResponse extensionpoint
 * The BeforeResponseHandler gets the Handler to add or change values
 */
export interface BeforeResponseHandler<MergedAnswerType extends BasicAnswerTypes, MergedHandler extends BasicHandable<MergedAnswerType>> {
  execute(handler: MergedHandler): Promise<void>;
}

/**
 * Interface to Implement if you want to use afterSendResponse extensionpoint
 * The AfterResponseHandler does only get the results, as the answers cannot be changed anymore
 */
export interface AfterResponseHandler<AnswerType extends BasicAnswerTypes> {
  execute(results: Partial<AnswerType>): Promise<void>;
}

/**
 * Interface to get all Before- and AfterResponseHandler
 */
export interface ResponseHandlerExtensions<MergedAnswerType extends BasicAnswerTypes, MergedHandler extends BasicHandable<MergedAnswerType>> {
  beforeExtensions: Array<BeforeResponseHandler<MergedAnswerType, MergedHandler>>;
  afterExtensions: Array<AfterResponseHandler<MergedAnswerType>>;
}

/**
 * Extends BasicHandable by a method which is called by proxy for every unsupported feature.
 * We want this in an additional interface since the BasicHandable interface is visible for the end user, but this functionality is framework/extension-only.
 */
export interface UnsupportedFeatureSupportForHandables {
  /**
   * If failSilentlyOnUnsupportedFeatures is configured to true, unsupportedFeature() is called for every unsupported method call.
   * unsupportedFeature() itself will add the call to this unsupportedFeatureCalls array.
   */
  unsupportedFeatureCalls: Array<{ methodName: string | number | symbol; args: any[] }>;

  /**
   * As long as failSilentlyOnUnsupportedFeatures is configured to true, this method is called for every method call which doesn't exist on the current response handler object.
   * @param {string} methodName Name of the called, not-existing method
   * @param {any[]} args All passed arguments to the method call
   */
  unsupportedFeature(methodName: string | number | symbol, ...args: any[]): void;
}

/**
 * This interface defines which methods every handler should have.
 * Types are referenced to the merged handler-specific types, like 'AlexaSpecificTypes & GoogleSpecificType'
 *
 * The Geters returns either the value or null. This is necessary, as every specific handler will only implement a subset of the merged FeatureSet.
 * This means for example, that a GoogleSpecificHandler will not have the Method <caption>setAlexaList()</caption>. To make method-chaining possible it is necessary,
 * that all missing feature-methods get traped and return also the correct this-context. This Proxy is return by the @see {@link HandlerProxyFactory}.
 */
export interface BasicHandable<AnswerType extends BasicAnswerTypes> {
  /**
   * Sends voice message
   * @param text Text to say to user
   */
  prompt(inputText: AnswerType["voiceMessage"]["text"] | Promise<AnswerType["voiceMessage"]["text"]>): this;

  /**
   * End the current session, so the user cannot respond anymore
   */
  setEndSession(): this;

  /**
   * End the current session, so the user cannot respond anymore
   * allows to set a last message before the session ends
   * @param text
   */
  endSessionWith(text: AnswerType["voiceMessage"]["text"] | Promise<AnswerType["voiceMessage"]["text"]>): this;

  /**
   * Allows to set a custom httpStatusCode
   * if not set the default is 200
   * @param httpStatusCode eg. 200 or 401
   */
  setHttpStatusCode(httpStatusCode: AnswerType["httpStatusCode"] | Promise<AnswerType["httpStatusCode"]>): this;

  /**
   * Sends all messages as answer. After sending it is not possible anymore to set or change the answer.
   */
  send(): Promise<void>;

  /**
   * Returns true when @see {send()} has been called, otherwise false
   */
  wasSent(): boolean;
}

/**
 * Combination of BasicHandable and SessionHandable
 */
export type BasicSessionHandable<B extends BasicAnswerTypes> = BasicHandable<B> & OptionalHandlerFeatures.SessionData<B>;
