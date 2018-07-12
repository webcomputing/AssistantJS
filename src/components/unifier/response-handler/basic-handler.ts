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
    const promiseKeys: string[] = [];
    for (const key in this.promises) {
      if (this.promises.hasOwnProperty(key)) {
        promiseKeys.push(key);
      }
    }

    const concurrentProcesses = promiseKeys.map(async (key: string) => {
      const currentKey = key as keyof BasicAnswerTypes;
      const resolver = this.promises[currentKey];
      if (resolver) {
        const currentValue = await Promise.resolve(resolver.resolver);

        if (resolver.thenMap) {
          const finalResult = resolver.thenMap.bind(this)(currentValue);
          this.results[currentKey] = finalResult;
        } else {
          this.results[currentKey] = currentValue;
        }
      }
    });

    await Promise.all(concurrentProcesses);

    this.sendResults(this.results);
    this.isSent = true;
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

    if (reprompts && reprompts.length > 0) {
      this.promises.reprompts = this.getRepromptArrayRemapper(reprompts);
    }

    return this;
  }

  public setReprompts(reprompts: Array<B["prompt"]["text"] | Promise<B["prompt"]["text"]>> | Promise<Array<B["prompt"]["text"]>>): this {
    if (Array.isArray(reprompts)) {
      this.promises.reprompts = this.getRepromptArrayRemapper(reprompts);
    } else {
      this.promises.reprompts = {
        resolver: Promise.resolve(reprompts),
        thenMap: this.createRepromptAnswerArray,
      };
    }

    return this;
  }

  public setSuggestionChips(suggestionChips: B["suggestionChips"] | Promise<B["suggestionChips"]>): this {
    this.promises.suggestionChips = { resolver: suggestionChips };
    return this;
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

  private createPromptAnswer(text: string): BasicAnswerTypes["prompt"] {
    return {
      text,
      isSSML: BasicHandler.isSSML(text),
    };
  }

  private getRepromptArrayRemapper(
    reprompts: Array<B["prompt"]["text"] | Promise<B["prompt"]["text"]>>
  ): {
    resolver: Promise<Array<B["prompt"]["text"]>>;
    thenMap: (finaleReprompts: Array<B["prompt"]["text"]>) => B["reprompts"];
  } {
    return {
      resolver: Promise.all(reprompts),
      thenMap: this.createRepromptAnswerArray,
    };
  }

  private createRepromptAnswerArray(finalReprompts: string[]) {
    return finalReprompts.map(this.createPromptAnswer);
  }

  private static isSSML(text: string) {
    return text.includes("</") || text.includes("/>");
  }
}
