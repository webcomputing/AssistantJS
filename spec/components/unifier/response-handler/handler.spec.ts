import { ResponseCallback } from "../../../../src/components/root/public-interfaces";
import { PLATFORM } from "../../../support/mocks/unifier/extraction";
import { MockHandlerA, MockHandlerASpecificTypes } from "../../../support/mocks/unifier/response-handler/mock-handler-a";
import { createRequestScope } from "../../../support/util/setup";
import { ThisContext } from "../../../this-context";

type MergedHandler = MockHandlerA<MockHandlerASpecificTypes>;

interface CurrentThisContext extends ThisContext {
  handlerInstance: MergedHandler & { getBody: () => void; responseCallback: ResponseCallback };

  mockCard: MockHandlerASpecificTypes["card"];
  mockChatBubbles: MockHandlerASpecificTypes["chatBubbles"];
  mockVoiceMessage: MockHandlerASpecificTypes["voiceMessage"]["text"];
  mockSSMLPrompt: MockHandlerASpecificTypes["voiceMessage"]["text"];
  mockReprompts: Array<MockHandlerASpecificTypes["voiceMessage"]["text"]>;
  mockSuggestionChips: MockHandlerASpecificTypes["suggestionChips"];
  mockSessionData: MockHandlerASpecificTypes["sessionData"];
  mockShouldAuthenticate: MockHandlerASpecificTypes["shouldAuthenticate"];
  mockShouldSessionEnd: MockHandlerASpecificTypes["shouldSessionEnd"];
  mockHttpStatusCode: MockHandlerASpecificTypes["httpStatusCode"];
  mockTable: MockHandlerASpecificTypes["table"];

  expectedResult: Partial<MockHandlerASpecificTypes>;
  fillExpectedReprompts: () => void;
  fillExpectedResultsWithDefaults: () => void;
}

describe("BaseHandler", function() {
  beforeEach(async function(this: CurrentThisContext) {
    createRequestScope(this.specHelper);

    this.handlerInstance = this.container.inversifyInstance.get(PLATFORM + ":current-response-handler");
    this.container.inversifyInstance.unbind(PLATFORM + ":current-response-handler");

    spyOn(this.handlerInstance, "getBody");

    this.container.inversifyInstance.bind(PLATFORM + ":current-response-handler").toConstantValue(this.handlerInstance);

    this.mockTable = { header: ["A", "B"], elements: [["A1", "A2"], ["B1", "B2"]] };
    this.mockCard = { description: "desc", title: "title" };
    this.mockChatBubbles = ["Bubble A", "Bubble B"];
    this.mockVoiceMessage = "Prompt";
    this.mockSSMLPrompt = "Prompt <break time='500ms'/> Kann ich sonst noch etwas für dich erledigen?";
    this.mockReprompts = ["Reprompt A", "Reprompt B"];
    this.mockSuggestionChips = ["Suggestion A", "Suggestion B"];
    this.mockSessionData = "My Mock Session Data";
    this.mockShouldAuthenticate = true;
    this.mockShouldSessionEnd = true;
    this.mockHttpStatusCode = 200;

    this.expectedResult = {};

    this.fillExpectedResultsWithDefaults = () => {
      this.expectedResult = {
        table: this.mockTable,
        card: this.mockCard,
        chatBubbles: this.mockChatBubbles,
        suggestionChips: this.mockSuggestionChips,
        shouldAuthenticate: this.mockShouldAuthenticate,
        shouldSessionEnd: this.mockShouldSessionEnd,
      };
    };

    this.fillExpectedReprompts = () => {
      this.expectedResult.reprompts = this.mockReprompts.map(value => {
        return mapPrompt(value);
      });
    };
  });

  function expectResult() {
    it("calls sendResponse with corresponding object", async function(this: CurrentThisContext) {
      expect(this.handlerInstance.getBody).toHaveBeenCalledWith(this.expectedResult);
    });
  }

  function mapPrompt(value: string, isSSML = false) {
    return {
      isSSML,
      text: isSSML ? `<speak>${value}</speak>` : value,
    };
  }

  function promisefyElements(value: string) {
    return Promise.resolve(value);
  }

  describe("without answers set", function() {
    beforeEach(async function(this: CurrentThisContext) {
      await this.handlerInstance.send();
    });

    it("calls sendResponse with empty object", async function(this: CurrentThisContext) {
      expect(this.handlerInstance.getBody).toHaveBeenCalledWith(this.expectedResult);
    });
  });

  describe("with answers set", function() {
    describe("with promises in Answers", function() {
      beforeEach(async function(this: CurrentThisContext) {
        const promisfiedMockedReprompts = this.mockReprompts.map(promisefyElements);

        this.fillExpectedResultsWithDefaults();
        this.fillExpectedReprompts();
        this.expectedResult.voiceMessage = mapPrompt(this.mockVoiceMessage);

        await this.handlerInstance
          .prompt(Promise.resolve(this.mockVoiceMessage))
          .setReprompts(promisfiedMockedReprompts)
          .setCard(Promise.resolve(this.mockCard))
          .setChatBubbles(Promise.resolve(this.mockChatBubbles))
          .setSuggestionChips(Promise.resolve(this.mockSuggestionChips))
          .setMockHandlerATable(Promise.resolve(this.mockTable))
          .setUnauthenticated()
          .setEndSession()
          .send();
      });

      expectResult();
    });

    describe("without promises in Answer", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.fillExpectedResultsWithDefaults();
        this.fillExpectedReprompts();
        this.expectedResult.voiceMessage = mapPrompt(this.mockVoiceMessage);

        await this.handlerInstance
          .prompt(this.mockVoiceMessage)
          .setReprompts(this.mockReprompts)
          .setCard(this.mockCard)
          .setChatBubbles(this.mockChatBubbles)
          .setSuggestionChips(this.mockSuggestionChips)
          .setMockHandlerATable(this.mockTable)
          .setUnauthenticated()
          .setEndSession()
          .send();
      });

      expectResult();
    });
  });

  describe("with single methods", function() {
    describe("with prompt()", function() {
      describe("with prompt as Promise", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.expectedResult.voiceMessage = mapPrompt(this.mockVoiceMessage);

          await this.handlerInstance.prompt(Promise.resolve(this.mockVoiceMessage)).send();
        });

        expectResult();
      });

      describe("with SSML in prompt", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.expectedResult.voiceMessage = mapPrompt(this.mockSSMLPrompt, true);

          await this.handlerInstance.prompt(this.mockSSMLPrompt).send();
        });

        expectResult();
      });

      describe("with prompt and reprompt in one call", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.fillExpectedReprompts();
          this.expectedResult.voiceMessage = mapPrompt(this.mockVoiceMessage);

          await this.handlerInstance.prompt(this.mockVoiceMessage, ...this.mockReprompts).send();
        });

        expectResult();
      });
    });

    describe("with setReprompts()", function() {
      describe("with Array of strings", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.fillExpectedReprompts();

          await this.handlerInstance.setReprompts(this.mockReprompts).send();
        });

        expectResult();
      });

      describe("with Array of Promises", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.fillExpectedReprompts();

          const promisfiedMockedReprompts = this.mockReprompts.map(promisefyElements);
          await this.handlerInstance.setReprompts(Promise.all(promisfiedMockedReprompts)).send();
        });

        expectResult();
      });

      describe("with Promise, which returns Array of Strings", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.fillExpectedReprompts();

          await this.handlerInstance.setReprompts(Promise.resolve(this.mockReprompts)).send();
        });

        expectResult();
      });
    });

    describe("with setUnauthenticated()", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.expectedResult.shouldAuthenticate = true;

        await this.handlerInstance.setUnauthenticated().send();
      });

      expectResult();
    });

    describe("with setEndSession()", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.expectedResult.shouldSessionEnd = true;

        await this.handlerInstance.setEndSession().send();
      });

      expectResult();
    });

    describe("with setHttpStatusCode()", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.expectedResult.httpStatusCode = 401;

        spyOn(this.handlerInstance as any, "responseCallback").and.callThrough();
        await this.handlerInstance.setHttpStatusCode(401).send();
      });

      it("calls responseCallback with status Code", async function(this: CurrentThisContext) {
        expect((this.handlerInstance as any).responseCallback).toHaveBeenCalledWith(undefined, jasmine.any(Object), 401);
      });
    });

    describe("with endSessionWith()", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.expectedResult.shouldSessionEnd = true;
        this.expectedResult.voiceMessage = mapPrompt(this.mockVoiceMessage);

        await this.handlerInstance.endSessionWith(this.mockVoiceMessage).send();
      });

      expectResult();
    });

    describe("with setSuggestionChips()", function() {
      describe("with simple Array", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.expectedResult.suggestionChips = this.mockSuggestionChips;

          await this.handlerInstance.setSuggestionChips(this.mockSuggestionChips).send();
        });

        expectResult();
      });

      describe("with Promise, which returns Array", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.expectedResult.suggestionChips = this.mockSuggestionChips;

          await this.handlerInstance.setSuggestionChips(Promise.resolve(this.mockSuggestionChips)).send();
        });

        expectResult();
      });
    });

    describe("with setChatBubbles()", function() {
      describe("with simple Array", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.expectedResult.chatBubbles = this.mockChatBubbles;

          await this.handlerInstance.setChatBubbles(this.mockChatBubbles).send();
        });

        expectResult();
      });

      describe("with Promise, which returns Array", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.expectedResult.chatBubbles = this.mockChatBubbles;

          await this.handlerInstance.setChatBubbles(Promise.resolve(this.mockChatBubbles)).send();
        });

        expectResult();
      });
    });

    describe("with setCard()", function() {
      describe("with simple Array", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.expectedResult.card = this.mockCard;

          await this.handlerInstance.setCard(this.mockCard).send();
        });

        expectResult();
      });

      describe("with Promise, which returns Array", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.expectedResult.card = this.mockCard;

          await this.handlerInstance.setCard(Promise.resolve(this.mockCard)).send();
        });

        expectResult();
      });
    });

    describe("without any AnswerType", function() {
      describe("with simple Array", function() {
        beforeEach(async function(this: CurrentThisContext) {
          await this.handlerInstance.send();
        });

        expectResult();
      });
    });
  });

  describe("unsupportedFeature", function() {
    it("adds params to unsupportedFeatureCalls attribute", async function(this: CurrentThisContext) {
      this.handlerInstance.unsupportedFeature("methodName", "arg1", "arg2", 3);
      expect(this.handlerInstance.unsupportedFeatureCalls).toEqual([{ methodName: "methodName", args: ["arg1", "arg2", 3] }]);
    });
  });

  describe("wasSent()", function() {
    describe("with sending", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.handlerInstance.send();
      });

      it("returns true", async function(this: CurrentThisContext) {
        expect(this.handlerInstance.wasSent()).toBe(true);
      });
    });

    describe("without sending", function() {
      it("returns false", async function(this: CurrentThisContext) {
        expect(this.handlerInstance.wasSent()).toBe(false);
      });
    });
  });

  describe("without sending activly", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.expectedResult = {
        suggestionChips: this.mockSuggestionChips,
        table: this.mockTable,
        sessionData: '{"__context_states":"[]","__current_state":"MainState"}',
      };

      this.handlerInstance.setSuggestionChips(this.mockSuggestionChips).setMockHandlerATable(this.mockTable);
      await this.specHelper.runMachine("MainState");
    });

    it("calls getBody() in AfterStateMachine", async function(this: CurrentThisContext) {
      expect(this.handlerInstance.getBody).toHaveBeenCalledWith(this.expectedResult);
    });
  });
});
