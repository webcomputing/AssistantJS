import { inject, injectable, optional } from "inversify";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { ResponseFactory } from "../../../../src/components/unifier/public-interfaces";

@injectable()
export class UnhandledErrorState implements State.Required {
  public responseFactory: ResponseFactory;
  public extraction: any;
  public spy?: Function;

  constructor(
    @inject("core:unifier:current-response-factory") responseFactory: ResponseFactory,
    @inject("core:unifier:current-extraction") extraction: any,
    @optional()
    @inject("mocks:states:call-spy")
    spy: Function
  ) {
    this.extraction = extraction;
    this.spy = spy;
    this.responseFactory = responseFactory;
  }

  public unhandledGenericIntent(...args: any[]) {
    this.spyIfExistent("unhandled", ...args);
    throw new Error("Error");
  }

  public unansweredGenericIntent(...args: any[]) {
    this.spyIfExistent("unanswered", ...args);
  }

  protected spyIfExistent(methodName: string, ...args: any[]) {
    if (typeof this.spy !== "undefined") {
      this.spy(this, methodName, ...args);
    }
  }
}
