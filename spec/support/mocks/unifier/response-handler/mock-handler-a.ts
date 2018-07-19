import { inject, injectable } from "inversify";
import { MinimalRequestExtraction } from "../../../../../src/assistant-source";
import { RequestContext } from "../../../../../src/components/root/public-interfaces";
import { BasicHandler } from "../../../../../src/components/unifier/response-handler";
import { BasicAnswerTypes, BasicHandable, ResponseHandlerExtensions } from "../../../../../src/components/unifier/response-handler/handler-types";
import { injectionNames } from "../../../../../src/injection-names";

export interface MockHandlerASpecificTypes extends BasicAnswerTypes {
  card: {
    title: string;
    subTitle?: string;
    description: string;
  };
  table: {
    header: string[];
    elements: string[][];
  };
}

export interface MockHandlerASpecificHandable<CustomTypes extends MockHandlerASpecificTypes> extends BasicHandable<CustomTypes> {
  setMockHandlerATable(table: CustomTypes["table"] | Promise<CustomTypes["table"]>): this;
}

@injectable()
export class MockHandlerA<T extends MockHandlerASpecificTypes> extends BasicHandler<T> implements MockHandlerASpecificHandable<T> {
  public readonly specificWhitelist: Array<keyof MockHandlerA<T>> = [
    "setMockHandlerATable",
    "setCard",
    "setChatBubbles",
    "setSessionData",
    "setChatBubbles",
    "setReprompts",
    "setSuggestionChips",
    "setUnauthenticated",
    "setSessionData",
    "getSessionData",
  ];

  constructor(
    @inject(injectionNames.current.requestContext) requestContext: RequestContext,
    @inject(injectionNames.current.extraction) extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.killSessionService) killSession: () => Promise<void>,
    @inject(injectionNames.current.responseHandlerExtensions) responseHandlerExtensions: ResponseHandlerExtensions<T, MockHandlerA<T>>
  ) {
    super(requestContext, extraction, killSession, responseHandlerExtensions);
  }

  public setMockHandlerATable(table: T["table"] | Promise<T["table"]>): this {
    this.promises.table = { resolver: table };
    return this;
  }

  protected getBody(results: Partial<MockHandlerASpecificTypes>): any {
    // return only textMessage here for a specific spec
    return (results.voiceMessage && results.voiceMessage.text) || {};
  }
}
