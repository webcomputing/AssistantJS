import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add SessionData-Feature
 */
export class SessionDataMixin<MergedAnswerTypes extends BasicAnswerTypes> extends BasicHandler<MergedAnswerTypes>
  implements OptionalHandlerFeatures.SessionData<MergedAnswerTypes> {
  /**
   * Adds Data to session
   *
   * Most of the time it is better to use the @see {@link Session}-Implementation, as the Session-Implemention will set it automatically to the handler
   * or use another SessionStorage like Redis. And it has some more features.
   */
  public setSessionData(sessionData: MergedAnswerTypes["sessionData"] | Promise<MergedAnswerTypes["sessionData"]>): this {
    return this.setResolverAndReturnThis("sessionData", sessionData);
  }

  /**
   * gets the current SessionData as Promise or undefined if no session is set
   */
  public getSessionData(): Promise<MergedAnswerTypes["sessionData"]> | undefined {
    return this.promises.sessionData ? Promise.resolve(this.promises.sessionData.resolver) : undefined;
  }
}
