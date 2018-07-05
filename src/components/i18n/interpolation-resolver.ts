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
    let resolvedText = translatedValue;

    /** return if translatedValue does not contain any further interpolations */
    if (!translatedValue.includes("*~~")) {
      return resolvedText;
    }

    /** fill missing interpolations in parallel */
    const matches = translatedValue.match(/\*~~(.*?)~~\*/g);
    const interpolations = matches !== null ? matches.map(match => match.replace("*~~", "").replace("~~*", "")) : [];

    /** returns a promise for a given interpolation which contains an object containing the interpolation plus the value it needs to be replaced with */
    const perMissingInterpolation = async (interpolation: string): Promise<{ interpolation: string; replacement: string }> => {
      const missingInterpolationExtensionsPromises = this.missingInterpolationExtensions.map(missingInterpolationExtension =>
        missingInterpolationExtension.execute(interpolation, translateHelper)
      );
      const interpolationValues = await Promise.all(missingInterpolationExtensionsPromises);

      /** filter for values of missingInterpolationExtensions */
      const possibleValues = interpolationValues.filter(value => typeof value !== "undefined");
      let replacement: string;

      if (possibleValues.length > 0) {
        /** use first value to fill the missing interpolation */
        replacement = possibleValues[0] as string;
        /** if value contains futher interpolations call this method recursively */
        if (replacement.includes("*~~")) {
          replacement = await this.resolveMissingInterpolations(replacement, translateHelper);
        }
      } else {
        this.logger.warn(
          `Missing translation interpolation value for {{${interpolation}}}. Neither you nor one of the ${
            this.missingInterpolationExtensions.length
          } registered missingInterpolationExtensions provided a value. Now using "" instead.`
        );
        replacement = "";
      }

      return { interpolation, replacement };
    };

    /** wait for all interpolations to be resolved */
    const resultSets = await Promise.all(interpolations.map(perMissingInterpolation));

    /** replace interpolations in given Text with replacements */
    resultSets.forEach(set => {
      resolvedText = translatedValue.replace("*~~" + set.interpolation + "~~*", set.replacement);
    });

    return resolvedText;
  }
}
