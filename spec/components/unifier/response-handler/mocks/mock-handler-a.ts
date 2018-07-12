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
  addMockHandlerATable(table: MockHandlerASpecificTypes["table"] | Promise<MockHandlerASpecificTypes["table"]>): this;
}

export class MockHandlerA<T extends MockHandlerASpecificTypes> extends BasicHandler<MockHandlerASpecificTypes> implements MockHandlerASpecificHandable {
  public addMockHandlerATable(table: T["table"] | Promise<T["table"]>): this {
    this.promises.table = { resolver: table };
    return this;
  }

  protected sendResults(results: Partial<MockHandlerASpecificTypes>): void {
    // do nothing here
  }
}
