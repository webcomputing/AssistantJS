export function swapHash(configHash) {
  const result = {};
  Object.keys(configHash).forEach(parameterType => {
    configHash[parameterType].forEach(parameter => {
      result[parameter] = parameterType;
    });
  });
  return result;
}
