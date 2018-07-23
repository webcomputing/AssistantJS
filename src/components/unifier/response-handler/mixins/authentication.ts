import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add Authentication-Feature
 */
export function AuthenticationMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<OptionalHandlerFeatures.Authentication> & CustomHandlerConstructor {
  abstract class AuthenticationHandler extends superHandler implements OptionalHandlerFeatures.Authentication {
    constructor(...args: any[]) {
      super(...args);
    }

    public setUnauthenticated(): this {
      this.promises.shouldAuthenticate = { resolver: true };
      return this;
    }

    protected abstract getBody(results: Partial<CustomTypes>): any;
  }

  return AuthenticationHandler;
}
