<p align="right"><a href="https://travis-ci.org/webcomputing/AssistantJS"><img src="https://travis-ci.org/webcomputing/AssistantJS.svg?branch=develop"></a></p>
<p align="center"><img src="http://www.antonius-ostermann.de/assets/images/assistantjs.png"></p>
AssistantJS enables you to develop ambitious platform-agnostic voice applications with ease. Don't write duplicate code - use the generic AssistantJS
state machine to implement your voice application and it runs on amazon alexa, google assistant and dialogflow (formerly known as api.ai) simultaneously. To fasten development,
you even don't have to configure and update intent schema and utterances. Instead, AssistantJS generates the relevant nlu configuration for all connected platforms
based on your implementation.

But even if you are currently not interested in deploying your voice application to multiple voice assistants, you possibly still should take a look at AssistantJS.
On one hand obviously because you never know if your platform requirements may change in future. 
On the other hand, you probably don't want to miss some of the AssistantJS development features:
- **Object oriented state machine**: AssistantJS uses object oriented states to describe the flow of voice applications.  Amongst other things, this enables you to [DRY][1]-up your code by using inheritance and mixins. 
In addition, AssistantJS is heavily based on dependency injection using [inversify][2] with all its advantages.
- **Extendable**: AssistantJS is built out of multiple components extending each other using [inversify-components][3]. You are able to decide which components you need and which you don't. See below for an overview 
of currently implemented AssistantJS components.
- **Testable**: AssistantJS allows you to write voice applications which are fully testable, even across multiple voice assistants. To make testing even easier, AssistantJS gives you some nice test and mock helpers.
- **I18n integration**: Thanks to [i18next][5], AssistantJS gives you full multi language support. In addition, it applies some really nice [convention-over-configuration][6] rulesets to speed up your development and
help you to build better user interfaces using response text variation out of the box.
- **Utterance generation**: AssistantJS recognizes the intents you are using and enables you to use a template language (as known from [alexa-utterances][7]) to generate utterances efficiently. You are tired of maintaining your intents and utterances in dialogflow *and* in alexa? AssistantJS generates a fitting configuration for alexa and a zip file for dialogflow *based you the code you write*!
- **Logging**: AssistantJS uses the awesome [bunyan][4] module to give you production-ready and request-specific logging options.
- **CLI**: AssistantJS gives you a simple command line interface you can use to start your AssistantJS server (`assistant s`, backend by [express][8]) or generate nlu configurations (`assistant g`).
- **Entity validation**: Don't check for presence of entities, let AssistantJS do this job for you. *(Optional dependency)*
- **Authentication**: Protect your states with configurable authentication mechanisms. *(Optional dependency)*

## AssistantJS ecosystem
- **assistant-source**: AssistantJS core framework, the only real dependency to use AssistantJS. *(Current repository)*
- **[assistant-alexa][15]**: Enables integrating Amazon Alexa into AssistantJS.
- **[assistant-apiai][16]**: Connects Api.ai (now "Dialogflow") with AssistantJS.
- **[assistant-google][17]**: Brings Google Assistant (via dialogflow) to AssistantJS.
- **[assistant-validations][18]**: Enables you to use a `@needs` decorator to express dependent entities. AssistantJS will automatically manage prompting for this entity, so you can focus on your real business.
- **[assistant-authentication][19]**: Enables you to protect your states with configurable authentication stratgies. Currently supports OAuth authentication token and pin authentication.
- **[assistant-generic-utterances][20]**: Automatically inserts useful utterances for generic intents, if a specific platform (like google assistant / dialogflow) does not have generic intents on their own.

## Getting started
Install AssistantJS using npm as a global module:

`npm i --global assistant-source`

Check out these resources to get started:
- **[video tutorial][13]**: A short video tutorial covering the implementation of a bus travelling application. Check this out first!
- **[wiki][11]**: In our github wiki, most of the AssistantJS functionalities are well-described. Look into it for a deeper understanding of AssitantJS!
- **[assistant-bootstrap][10]**: A well documented AssistantJS demo application, which also includes jasmine tests.
- **[gitter][21]**: If you have any additional questions, don't hesitate to ask them on our official gitter channel!

### Show some code!
Just to give you a first insight into AssistantJS, this is one of the states implemented in our [video tutorial][13]:
```typescript
@injectable()
// Need account linking? Just add @authenticate(OAuthStrategy) over here!
export class MainState extends ApplicationState {
  /* Invoked by saying "Launch/Talk to my bus application" */
  invokeGenericIntent(machine: Transitionable) {
    this.prompt(this.t());
  }

  /* "Whats the next bus to train station?" */
  @needs("target") // Tell AssistantJS to wait for entity "target"
  async busRouteIntent(machine: Transitionable) {
    await machine.transitionTo("BusOrderState");
    const usersTarget = this.entities.get("target") as string;
    this.prompt(this.t({target: usersTarget}));
  }
}
```
Wondering about the empty `this.t()` calls? Translation keys are matched by applying simple [convention over configuration][6] rules. Try to find them out on your own by taking a look at the corresponding translation file:
```json
{
  "mainState": {
    "invokeGenericIntent": {
      "alexa": "Welcome, Alexa user!",
      "google": [
        "Welcome, Google user!",
        "Nice to have you here, Googler!"
      ]
    },
    "busRouteIntent": [
      "{Love to help you!|} The next bus to {{target}} arrives in {{minutes}} minutes. Do you want me to buy a ticket?"
    ],
    "helpGenericIntent": "Currently, you can only ask for busses. Try it out!"
  },
  "busOrderState": {
    "yesGenericIntent": "{Allright|Okay}! Just sent a ticket to your smartphone!",
    "noGenericIntent": "Cancelled, but maybe next time!",
    "helpGenericIntent": "Say \"yes\" to buy a ticket, or \"no\" otherwise."
  },
}
```
As you can see, AssistantJS supports you in building more varied voice applications per default. Just use our template syntax (`{Allright|Okay}`) or pass all alternatives in an array. Thanks to our convention over configuration rulesets, we are greeting google assistant users different than alexa users. We could even greet them device-specific thanks to these conventions. Oh, and as you can see, inheriting intents (like the `helpGenericIntent` above) from other states (here: `ApplicationState`) is also possible.

This is what a test (yes, you can test all assistantjs applications without hassle) for the MainState's `invokeGenericIntent` could look like:
```typescript
describe("MainState", function () {
  describe("on platform = alexa", function() {
    beforeEach(function() {
      this.currentPlatformHelper = this.platforms.alexa;
    });

    describe("invokeGenericIntent", function() {
      beforeEach(async function(done) {
        this.responseHandler = await this.currentPlatformHelper.pretendIntentCalled(GenericIntent.Invoke);
        done();
      });

      it("greets the user", function() {
        expect(this.responseHandler.voiceMessage).toEqual("Welcome, Alexa user!");
      });

      it("waits for an answer", function() {
        expect(this.responseHandler.endSession).toBeFalsy();
      });
    });
  });
});
```

[1]: https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
[2]: http://inversify.io/
[3]: https://github.com/webcomputing/inversify-components
[4]: https://github.com/trentm/node-bunyan
[5]: https://www.i18next.com/
[6]: https://en.wikipedia.org/wiki/Convention_over_configuration
[7]: https://github.com/alexa-js/alexa-utterances
[8]: http://expressjs.com
[9]: https://redis.io/
[10]: https://github.com/webcomputing/assistant-bootstrap
[11]: https://github.com/webcomputing/AssistantJS/wiki
[12]: https://stackoverflow.com/
[13]: https://github.com/webcomputing/AssistantJS/wiki/Getting-Started
[14]: https://github.com/webcomputing/AssistantJS/blob/master/LICENSE
[15]: https://github.com/webcomputing/assistant-alexa
[16]: https://github.com/webcomputing/assistant-apiai
[17]: https://github.com/webcomputing/assistant-google
[18]: https://github.com/webcomputing/assistant-validations
[19]: https://github.com/webcomputing/assistant-authentication
[20]: https://github.com/webcomputing/assistant-generic-utterances
[21]: https://gitter.im/AssistantJS/Lobby
