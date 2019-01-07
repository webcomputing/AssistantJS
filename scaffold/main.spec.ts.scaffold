import { MainState } from "../../../app/states/main";
import { ThisContext } from "../../support/this-context";

interface CurrentThisContext extends ThisContext {
  currentState: MainState;
}

describe("MainState", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
  });

  describe("#invokeGenericIntent", function() {
    beforeEach(async function(this: CurrentThisContext) {
      await this.specHelper.prepareIntentCall(this.platforms.alexa, "invokeGenericIntent"); // TODO: this.platforms.alexa doesn't exist yet, see setup.js!
      this.responseResults = await this.specHelper.runMachineAndGetResults("MainState");
    });

    it("returns 'helloWorld'", async function(this: CurrentThisContext) {
      expect(this.responseResults.voiceMessage!.text).toEqual("Hello World");
    });
  });
});
