export const processor = {
  type: "postProcessor",
  name: "arrayReturnsSample",

  // tslint:disable-next-line:variable-name
  process(value: string, _key, options, _translator) {
    const dialogOptions = value.split(arraySplitter);

    // Return all dialog options if called by getAllAlternatives()
    if (options && options[optionsObjectName] && options[optionsObjectName][optionEnablingArrayReturn] === true) {
      // Return it joined with arraySplitter to make is usable by other plugins
      return dialogOptions.join(arraySplitter);
    }

    if (dialogOptions.length === 1) return value;

    // Return sample option as default
    return dialogOptions[Math.floor(Math.random() * dialogOptions.length)]; // Returns random element
  },
};

export const arraySplitter = "||||||||||||||||||||||||||||||";
export const optionsObjectName = "__assistantJsOptions";
export const optionEnablingArrayReturn = "enableArrayReturn";
