import { State } from "../../../../src/components/state-machine/interfaces";
import { injectable, inject, optional } from "inversify";


@injectable()
export class MainState implements State {
  spy?: Function;

  constructor(@optional() @inject("mocks:states:call-spy") spy: Function) {
    this.spy = spy;
  }

  unhandledIntent(...args: any[]) {
    this.spyIfExistent("unhandled", ...args);
  }

  testIntent(...args: any[]) {
    this.spyIfExistent("test", ...args);
  }

  otherIntent(...args: any[]) {
    this.spyIfExistent("other", ...args);
  }

  yesGenericIntent(...args: any[]) {
    this.spyIfExistent("yes", ...args);
  }

  protected spyIfExistent(methodName: string, ...args: any[]) {
    if (typeof this.spy !== "undefined") {
      this.spy(this, methodName, ...args);
    }
  }
}