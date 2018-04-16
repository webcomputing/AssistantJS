import * as generateUtterances from "alexa-utterances"; // We are only using alexa-independet stuff here
import { arraySplitter } from "./array-returns-sample.plugin";

export const processor = {
  type: "postProcessor",
  name: "parseTemplateLanguage",
  process(value: string, key, options, translator) {
    // Get already split-up values
    let dialogOptions = value.split(arraySplitter);

    // Parse language strings out of templates (respecting alternatives like "{Can I|May I} help you?")
    dialogOptions = dialogOptions
      // conert {{param}} into {-|param} for alexa-utterances
      .map(templateString => templateString.replace(/\{\{(\w+)\}\}/g, (_match, param) => "{-|" + param + "}"))
      .map(templateString => generateUtterances(templateString))
      .reduce((prev, curr) => prev.concat(curr), []);

    // Join with array splitter again to make it usable for other plugins
    return dialogOptions.join(arraySplitter);
  },
};
