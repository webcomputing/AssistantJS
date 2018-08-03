import { BasicHandler } from "../../../../../src/components/unifier/response-handler";
import { BasicAnswerTypes } from "../../../../../src/components/unifier/response-handler/handler-types";

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

export interface MockHandlerASpecificHandable {
  setMockHandlerATable(table: MockHandlerASpecificTypes["table"] | Promise<MockHandlerASpecificTypes["table"]>): this;
}

export class MockHandlerA<T extends MockHandlerASpecificTypes> extends BasicHandler<MockHandlerASpecificTypes> implements MockHandlerASpecificHandable {
  public readonly specificWhitelist: Array<keyof MockHandlerA<T>> = ["setMockHandlerATable", "setCard", "setChatBubbles"];

  public setMockHandlerATable(table: T["table"] | Promise<T["table"]>): this {
    this.promises.table = { resolver: table };
    return this;
  }

  protected sendResults(results: Partial<MockHandlerASpecificTypes>): void {
    // do nothing here
  }
}
