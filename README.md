<p align="center"><img src="http://www.antonius-ostermann.de/assets/images/assistantjs.png"></p>
AssistantJS enables you to develop ambitious platform-agnostic voice applications with ease. Don't write duplicate code - use the generic AssistantJS
state machine to implement your voice application and it runs on amazon alexa, google assistant and api.ai simultaneously. To fasten development,
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
helps you to build better user interfaces using response text variation out of the box.
- **Utterance generation**: AssistantJS recognizes the intents you are using and enables you to use a template language (as known from [alexa-utterances][7]) to generate utterances efficiently.
- **Debuggable**: Based on its components, AssistantJS uses the awesome [debug][4] module to give you exactly that kind of rich debug output you need.
- **CLI**: AssistantJS gives you a simple command line interface you can use to start your AssistantJS server (`assistant s`, backend by [express][8]) or generate nlu configurations (`assistant g`).
- **Entity validation**: Don't check for presence of entities, let AssistantJS do this job for you. *(Optional dependency)*
- **Authentication**: Protect your states with configurable authentication mechanisms. *(Optional dependency)*

## AssistantJS Ecosphere
- **assistant-source**: AssistantJS core framework, the only real dependency to use AssistantJS. *(Current repository)*
- **[assistant-alexa][15]**: Enables integrating Amazon Alexa into AssistantJS.
- **[assistant-apiai][16]**: Connects Api.ai with AssistantJS.
- **[assistant-google][17]**: Brings Google Assistant (via Api.ai) to AssistantJS.
- **[assistant-validations][18]**: Enables you to use a `@needs` decorator to express dependent entities. AssistantJS will automatically manage prompting for this entity, so you can focus on your real business.
- **[assistant-authentication][19]**: Enables you to protect your states with configurable authentication stratgies. Currently supports OAuth authentication token and pin authentication.
- **[assistant-generic-utterances][20]**: Automatically inserts useful utterances for generic intents, if a specific platform (like google assistant / api.ai) does not have generic intents on their own.

## Getting started
Install AssistantJS using npm as a global module:

`npm i --global assistant-source`

AssistantJS currently needs a running [redis][9] instance to work. So be sure to have redis set up! After that, check out these resources to get started:
- **[video tutorial][13]**: A short video tutorial covering the implementation of a bus travelling application. Check this out first!
- **[wiki][11]**: In our github wiki, most of the AssistantJS functionalities are well-described. Look into it for a deeper understanding of AssitantJS!
- **[assistant-boostrap][10]**: A well documented bootrap AssistantJS application. Maybe you want to use it to initialize your own project!
- **[stackoverflow][12]**: If you have any further questions, ask them on stackoverflow and use the `assistant.js` tag!

## License
For license information, see our [license file][14]. We might change this license to a more community-friendly one later, and will never charge you for
using AssistantJS is a non-commercial setup.

[1]: https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
[2]: http://inversify.io/
[3]: https://github.com/webcomputing/inversify-components
[4]: https://www.npmjs.com/package/debug
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
