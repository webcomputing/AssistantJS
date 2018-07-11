import { BasicHandable } from "./basic-handable";
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
  reprompts: Array<BasicAnswerTypes["prompt"]>;
  sessionData: HandlerFeatureTypes.SessionData;
  shouldAuthenticate: boolean;
  shouldSessionEnd: boolean;
}

export abstract class BasicHandler<B extends BasicAnswerTypes> implements BasicHandable<B> {
  protected promises: {
    [key in keyof B]?: {
      resolver: Promise<any> | Promise<B[key]> | B[key];
      thenMap?: (value: any) => B[key]; // todo conditional type when it is possible to reference the type of the property "resolver"
    }
  } = {} as any;

  private results: { [key in keyof B]?: B[key] } = {} as any;

  private isSent: boolean = false;

  public async send(): Promise<void> {
    this.isSent = true;

    // todo

    this.sendResults({} as any); // todo
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

  public prompt(inputText: B["prompt"]["text"] | Promise<B["prompt"]["text"]>, ...reprompts: Array<B["prompt"]["text"] | Promise<B["prompt"]["text"]>>): this {
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

  public setReprompts(reprompts: Array<B["prompt"]["text"] | Promise<B["prompt"]["text"]>>): this {
    throw new Error("Method not implemented.");
  }

  public setSuggestionChips(suggestionChips: B["suggestionChips"] | Promise<B["suggestionChips"]>): this {
    throw new Error("Method not implemented.");
  }

  public setChatBubbles(chatBubbles: B["chatBubbles"] | Promise<B["chatBubbles"]>): this {
    this.promises.chatBubbles = { resolver: chatBubbles };
    return this;
  }

  public setCard(card: B["card"] | Promise<B["card"]>): this {
    this.promises.card = { resolver: card };
    return this;
  }

  protected abstract sendResults(results: Partial<B>): void;

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
