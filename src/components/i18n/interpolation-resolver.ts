import { InterpolationResolver as InterpolationResolverInterface, MissingInterpolationExtension } from "./public-interfaces";
import { inject, optional, multiInject, injectable } from "inversify";
import { componentInterfaces } from "./component-interfaces";
import { Logger } from "../root/public-interfaces";
import { injectionNames } from "../../injection-names";
import { TranslateHelper } from "./translate-helper";

@injectable()
export class InterpolationResolver implements InterpolationResolverInterface {
  constructor(
    @inject(injectionNames.logger) public logger: Logger,
    @optional()
    @multiInject(componentInterfaces.missingInterpolation)
    private missingInterpolationExtensions: MissingInterpolationExtension[]
  ) {
    if (typeof missingInterpolationExtensions === "undefined") {
      // tslint:disable-next-line:no-parameter-reassignment
      missingInterpolationExtensions = [];
    }
  }

  /**
   * resolves all missing interpolations in the given translation iteratively by executing missingInterpolation extensions
   * @param translatedValue text containing missing interpolations
   */
  public async resolveMissingInterpolations(translatedValue: string, translateHelper: TranslateHelper): Promise<string> {
    while (translatedValue.includes("*~~") && translatedValue.includes("~~*")) {
      const interpolation = translatedValue.split("*~~")[1].split("~~*")[0];
      let interpolationValue: string | undefined;

      for (let missingInterpolationExtension of this.missingInterpolationExtensions) {
        interpolationValue = await missingInterpolationExtension.execute(interpolation, translateHelper);

        if (typeof interpolationValue !== "undefined") {
          translatedValue = translatedValue.replace("*~~" + interpolation + "~~*", interpolationValue);
          break;
        }
      }

      if (typeof interpolationValue === "undefined") {
        this.logger.warn(
          `Missing translation interpolation value for {{${interpolation}}}. Neither you nor one of the
          ${this.missingInterpolationExtensions.length} registered missingInterpolationExtensions provided a value. Now using "" instead.`
        );

        translatedValue = translatedValue.replace("*~~" + interpolation + "~~*", "");
      }
    }
    return translatedValue;
  }
}
