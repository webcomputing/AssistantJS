import { Constructor, MinimalRequestExtraction, Mixin, RequestContext } from "../../../../assistant-source";
import { BasicHandler } from "../basic-handler";
import { AuthenticationHandable, BasicAnswerTypes, BasicHandable, ResponseHandlerExtensions, SessionHandable } from "../handler-types";

export function AuthenticationMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<AuthenticationHandable> & CustomHandlerConstructor {
  abstract class AuthenticationHandler extends superHandler implements AuthenticationHandable {
    constructor(...args: any[]) {
      super(...args);
    }

    public setAuthentication(card: CustomTypes["card"] | Promise<CustomTypes["card"]>): this {
      this.promises.card = { resolver: card };
      return this;
    }

    protected abstract getBody(results: Partial<CustomTypes>);
  }

  return AuthenticationHandler;
}
