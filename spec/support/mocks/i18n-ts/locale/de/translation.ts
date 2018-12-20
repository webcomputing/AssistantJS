export default {
  mySpecificKeys: {
    keyOne: "keyOneResult",
  },
  multiple: ["a", "b"],
  var: "a{{var}}",
  multipleVars: "a{{firstVar}}b{{secondVar}}c{{thirdVar}}",
  deviceDependentState: {
    ExtractorComponent: {
      device1: "state-platform-device-specific",
    },
  },
  root: {
    testIntent: {
      embedded: {
        platformDependent: {
          ExtractorComponent: "platform-specific-embedded",
        },
        platformIndependent: "platform-independent-root-embedded",
      },
      withoutExtractor: "root-without-extractor",
      deviceDependent: {
        ExtractorComponent: {
          device1: "root-intent-platform-device-specific",
        },
      },
    },
    secondPlatformSpecificIntent: {
      ExtractorComponent: "root-platform-specific-intent",
    },
    yesGenericIntent: "root-yes",
    rootKey: {
      ExtractorComponent: "platform-specific-root-only",
    },
    ExtractorComponent: "root-only-platform-given",
  },
  noIntentState: "stateOnly",
  templateSyntax: ["{Can|May} I help you, {{var}}?", "Would you like me to help you?"],
  filter: {
    stateA: {
      intentA: "FilterAState - filterTestAIntent",
      intentB: "FilterAState - filterTestBIntent",
      intentC: "FilterAState - filterTestCIntent",
      intentD: "FilterAState - filterTestDIntent",
    },
    stateB: {
      intentA: "FilterBState - filterTestAIntent",
      intentB: "FilterBState - filterTestBIntent",
    },
    stateC: {
      intentA: "FilterCState - filterTestAIntent",
      intentB: "FilterCState - filterTestBIntent",
    },
  },
  noInterpolation: "no interpolation",
};
