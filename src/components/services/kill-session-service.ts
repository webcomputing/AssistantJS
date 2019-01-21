import { inject, injectable } from "inversify";
import { Hooks } from "inversify-components";
import { injectionNames } from "../../injection-names";
import { Logger } from "../root/public-interfaces";
import { componentInterfaces } from "./private-interfaces";
import { Session } from "./public-interfaces";

/** Destroys (redis-) session after session ended */
@injectable()
export class KillSessionService {
  constructor(
    @inject(injectionNames.current.sessionFactory) public sessionFactory: () => Session,
    @inject(injectionNames.hookPipeFactory) public pipeFactory: Hooks.PipeFactory,
    @inject(injectionNames.current.logger) public logger: Logger
  ) {}

  public async execute() {
    const currentSession = this.sessionFactory();

    // Create hook pipes
    const beforeKillSessionHooks = this.pipeFactory(componentInterfaces.beforeKillSession).withArguments(currentSession);
    const afterKillSessionHooks = this.pipeFactory(componentInterfaces.afterKillSession).withArguments(currentSession);

    // Result of all beforeKillSessionHooks in filter mode
    const filterResult = await beforeKillSessionHooks.runAsFilter();

    // Kill session if all hooks ended successful
    if (filterResult.success) {
      // Kill session
      await currentSession.deleteAllFields();
      this.logger.info("Session killed.");

      // Run afterKillSessionHooks
      await afterKillSessionHooks.runWithResultset();
    } else {
      this.logger.info("Not killing session since one of your did not return a successful result.");
    }
  }
}
