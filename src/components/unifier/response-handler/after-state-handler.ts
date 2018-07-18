import { inject, injectable } from "inversify";
import { injectionNames } from "../../../injection-names";
import { AfterStateMachine } from "../../state-machine/public-interfaces";
import { BasicHandable } from "../public-interfaces";

/**
 * This class is an Extension of the AfterState Extension Point. It sends all Messages which were not sent in the
 */
@injectable()
export class AfterStateResponseSender implements AfterStateMachine {
  constructor(@inject(injectionNames.current.responseHandler) private handler: BasicHandable<any>) {}

  public execute(): void | Promise<void> {
    if (!this.handler.wasSent()) {
      this.handler.send();
    }
  }
}
