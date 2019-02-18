import { inject, injectable } from "inversify";
import { Filter, injectionNames } from "../../../../src/assistant-source";

@injectable()
export class TestFilterC implements Filter {
  private machine;

  constructor(@inject(injectionNames.current.stateMachine) machine) {
    this.machine = machine;
  }
  public async execute() {
    await this.machine.handleIntent("filterTestBIntent");
    return false;
  }
}
