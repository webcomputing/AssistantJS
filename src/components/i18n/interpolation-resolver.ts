import { inject, injectable, multiInject, optional } from "inversify";
import { injectionNames } from "../../injection-names";
import { Logger } from "../root/public-interfaces";
import { componentInterfaces } from "./component-interfaces";
import { InterpolationResolver as InterpolationResolverInterface, MissingInterpolationExtension } from "./public-interfaces";
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
    if (!translatedValue.includes("~")) {
      return translatedValue;
    }
    const interpolations = translatedValue.split(/(?<=\*~~)(.*?)(?=\~~*)/g, undefined).filter(value => value.includes("~") === false);
    let text = translatedValue;

    for (const interpolation of interpolations) {
      const missingInterpolationExtensionsPromises = this.missingInterpolationExtensions.map(missingInterpolationExtension =>
        missingInterpolationExtension.execute(interpolation, translateHelper)
      );
      const interpolationValues = await Promise.all(missingInterpolationExtensionsPromises);

      for (const value of interpolationValues) {
        if (typeof value !== "undefined") {
          text = translatedValue.replace("*~~" + interpolation + "~~*", value);
          return this.resolveMissingInterpolations(text, translateHelper);
        }
      }
      this.logger.warn(
        `Missing translation interpolation value for {{${interpolation}}}. Neither you nor one of the ${
          this.missingInterpolationExtensions.length
        } registered missingInterpolationExtensions provided a value. Now using "" instead.`
      );

      text = translatedValue.replace("*~~" + interpolation + "~~*", "");
    }
    return this.resolveMissingInterpolations(text, translateHelper);
  }
}
