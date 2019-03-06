import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add Authentication-Feature
 */
export class AuthenticationMixin<MergedAnswerTypes extends BasicAnswerTypes> extends BasicHandler<MergedAnswerTypes>
  implements OptionalHandlerFeatures.Authentication {
  public setUnauthenticated(): this {
    return this.setResolverAndReturnThis("shouldAuthenticate", true);
  }
}
