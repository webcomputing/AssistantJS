import { State } from "../../../../src/components/state-machine/interfaces";
import { ResponseFactory } from "../../../../src/components/unifier/interfaces";
import { injectable, inject, optional } from "inversify";


@injectable()
export class UnhandledErrorState implements State {
  responseFactory: ResponseFactory;
  extraction: any;
  spy?: Function;

  constructor(
    @inject("core:unifier:current-response-factory") responseFactory: ResponseFactory,
    @inject("core:unifier:current-extraction") extraction: any,
    @optional() @inject("mocks:states:call-spy") spy: Function
  ) {
    this.extraction = extraction;
    this.spy = spy;
    this.responseFactory = responseFactory;
  }

  unhandledIntent(...args: any[]) {
    this.spyIfExistent("unhandled", ...args);
    throw new Error("Error");
  }

  protected spyIfExistent(methodName: string, ...args: any[]) {
    if (typeof this.spy !== "undefined") {
      this.spy(this, methodName, ...args);
    }
  }
}