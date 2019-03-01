import { ResponseCallback } from "../../../../src/components/root/public-interfaces";
import { createRequestScope } from "../../../helpers/scope";
import { PLATFORM } from "../../../support/mocks/unifier/extraction";
import { MockHandlerA, MockHandlerASpecificTypes } from "../../../support/mocks/unifier/response-handler/mock-handler-a";
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

  getBodySpy: jasmine.Spy;
  params: any;
}

describe("BaseHandler", function() {
  beforeEach(async function(this: CurrentThisContext) {
<<<<<<< HEAD
    this.specHelper.prepareSpec(this.defaultSpecOptions);
=======
    this.params = {};
>>>>>>> develop
    createRequestScope(this.specHelper);

    this.handlerInstance = this.inversify.get(`${PLATFORM}:current-response-handler`);
    this.inversify.unbind(`${PLATFORM}:current-response-handler`);

    this.getBodySpy = spyOn(this.handlerInstance, "getBody");

    this.inversify.bind(`${PLATFORM}:current-response-handler`).toConstantValue(this.handlerInstance);

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

  describe("#send", function() {
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

        it("calls responseCallback with status code", async function(this: CurrentThisContext) {
          expect((this.handlerInstance as any).responseCallback).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Object), 401);
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

    describe("regarding forwarded call to response callback", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.params.returnValueForGetBody = { grandparents: { parent: "child" } };
        this.getBodySpy.and.callFake(() => this.params.returnValueForGetBody);

        spyOn(this.handlerInstance as any, "responseCallback").and.callThrough();
      });

      describe("without appended json", function() {
        beforeEach(async function(this: CurrentThisContext) {
          await this.handlerInstance.send();
        });

        it("calls response callback with returned body from handler", async function(this: CurrentThisContext) {
          expect((this.handlerInstance as any).responseCallback).toHaveBeenCalledWith(
            JSON.stringify(this.params.returnValueForGetBody),
            jasmine.any(Object),
            jasmine.any(Number)
          );
        });
      });

      describe("with appended json", function() {
        describe("with attributes overriding existing attributes deeply", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.params.appendedJSON = { grandparents: { parent: "merge surviving child" } };

            await this.handlerInstance.setAppendedJSON(this.params.appendedJSON).send();
          });

          it("replaces attribute from resultset with the appended one", async function(this: CurrentThisContext) {
            expect((this.handlerInstance as any).responseCallback).toHaveBeenCalledWith(
              JSON.stringify(this.params.appendedJSON),
              jasmine.any(Object),
              jasmine.any(Number)
            );
          });
        });

        describe("with attributes appending existing attributes", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.params.appendedJSON = { grandparents: { patchWorkParent: "child" } };

            await this.handlerInstance.setAppendedJSON(this.params.appendedJSON).send();
          });

          it("merges both attribute sets toetether, extending the results with entries from the appended set", async function(this: CurrentThisContext) {
            expect((this.handlerInstance as any).responseCallback).toHaveBeenCalledWith(
              JSON.stringify({ grandparents: { parent: "child", patchWorkParent: "child" } }),
              jasmine.any(Object),
              jasmine.any(Number)
            );
          });
        });
      });
    });
  });

  describe("#resolveAnswerField", function() {
    describe("with a value in this field", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.handlerInstance.setSuggestionChips(["a", "b"]);
      });

      describe("with a registered thenMap", function() {
        beforeEach(async function(this: CurrentThisContext) {
          (this.handlerInstance as any).promises.suggestionChips.thenMap = () => ["c"];
        });

        it("executes thenMap", async function(this: CurrentThisContext) {
          expect(await this.handlerInstance.resolveAnswerField("suggestionChips")).toEqual(["c"]);
        });
      });

      describe("with no registered thenMap", function() {
        it("resolves regular value without using thenMap", async function(this: CurrentThisContext) {
          expect(await this.handlerInstance.resolveAnswerField("suggestionChips")).toEqual(["a", "b"]);
        });
      });
    });

    describe("with no value in this field", function() {
      it("returns a promise resolving to undefined", async function(this: CurrentThisContext) {
        expect(await this.handlerInstance.resolveAnswerField("suggestionChips")).toEqual(undefined);
      });
    });

    it("enables appending of values", async function(this: CurrentThisContext) {
      this.handlerInstance.setSuggestionChips(Promise.resolve(["a", "b"]));
      const suggestionChips = (await this.handlerInstance.resolveAnswerField("suggestionChips")) as string[];
      this.handlerInstance.setSuggestionChips([...suggestionChips, "c"]);

      expect(await this.handlerInstance.resolveAnswerField("suggestionChips")).toEqual(["a", "b", "c"]);
    });
  });

  describe("#unsupportedFeature", function() {
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
