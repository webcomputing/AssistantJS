import { inject, injectable } from "inversify";
import { RequestContext } from "../../../../../src/components/root/public-interfaces";
import { BasicHandler } from "../../../../../src/components/unifier/response-handler";
import { BasicAnswerTypes, BasicHandable, ResponseHandlerExtensions } from "../../../../../src/components/unifier/response-handler/handler-types";
import { injectionNames } from "../../../../../src/injection-names";
import { MockHandlerASpecificHandable } from "./mock-handler-a";

export interface MockHandlerBSpecificTypes extends BasicAnswerTypes {
  card: {
    title: string;
    description: string;
  };
  list: {
    elements: Array<{ title: string }>;
  };
}

export interface MockHandlerBSpecificHandable<CustomTypes extends MockHandlerBSpecificTypes> extends BasicHandable<CustomTypes> {
  setMockHandlerBList(list: CustomTypes["list"]): this;
}

@injectable()
export class MockHandlerB<T extends MockHandlerBSpecificTypes> extends BasicHandler<T> implements MockHandlerBSpecificHandable<T> {
  public readonly specificWhitelist: Array<keyof MockHandlerB<T>> = ["setCard", "setChatBubbles", "setReprompts", "setSuggestionChips", "setUnauthenticated"];

  constructor(
    @inject(injectionNames.current.requestContext) extraction: RequestContext,
    @inject(injectionNames.current.killSessionService) killSession: () => Promise<void>,
    @inject(injectionNames.current.responseHandlerExtensions) responseHandlerExtensions: ResponseHandlerExtensions<T, MockHandlerB<T>>
  ) {
    super(extraction, killSession, responseHandlerExtensions);
  }

  public setMockHandlerBList(list: T["list"]): this {
    this.promises.list = { resolver: list };
    return this;
  }

  protected getBody(results: Partial<MockHandlerBSpecificTypes>): void {
    // do nothing here
  }
}
