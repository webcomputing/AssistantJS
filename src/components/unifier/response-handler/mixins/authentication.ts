import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add Authentication-Feature
 */
export function AuthenticationMixin<MergedAnswerTypes extends BasicAnswerTypes, MergedHandlerConstructor extends Constructor<BasicHandler<MergedAnswerTypes>>>(
  superHandler: MergedHandlerConstructor
): Mixin<OptionalHandlerFeatures.Authentication> & MergedHandlerConstructor {
  abstract class AuthenticationHandler extends superHandler implements OptionalHandlerFeatures.Authentication {
    constructor(...args: any[]) {
      super(...args);
    }

    public setUnauthenticated(): this {
      this.failIfInactive();

      this.promises.shouldAuthenticate = { resolver: true };
      return this;
    }

    protected abstract getBody(results: Partial<MergedAnswerTypes>): any;
  }

  return AuthenticationHandler;
}