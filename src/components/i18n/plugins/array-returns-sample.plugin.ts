export const processor = {
  type: "postProcessor",
  name: "arrayReturnsSample",
  process(value: string, key, options, translator) {
    const dialogOptions = value.split(arraySplitter);

    if (dialogOptions.length === 1) return value;
    return dialogOptions[Math.floor(Math.random() * dialogOptions.length)]; // Returns random element
  },
};

export const arraySplitter = "||||||||||||||||||||||||||||||";
