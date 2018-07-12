import { BasicHandler } from "../../../../../src/components/unifier/response-handler";
import { BasicAnswerTypes } from "../../../../../src/components/unifier/response-handler/handler-types";

export interface MockHandlerBSpecificTypes extends BasicAnswerTypes {
  card: {
    title: string;
    description: string;
  };
  list: {
    elements: Array<{ title: string }>;
  };
}

export interface MockHandlerBSpecificHandable {
  addMockHandlerBList(list: MockHandlerBSpecificTypes["list"]): this;
}

export class MockHandlerB<T extends MockHandlerBSpecificTypes> extends BasicHandler<MockHandlerBSpecificTypes> implements MockHandlerBSpecificHandable {
  public readonly specificWhitelist: Array<keyof MockHandlerB<T>> = ["setCard", "setChatBubbles", "setReprompts", "setSuggestionChips", "setUnauthenticated"];

  public addMockHandlerBList(list: T["list"]): this {
    this.promises.list = {
      resolver: list,
    };
    return this;
  }

  protected sendResults(results: Partial<MockHandlerBSpecificTypes>): void {
    // do nothing here
  }
}
