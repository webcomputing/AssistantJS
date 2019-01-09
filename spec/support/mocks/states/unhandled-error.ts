import { inject, injectable, optional } from "inversify";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { BasicHandable } from "../../../../src/components/unifier/response-handler";
import { injectionNames } from "../../../../src/injection-names";

@injectable()
export class UnhandledErrorState implements State.Required {
  public extraction: any;
  public spy?: (...args: any[]) => void;

  constructor(
    @inject(injectionNames.current.responseHandler) responsehandler: BasicHandable<any>,
    @inject(injectionNames.current.extraction) extraction: any,
    @optional()
    @inject("mocks:states:call-spy")
    spy: (...args: any[]) => void
  ) {
    this.extraction = extraction;
    this.spy = spy;
  }

  public async unhandledGenericIntent(...args: any[]) {
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
