# Introduction
Dialogbits Framework enables you to develop ambitious platform-agnostic voice applications with ease. Don't write duplicate code - use the generic state machine to implement your voice application and it runs on amazon alexa, google assistant and dialogflow (formerly known as api.ai) simultaneously. To fasten development, you even don't have to configure and update intent schema and utterances. Instead, Dialogbits Framework generates the relevant nlu configuration for all connected platforms based on your implementation.

## Part 1

## Part 2

# Second

## Part 1

### Part 1a

## Part 2

**Todos**:

!> **Warning**: This is a warning box

?> Slight highlight

```typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}

var mySearch: SearchFunc;
mySearch = function(source: string, subString: string) {
  var result = source.search(subString);
  if (result == -1) {
    return false;
  }
  else {
    return true;
  }
}


class Greeter {
    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }
    greet() {
        return "Hello, " + this.greeting;
    }
}

var greeter = new Greeter("world");
```