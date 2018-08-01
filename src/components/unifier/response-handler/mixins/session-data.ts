import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add SessionData-Feature
 */
export function SessionDataMixin<MergedAnswerTypes extends BasicAnswerTypes, MergedHandlerConstructor extends Constructor<BasicHandler<MergedAnswerTypes>>>(
  superHandler: MergedHandlerConstructor
): Mixin<OptionalHandlerFeatures.SessionData<MergedAnswerTypes>> & MergedHandlerConstructor {
  abstract class SessionData extends superHandler implements OptionalHandlerFeatures.SessionData<MergedAnswerTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    /**
     * Adds Data to session
     *
     * Most of the time it is better to use the @see {@link Session}-Implementation, as the Session-Implemention will set it automatically to the handler
     * or use another SessionStorage like Redis. And it has some more features.
     */
    public setSessionData(sessionData: MergedAnswerTypes["sessionData"] | Promise<MergedAnswerTypes["sessionData"]>): this {
      this.failIfInactive();

      this.promises.sessionData = { resolver: sessionData };

      return this;
    }

    /**
     * gets the current SessionData as Promise or undefined if no session is set
     */
    public getSessionData(): Promise<MergedAnswerTypes["sessionData"]> | undefined {
      return this.promises.sessionData ? Promise.resolve(this.promises.sessionData.resolver) : undefined;
    }

    protected abstract getBody(results: Partial<MergedAnswerTypes>): any;
  }

  return SessionData;
}
