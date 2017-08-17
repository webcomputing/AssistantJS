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
    return new Promise((resolve, reject) => {
      let currentSession = this.sessionFactory();

      // Create hook pipes
      const beforeKillSessionHooks = this.pipeFactory(componentInterfaces.beforeKillSession).withArguments(currentSession);
      const afterKillSessionHooks = this.pipeFactory(componentInterfaces.afterKillSession).withArguments(currentSession);

      /** Called if call beforeKillSession hooks are finished */
      const finishedBeforeCallbacks = (killSession: boolean) => {
        return () => {
          let sessionKilled = Promise.resolve();

          if (killSession) {
            sessionKilled = currentSession.delete().then(() => log("Session killed."));
          } else {
            log("Not killing session since one of your hooks did not call success().");
          }

          sessionKilled.then(() => afterKillSessionHooks.runWithResultset(() => {
            resolve();
          }));
        };
      }

      // Trigger process by executing beforeKillSession hooks
      beforeKillSessionHooks.runAsFilter(finishedBeforeCallbacks(true), finishedBeforeCallbacks(false));
    });
  }
}