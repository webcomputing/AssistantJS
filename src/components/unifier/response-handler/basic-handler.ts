import { HandlerFeatureTypes } from "./feature-types";

/**
 * This interface defines the types which are used on all Handlers
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
  repromt: BasicAnswerTypes["prompt"];
  reprompts: Array<BasicAnswerTypes["repromt"]>;
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
    ...reprompts: Array<AnswerType["repromt"]["text"] | Promise<AnswerType["prompt"]["text"]>>
  ): this; // cannot set type via B["reprompts"] as typescript thinks this type is not an array

  /**
   * Adds voice messages when the User does not answer in a given time
   * @param reprompts {optional} If the user does not answer in a given time, these reprompt messages will be used.
   */
  setReprompts(reprompts: Array<AnswerType["repromt"]["text"] | Promise<AnswerType["prompt"]["text"]>>): this;

  /**
   * Sets the current Session as Unauthenticated.
   */
  setUnauthenticated(): this;

  /**
   * Adds a common Card to all Handlers
   * @param card Card which should be shown
   */
  setCard(card: AnswerType["card"]): this;

  /**
   * Add some sugestions for Devices with a Display after the response is shown and/or read to the user
   * @param suggestionChips Texts to show (mostly) under the previous responses (prompts)
   */
  setSuggestionChips(suggestionChips: AnswerType["suggestionChips"]): this;

  /**
   * Add multiple texts as seperate text-bubbles
   * @param chatBubbles Array of texts to shown as Bubbles
   */
  setChatBubbles(chatBubbles: AnswerType["chatBubbles"]): this;

  /**
   * End the current session, so the user cannot respond anymore
   * use prompt to set a response message before ending the session
   */
  endSession(): this;

  /**
   * Sends all messages as answer. After sending it is not possible anymore to set or change the answer.
   */
  send(): void | Promise<void>;

  /**
   * Returns true when @see {send()} has been called, otherwise false
   */
  wasSent(): boolean;
}

export abstract class BasicHandler<B extends BasicAnswerTypes> implements BasicHandable<B> {
  private promises: {
    [key in keyof B]?: {
      resolver: Promise<any> | Promise<B[key]> | B[key];
      thenMap?: (value: any) => B[key]; // todo conditional type when it is possible to reference the type of the property "resolver"
    }
  } = {} as any;

  private results: { [key in keyof B]?: B[key] } = {} as any;

  private isSent: boolean = false;

  public send(): void {
    this.isSent = true;

    // todo

    this.sendResults();
    throw new Error("Method not implemented.");
  }

  public wasSent(): boolean {
    return this.isSent;
  }

  public setUnauthenticated(): this {
    this.promises.shouldAuthenticate = { resolver: true };
    return this;
  }

  public endSession(): this {
    this.promises.shouldSessionEnd = { resolver: true };
    return this;
  }

  public prompt(
    inputText: B["prompt"]["text"] | Promise<B["prompt"]["text"]>,
    ...reprompts: Array<B["repromt"]["text"] | Promise<B["repromt"]["text"]>>
  ): this {
    this.promises.prompt = {
      resolver: Promise.resolve(inputText),
      thenMap: this.createPromptAnswer,
    };

    this.promises.reprompts = {
      resolver: Promise.all(reprompts),
      thenMap: (finalReprompts: string[]) => {
        return finalReprompts.map(this.createPromptAnswer);
      },
    };
    return this;
  }

  public setReprompts(reprompts: Array<B["repromt"]["text"]>): this {
    throw new Error("Method not implemented.");
  }

  public setSuggestionChips(suggestionChips: B["suggestionChips"]): this {
    throw new Error("Method not implemented.");
  }

  public setChatBubbles(chatBubbles: B["chatBubbles"]): this {
    throw new Error("Method not implemented.");
  }

  public setCard(card: B["card"]): this {
    throw new Error("Method not implemented.");
  }

  protected abstract sendResults();

  private isSSML(text: string) {
    return text.includes("</") || text.includes("/>");
  }

  private createPromptAnswer(text: string): BasicAnswerTypes["prompt"] {
    return {
      text,
      isSSML: this.isSSML(text),
    };
  }
}
