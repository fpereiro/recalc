# recalc

> "[T]hus, the external world would only have a triggering role in the release of the internally-determined activity of the nervous system." --Humberto Maturana

> "Should that function take the whole world as input and return a brand new world as output? Why even use functional programming, then?" --[James Hague](http://prog21.dadgum.com/26.html)

recalc is a library for reasoning functionally about side effects. The core ideas are to use events to pass *control* and a global store that is updated through events to pass *data*.

## Current status of the project

The current version of recalc, v3.2.0, is considered to be *somewhat stable* and *somewhat complete*. [Suggestions](https://github.com/fpereiro/recalc/issues) and [patches](https://github.com/fpereiro/recalc/pulls) are welcome. Future changes planned are:

- Add annotated source code.

## Installation

The dependencies of recalc are two:

- [dale](https://github.com/fpereiro/dale)
- [teishi](https://github.com/fpereiro/teishi)

recalc is written in Javascript. You can use it in the browser by sourcing the dependencies and the main file:

```html
<script src="dale.js"></script>
<script src="teishi.js"></script>
<script src="recalc.js"></script>
```

Or you can use these links to use the latest version - courtesy of [RawGit](https://rawgit.com) and [MaxCDN](https://maxcdn.com).

```html
<script src="https://cdn.rawgit.com/fpereiro/dale/9135a9699d53aac1eccc33becb31e7d402a52214/dale.js"></script>
<script src="https://cdn.rawgit.com/fpereiro/teishi/9781a179ed2d5abce8d6383edc19f345db58ce70/teishi.js"></script>
<script src=""></script>
```

And you also can use it in node.js. To install: `npm install recalc`

recalc is pure ES5 javascript and it should work in any version of node.js (tested in v0.8.0 and above). Browser compatibility is as follows:

- Chrome 15 and above.
- Firefox 22 and above.
- Safari 5.1 and above.
- IE9 and above.
- Opera 11.6 and above.

The author wishes to thank [Browserstack](https://browserstack.com) for providing tools to test cross-browser compatibility.

<a href="https://www.browserstack.com"><img src="https://bstacksupport.zendesk.com/attachments/token/kkjj6piHDCXiWrYlNXjKbFveo/?name=Logo-01.svg" width="150px" height="33px"></a>

## Philosophy

Recalc is a library for working with side effects in a functional way. Functional programming traditionally tries to marginalize side effects as much as possible, but I feel this is dishonest, because the side effects are still there and still needed. And as any form of denial, it ends up generating more trouble.

Programming in a functional style entails making programs out of functions. These functions call each other, in predetermined sequences, passing data between them exclusively in the form of arguments (inputs) and return values (outputs). Control and data are passed simultaneously: when a function returns, it both returns a value and also control to the function which called it in the first place. When all functions return, the program terminates.

These limitations (data & control being passed simultaneously, data being passed only as arguments and return values, and arguments not being modified by the function which receives them) are very empowering, because they make it much easier to reason about data and control flow, while still allowing for powerful programs.

Before I continue, let me say that I consider functional programming to be the most solid way of programming, for both small and large applications. Not only I consider it much better than imperative programming - I also think it is superior to object oriented programming. Functional is the paradigm I choose every time for all my projects.

However, there are certain circumstances where a pure functional approach won't work. Interestingly, virtually all the objections to functional programming which I consider valid center around these circumstances. It is also in these circumstances that many employ imperative or object oriented techniques.

In a decently pure functional program, there's only one side effect: when someone actually starts the program passing it some input. This both provides control and data to the main function of the program, which then calls other functions. When the whole thing is done, the main function dutifully returns its result and exits. In most cases, though, it is allowed for that function to commit another side effect to do something useful with its output, like writing that data to a file. So, besides the initialization and occasionally the exit, the rest of the program is purely functional.

The shape of this program, however, is pretty much identical to a traditional batch-and-queue program. The only interactions (or side effects, since they amount to the same thing) with the outside world are located only at the beginning and at the end of the process.

But an interactive program, like a game or a web page, has to process interactions from the user and the server while it is running. The question is, how do we handle these interactions/side effects in a functional manner?

This library is an attempt to answer that question.

If we can't get rid of side effects, we can instead embrace them without forgetting our functional roots. We can consider that each side effect is an *event*. When a side effect comes in, we make our program fire an event. And here's the kicker: there might be one or more listeners for a given event. Those listeners are simply functions that then operate in consequence. In this way, you can work on the problem of passing control around when side effects come into the picture.

The other question is: how do we pass data around? Since there might be multiple listeners to an event, operating sequentially or parallely, it would be messy to depend on return values. Instead, we can create a central object where we can store all the state of the application. A *global object* shared by all functions (I hope you're cringing now), which we call the *store*.

But wait! If these events and their handlers modify this global object, wouldn't be this merely be imperative programming? It would, except for one catch: data changes on the global state can also be expressed as events, to which functions can respond/react. So you don't just increment a variable. You increment it through an event that notifies everyone concerned.

From a functional perspective, this is tantamount to heresy. We're talking here about systematizing side effects, using a global state to pass data and ignoring the return values from event handlers. However, this is exactly how I think that functional programming should be extended to deal with programs which continually interact with the outside world. In other words, this is an attempt to find the general case of functional programming.

## Usage

To use recalc, you first need to create a recalc object.

Let's assume that the recalc library has been loaded at the variable `R` (this should happen automatically in the browser - in node.js, you would need to write `var R = require ('recalc')`). To initialize a recalc object you would do this:

```javascript
var r = R ();
```

`r` will be now our recalc object. The reason we use a [constructor](https://en.wikipedia.org/wiki/Constructor_(object-oriented_programming)) (instead of directly making `R` a recalc object) is that you may need to have multiple recalc objects at the same time; by executing the constructor more than once, you can get as many recalc objects as needed.

Every recalc object has five elements that you need to understand in order to use the library. The first two are objects, the other three are functions:

- `r.routes`
- `r.store`
- `r.do`
- `r.listen`
- `r.forget`

### `r.routes`

The `routes` object is an object that contains all the event handlers. Whenever an event is fired, recalc iterates all the elements within `routes`, and executes those that match the event being fired.

We have chosen to name these elements as `routes` instead of `event handlers`, because of the evocative power and associations of the first term.

To add and remove routes, rather than directly modifying the array, I recommend you use `r.listen` and `r.forget` (we'll see these functions in a moment).

### `r.store`

Our beloved global state. It is initailized as an empty object. If you want to initialize it to an array, you can do so by initializing `r` like this:

```javascript
var r = R ([]);
```

In this way, you can also initialize `store` to contain some data, right off the bat:

```javascript
var r = R ({some: 'important', data: true});
```

By the way, that's the only argument you can pass to `R` (the constructor).

An important thing to notice is that the routes are stored outside of the global store.

### `r.do`

So far, `routes` and `store` are simple objects. Where's the action? Enter `r.do`. This function *fires* events.

Every event has two properties:

- A `verb`, which is a string. For example: `'get'`, `'set'` or `'someverb'`.
- A `path`, which can be either a string, an integer, or an array with one or more strings or integers. For example, `'hello'`, `1`, or `['hello', '1']`. If you pass a single string or number, it will be interpreted as an array containing that element.

The combination of a verb plus a path seems versatile enough to serve as a general purpose way of building an event system. It works well for [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) and it will probably work well for us too.

Both `verb` and `path` are required. If you don't pass them or pass invalid ones, `r.do` will return `false`. If its inputs are valid, the event will be fired and the function will return `true` (aren't side effects fun?).

For example, to fire an event with verb `'fire'` and a path `['hello', 1]`, you can write:

```javascript
r.do ('fire', ['hello', 1]);
```

You can pass unlimited additional arguments when you fire an event. These arguments will be received by any routes that are listening to that particular event. For example, if you want to pass `'foo'` and `'bar'`, you can write:

```javascript
r.do ('fire', ['hello', 1], 'foo', 'bar');
```

You can also use wildcards for both verbs and paths. For example:

```javascript
r.do ('*', '*');
r.do ('fire', '*');
r.do ('fire', ['hello', '*']);
```

Wildcards are further explored in the next section - to really understand them, we need to understand how routes are matched against a new event.

### `r.listen`

This function is the one in charge of placing routes into `r.routes`. Every time it is invoked with valid arguments, it will add a route. It takes the following arguments:

- `opts`, an object which contains at least a `verb` and a `path`. The `verb` and `path` are exactly like those passed to `r.do`.
- `rfun`, the function that will be executed when the route is matched. `rfun` is short for `route function`.

As with `r.do`, if you pass an invalid route, this function will return `false`, otherwise it will return the `id` of the route.

For example, to match the last event we showed on the last section, we could write a route like this:

```javascript
r.listen ({verb: 'fire', path: ['hello', 1]}, function () {
   // Your logic here.
});
```

The most important question regarding routes is: when is a route matched? And the answer is: when both the verb and path of the executed event match those of the route.

In the case of the verb, matching is straightforward: the verb of the path must match identically that of the handler.

In the case of the path, it is somewhat more involved. Let's explain this with an example. Suppose you have the following route:

```javascript
r.listen ({verb: 'fire', path: 'hello'}, function () {...});
```

The route above will match the following three events:

```javascript
r.do ('fire', 'hello');

r.do ('fire', ['hello', 'there']);

r.do ('fire', ['hello', 'there', 'handsome']);
```

But it will *not* match the following events:

```javascript
r.do ('fire', 'nothello');

r.do ('fire', ['nothello', 'hello']);
```

In general, what happens is that the elements of the route path are matched one-to-one with the elements of the event being fired. If the path of the event is longer than the path of the route, then the extra elements of the event path are discarded for comparison purposes. An interesting corollary is that if an event has n elements on a path, the route path has to have at least n elements in order to match it.

Why this strange behavior? I'm still heavily experimenting with this, but so far this approach tends to be quite useful for tracking changes in nested data structures. When I find a deeper, less pragmatic explanation, I will be eager to post it here.

One more thing: you can also use wildcards, in both route verbs and paths. For example, this route will be executed by every event:

```javascript
r.listen ({verb: '*', path: '*'}, function () {...});
```

You can also use wildcards for single elements in an array path. For example, this route:

```javascript
r.listen ({verb: 'fire', path: ['hello', '*', 'handsome']}, function () {...});
```

Will be matched by the following events:

```javascript
r.do ('fire', ['hello', 'there', 'handsome']);

r.do ('fire', ['hello', 'out there', 'handsome']);

r.do ('*', ['hello', '*']);
```

To close this rather long section, let's now see what additional `opts` can be passed to a route. All of them are optional:

- `id`: a string or integer that will uniquely identify a route. If you don't pass one, `r.listen` will generate one for you. This `id` will be used as the key where the route is bound - for example, if `opts.id === 'hello'`, the route will be stored at `r.routes.hello`. If you pass an `id` that's already being used by another route, an error will be printed and `r.listen` will return `false`.
- `parent`: a string or integer that will represent the `id` of this route. By default this is `undefined`. The purpose of this will be explained below when we explain `r.forget`.
- `priority`: an integer value. By default this is `undefined`. The higher the value, the sooner this route will be executed in case of a match.
- `burn`: a boolean value. By default this is `undefined`. When you set it to `true`, the route will auto-destroy after being matched/executed a single time. This allows you to create one-off events that later disappear, hence allowing you to keep clean the event space.

This last property reminds us that it is perfectly normal to have more than one route matching a certain event. `priority` simply lets us make certain routes to be executed ahead of others. Again, I have pragmatic reasons for this, but still no carefully considered rationale. Routes of equal priority are run in arbitrary order - to ensure a specific sequence, you need to use the `priority` parameter.

It is also perfectly possible to have *zero* routes matching a certain event.

### `r.forget`

This function allows us to remove routes. Its first argument is `id`, which should be a string or integer. This `id` is the one of the route we are removing.

If you call `r.forget ('foo')`, this will also remove all the routes that have `'foo'` as its parent, plus all their children. In effect, the `parent` property of the route allows for tree-like deletion of routes.

If you call `r.forget ('foo')` and there's no route named `foo`, this function will return `false` and print an error.

If you pass a function as the second argument to `r.forget`, this function will be executed for every route deleted (that is, the route with the `id` specified, plus all its children). This `onforget` function will receive as first argument the route that is being deleted.

For example, `r.forget ('foo', function (r) {console.log (r.id)})` will print `foo`, as well as the ids of any routes that have `foo` as parent.

### Route functions

I lied - you also need to understand how route functions work in order to use recalc. But this is the very last thing.

A route function always receives a `context` as its first argument. The context is an object with three elements:

- `verb`, the verb of the event that matched the route.
- `path`, the path of the event that matched the route.
- `cb`, a callback function which you only need to use if your route function is asynchronous.

As a convention, I name `context` as `x`. Let's see an example:

```javascript
r.listen ({verb: 'fire', path: '*'}, function (x, extraArg1, extraArg2) {
   // Do something...
});
```

If we execute the following event:

```javascript
r.do ('fire', 'hello');
```

Then the route above will receive an `x` of the form `{verb: 'fire', path: ['hello'], cb: ...}` and both `extraArg1` and `extraArg2` will be `undefined`.

To set `extraArg1` and `extraArg2` to `'foo'` and `'bar'` respectively, you could trigger the following event:

```javascript
r.do ('fire', 'hello', 'foo', 'bar');
```

Having covered the arguments, we now have to see what you to have in mind when writing route functions. There's two issues: control and data.

Regarding control, if your route function is synchronous, there's nothing to worry about: once your function finishes executing, the route functions of any other routes will be executed, one at a time. However, if your function is asynchronous, you need to signal this to recalc, so that the order in which routes are executed will be preserved.

Let's say that you have a route function that executes an asynchronous operation. The proper way to write it is like this:

```
r.do ('fire', 'hello', function (x) {
   asyncOperation ('foo', 'bar', function () {
      x.cb ();
   });
   return x.cb ();
});
```

The above async route function does two things that every async route function should do:

1. Call `x.cb` from within the asynchronous callback, to resume execution of further matching routes.
2. Return `x.cb`, to notify recalc that this is an async function and it should not keep on executing other routes synchronously.

Interestingly enough, if you don't want to resume the execution of further routes, you can skip the call to `x.cb` from within the asynchronous callback. This may be handy in case of an error.

Regarding the issue of calling events from within a route handler (something which is both possible and encouraged), it can be done freely as long as the events trigger routes with synchronous route functions. If, however, you trigger an event that triggers one or more asynchronous route functions, you should do that as the *last* thing within the body of your route function, in order to preserve the sequence. Not only that, you should also return `x.cb` in order to signal that this operation was async, and hence your route function is async as well.

Regarding data: unless your route function returns `x.cb` (which signals that it is async), any other return values will be *discarded*. If you want to pass data, you should place it in `r.store`, through a function that triggers an event.

Because recalc wants to retain generality, we haven't bundled any functions for doing updates on `r.store` using the event system. A forthcoming library will show a comprehensive example of this. However, for the time being, consider the following example, where `r.store` is an array:

```javascript
r.listen ('setElement', '*', function (x, value) {
   r.store [x.path] = element;
});

r.do ('setElement', 2, 'something');
```

The two functions above will set the third element of `r.store` to the value `'something'`. This function can be generalized to arrays and objects, and also to support deletions.

## Implementation functions

There's four other functions that support the usage functions. If you override them, you can change the innards of recalc. These are:

- `r.random`, a function for generating random ids for new routes.
- `r.mill`, the function that gets executed by `r.do` when an event is fired - it represents the core engine of the library.
- `r.match`, the function in charge of matching an event with the relevant routes.
- `r.sort`, the function that sorts the order of the matching routes that will be executed in response to a certain event.

## Source code

The complete source code is contained in `recalc.js`. It is about 160 lines long.

Annotated source code will be forthcoming when the library stabilizes.

## License

recalc is written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.
