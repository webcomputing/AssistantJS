import { inject, injectable } from "inversify";
import { Hooks } from "inversify-components";
import { componentInterfaces } from "./interfaces";
import { DestroyableSession } from "../services/interfaces";
import { log } from "../../setup";

/** Destroys redis session after session ended */
@injectable()
export class KillSessionService {
  sessionFactory: () => DestroyableSession;
  pipeFactory: Hooks.PipeFactory;

  constructor(
    @inject("core:unifier:current-session-factory") sessionFactory,
    @inject("core:hook-pipe-factory") pipeFactory: Hooks.PipeFactory
  ) {
    this.sessionFactory = sessionFactory;
    this.pipeFactory = pipeFactory;
  }

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
        log("Session killed.");

        // Run afterKillSessionHooks
        await afterKillSessionHooks.runWithResultset();
      } else {
        log("Not killing session since one of your did not return a successful result.");
      }
  }
}