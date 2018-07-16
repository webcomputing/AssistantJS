import { inject, injectable } from "inversify";
import { injectionNames } from "../../../injection-names";
import { AfterStateMachine } from "../../state-machine/public-interfaces";
import { BasicHandler } from "./basic-handler";

/**
 * This class is an Extension of the AfterState Extension Point. It sends all Messages which were not sent in the
 */
@injectable()
export class AfterStateResponseSender implements AfterStateMachine {
  constructor(@inject(injectionNames.current.responseHandler) private handler: BasicHandler<any>) {}

  public execute(): void | Promise<void> {
    if (!this.handler.wasSent()) {
      this.handler.send();
    }
  }
}
