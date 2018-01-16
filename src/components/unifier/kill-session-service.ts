import { inject, injectable } from "inversify";
import { Hooks } from "inversify-components";
import { componentInterfaces } from "./interfaces";
import { Logger } from "../root/interfaces";
import { DestroyableSession } from "../services/interfaces";

/** Destroys redis session after session ended */
@injectable()
export class KillSessionService {

  constructor(
    @inject("core:unifier:current-session-factory") public sessionFactory: () => DestroyableSession,
    @inject("core:hook-pipe-factory") public pipeFactory: Hooks.PipeFactory,
    @inject("core:root:current-logger") public logger: Logger
  ) {}

  async execute() {
      let currentSession = this.sessionFactory();

      // Create hook pipes
      const beforeKillSessionHooks = this.pipeFactory(componentInterfaces.beforeKillSession).withArguments(currentSession);
      const afterKillSessionHooks = this.pipeFactory(componentInterfaces.afterKillSession).withArguments(currentSession);

      // Result of all beforeKillSessionHooks in filter mode
      const filterResult = await beforeKillSessionHooks.runAsFilter();

      // Kill session if all hooks ended successful
      if (filterResult.success) {
        // Kill session
        await currentSession.delete();
        this.logger.info("Session killed.");

        // Run afterKillSessionHooks
        await afterKillSessionHooks.runWithResultset();
      } else {
        this.logger.info("Not killing session since one of your did not return a successful result.");
      }
  }
}