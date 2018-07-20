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
  suggestionChips: Array<{ displayText: string; spokenText: string }>;

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
}

/**
 * Interface to Implement if you want to use beforeSendResponse extensionpoint
 * The BeforeResponseHandler gets the Handler to add or change values
 */
export interface BeforeResponseHandler<AnswerType extends BasicAnswerTypes, CustomHandler extends BasicHandable<AnswerType>> {
  execute(handler: CustomHandler): Promise<void>;
}

/**
 * Interface to Implement if you want to use afterSendResponse extensionpoint
 * The AfterResponseHandler does only get the results, as the answers cannot be changed anymore
 */
export interface AfterResponseHandler<AnswerType extends BasicAnswerTypes> {
  execute(results: Partial<AnswerType>);
}

/**
 * Interface to get all Before- and AfterResponseHandler
 */
export interface ResponseHandlerExtensions<AnswerType extends BasicAnswerTypes, CustomHandler extends BasicHandable<AnswerType>> {
  beforeExtensions: Array<BeforeResponseHandler<AnswerType, CustomHandler>>;
  afterExtensions: Array<AfterResponseHandler<AnswerType>>;
}

/**
 * This interface defines which methodes are necessary for ResponseHandler to handle Sessions
 */
export interface SessionHandable<CurrentType extends BasicAnswerTypes> {
  /**
   * Adds Data to session
   *
   * Most of the time it is better to use the @see {@link Session}-Implementation, as the Session-Implemention will set it automatically to the handler
   * or use another SessionStorage like Redis. And it has some more features.
   */
  setSessionData(sessionData: CurrentType["sessionData"] | Promise<CurrentType["sessionData"]>): this;

  /**
   * gets the current SessionData as Promise or undefined if no session is set
   */
  getSessionData(): Promise<CurrentType["sessionData"]> | undefined;
}

/**
 * Adds SuggestionChips to Handler
 */
export interface SuggestionChipsHandable<CurrentType extends BasicAnswerTypes> {
  /**
   * Add some sugestions for Devices with a Display after the response is shown and/or read to the user
   * @param suggestionChips Texts to show (mostly) under the previous responses (prompts)
   */
  setSuggestionChips(suggestionChips: CurrentType["suggestionChips"] | Promise<CurrentType["suggestionChips"]>): this;
}

export interface RepromptsHandable<CurrentType extends BasicAnswerTypes> {
  /**
   * Sends voice message
   * @param text Text to say to user
   * @param reprompts {optional} If the user does not answer in a given time, these reprompt messages will be used.
   */
  prompt(
    inputText: CurrentType["voiceMessage"]["text"] | Promise<CurrentType["voiceMessage"]["text"]>,
    ...reprompts: Array<CurrentType["voiceMessage"]["text"] | Promise<CurrentType["voiceMessage"]["text"]>>
  ): this; // cannot set type via B["reprompts"] as typescript thinks this type is not an array

  /**
   * Adds voice messages when the User does not answer in a given time
   * @param reprompts {optional} If the user does not answer in a given time, these reprompt messages will be used.
   */
  setReprompts(
    reprompts: Array<CurrentType["voiceMessage"]["text"] | Promise<CurrentType["voiceMessage"]["text"]>> | Promise<Array<CurrentType["voiceMessage"]["text"]>>
  ): this;
}

export interface CardHandable<CurrentType extends BasicAnswerTypes> {
  /**
   * Adds a common Card to all Handlers
   * @param card Card which should be shown
   */
  setCard(card: CurrentType["card"] | Promise<CurrentType["card"]>): this;
}

export interface ChatBubblesHandable<CurrentType extends BasicAnswerTypes> {
  /**
   * Add multiple texts as seperate text-bubbles
   * @param chatBubbles Array of texts to shown as Bubbles
   */
  setChatBubbles(chatBubbles: CurrentType["chatBubbles"] | Promise<CurrentType["chatBubbles"]>): this;
}

export interface AuthenticationHandable {
  /**
   * Sets the current Session as Unauthenticated.
   */
  setUnauthenticated(): this;
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
export type BasicSessionHandable<B extends BasicAnswerTypes> = BasicHandable<B> & SessionHandable<B>;
