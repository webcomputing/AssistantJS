import { State } from "../../../../src/components/state-machine/interfaces";
import { injectable, optional, inject } from "inversify";


@injectable()
export class SecondState implements State {
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

  noGenericIntent(...args: any[]) {
    this.spyIfExistent("no", ...args);
  }

  errorIntent(...args: any[]) {
    this.spyIfExistent("error", ...args);
    throw new Error("Error!");
  }

  protected spyIfExistent(methodName: string, ...args: any[]) {
    if (typeof this.spy !== "undefined") {
      this.spy(this, methodName, ...args);
    }
  }
}