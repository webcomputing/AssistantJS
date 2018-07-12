import { HandlerFeatureTypes } from "./feature-types";

/**
 * This interface defines the types which can be used on all Handlers
 * Handler should extend this interface to define own specific types.
 * Then multiple interfaces of diffrent Handler can be merged together.
 */
export interface BasicAnswerTypes {
  card: HandlerFeatureTypes.GUI.Card.Simple & Partial<HandlerFeatureTypes.GUI.Card.Image>;
  suggestionChips: HandlerFeatureTypes.GUI.SuggestionChips;
  chatBubbles: HandlerFeatureTypes.GUI.ChatBubbles;
  prompt: {
    text: string;
    isSSML: HandlerFeatureTypes.SSML;
  };
  reprompts: Array<BasicAnswerTypes["prompt"]>;
  sessionData: HandlerFeatureTypes.SessionData;
  shouldAuthenticate: boolean;
  shouldSessionEnd: boolean;
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
   * @param reprompts {optional} If the user does not answer in a given time, these reprompt messages will be used.
   */
  prompt(
    inputText: AnswerType["prompt"]["text"] | Promise<AnswerType["prompt"]["text"]>,
    ...reprompts: Array<AnswerType["prompt"]["text"] | Promise<AnswerType["prompt"]["text"]>>
  ): this; // cannot set type via B["reprompts"] as typescript thinks this type is not an array

  /**
   * Adds voice messages when the User does not answer in a given time
   * @param reprompts {optional} If the user does not answer in a given time, these reprompt messages will be used.
   */
  setReprompts(reprompts: Array<AnswerType["prompt"]["text"] | Promise<AnswerType["prompt"]["text"]>>): this;

  /**
   * Sets the current Session as Unauthenticated.
   */
  setUnauthenticated(): this;

  /**
   * Adds a common Card to all Handlers
   * @param card Card which should be shown
   */
  setCard(card: AnswerType["card"] | Promise<AnswerType["card"]>): this;

  /**
   * Add some sugestions for Devices with a Display after the response is shown and/or read to the user
   * @param suggestionChips Texts to show (mostly) under the previous responses (prompts)
   */
  setSuggestionChips(suggestionChips: AnswerType["suggestionChips"] | Promise<AnswerType["suggestionChips"]>): this;

  /**
   * Add multiple texts as seperate text-bubbles
   * @param chatBubbles Array of texts to shown as Bubbles
   */
  setChatBubbles(chatBubbles: AnswerType["chatBubbles"] | Promise<AnswerType["chatBubbles"]>): this;

  /**
   * End the current session, so the user cannot respond anymore
   * use prompt to set a response message before ending the session
   */
  endSession(): this;

  /**
   * Sends all messages as answer. After sending it is not possible anymore to set or change the answer.
   */
  send(): Promise<void>;

  /**
   * Returns true when @see {send()} has been called, otherwise false
   */
  wasSent(): boolean;
}
