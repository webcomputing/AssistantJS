import { inject, injectable, optional } from "inversify";
import { State } from "../../../../src/components/state-machine/public-interfaces";

@injectable()
export class SecondState implements State.Required {
  public spy?: Function;

  constructor(
    @optional()
    @inject("mocks:states:call-spy")
    spy: Function
  ) {
    this.spy = spy;
  }

  public unhandledGenericIntent(...args: any[]) {
    this.spyIfExistent("unhandled", ...args);
  }

  public unansweredGenericIntent(...args: any[]) {
    this.spyIfExistent("unanswered", ...args);
  }

  public testIntent(...args: any[]) {
    this.spyIfExistent("test", ...args);
  }

  public noGenericIntent(...args: any[]) {
    this.spyIfExistent("no", ...args);
  }

  public errorIntent(...args: any[]) {
    this.spyIfExistent("error", ...args);
    throw new Error("Error!");
  }

  protected spyIfExistent(methodName: string, ...args: any[]) {
    if (typeof this.spy !== "undefined") {
      this.spy(this, methodName, ...args);
    }
  }
}
