import { Constructor, MinimalRequestExtraction, Mixin, RequestContext } from "../../../../assistant-source";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes, BasicHandable, ResponseHandlerExtensions, SessionHandable } from "../handler-types";

export function SessionDataMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<SessionHandable<CustomTypes>> & CustomHandlerConstructor {
  abstract class SessionData extends superHandler implements SessionHandable<CustomTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    /**
     * Adds Data to session
     *
     * Most of the time it is better to use the @see {@link Session}-Implementation, as the Session-Implemention will set it automatically to the handler
     * or use another SessionStorage like Redis. And it has some more features.
     */
    public setSessionData(sessionData: CustomTypes["sessionData"] | Promise<CustomTypes["sessionData"]>): this {
      this.promises.sessionData = { resolver: sessionData };

      return this;
    }

    /**
     * gets the current SessionData as Promise or undefined if no session is set
     */
    public getSessionData(): Promise<CustomTypes["sessionData"]> | undefined {
      return this.promises.sessionData ? Promise.resolve(this.promises.sessionData.resolver) : undefined;
    }

    protected abstract getBody(results: Partial<CustomTypes>);
  }

  return SessionData;
}
