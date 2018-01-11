import {configureI18nLocale} from '../../support/util/i18n-configuration';
import { injectionNames } from '../../../src/injection-names';
import { StateFactory } from '../../../src/components/state-machine/interfaces';
import { Voiceable } from '../../../src/components/unifier/interfaces';
import { SpecSetup } from '../../../src/spec-setup';
import { BaseState } from '../../../src/components/state-machine/base-state';
import { createRequestScope } from '../../support/util/setup';

interface CurrentThisContext {
  state: BaseState;
  specHelper: SpecSetup;
  voiceResponseMock: Voiceable;
}

fdescribe("BaseState", function() {
  beforeEach(function(this: CurrentThisContext) {
    configureI18nLocale((this as any).container, false);
    createRequestScope(this.specHelper);

    this.state = this.specHelper.setup.container.inversifyInstance.get<StateFactory>(injectionNames.stateFactory)<BaseState>("PlainState");
  });

  describe("responseFactory synonyms", function() {
    beforeEach(function(this: CurrentThisContext) {
      // Singleton voice response
      this.voiceResponseMock = this.state.responseFactory.createVoiceResponse();

      spyOn(this.state.responseFactory, "createVoiceResponse").and.returnValue(this.voiceResponseMock);
    });

    describe("prompt", function() {
      it("calls responseFactory.prompt", function(this: CurrentThisContext) {
        const message = "Voice message";
        const reprompts = ["First reprompt", "Second reprompt", "Third reprompt", "Fourth reprompt"];
        spyOn(this.voiceResponseMock, "prompt");

        this.state.prompt(message, ...reprompts);
        expect(this.voiceResponseMock.prompt).toHaveBeenCalledWith(message, ...reprompts);
      })
    });

    describe("endSessionWith", function() {
      it("calls responseFactory.endSessionWith", function(this: CurrentThisContext) {
        const message = "Voice message";
        spyOn(this.voiceResponseMock, "endSessionWith");

        this.state.endSessionWith(message);
        expect(this.voiceResponseMock.endSessionWith).toHaveBeenCalledWith(message);
      })
    });
  });

  describe("translateHelper synonyms", function() {
    describe("t", function() {
      beforeEach(function(this: CurrentThisContext) {
        spyOn(this.state.translateHelper, "t");
      });

      it("redirects to translateHelper.t", function() {
        const params = ["mySpecificKeys.keyOne", {"localOne": "valueOne"}];
        this.state.t(...params);
        expect(this.state.translateHelper.t).toHaveBeenCalledWith(...params);
      });
    })
  })
});