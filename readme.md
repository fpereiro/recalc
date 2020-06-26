# recalc

> "[T]hus, the external world would only have a triggering role in the release of the internally-determined activity of the nervous system." --Humberto Maturana

> "Should that function take the whole world as input and return a brand new world as output? Why even use functional programming, then?" --[James Hague](http://prog21.dadgum.com/26.html)

recalc is a library for reasoning functionally about side effects. Its core ideas are: use events to pass *control* and a global store that is updated through events to pass *data*.

## Current status of the project

The current version of recalc, v5.0.0, is considered to be *stable* and *complete*. [Suggestions](https://github.com/fpereiro/recalc/issues) and [patches](https://github.com/fpereiro/recalc/pulls) are welcome. Besides bug fixes, there are no future changes planned.

recalc is part of the [ustack](https://github.com/fpereiro/ustack), a set of libraries to build web applications which aims to be fully understandable by those who use it.

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

Or you can use these links to the latest version - courtesy of [jsDelivr](https://jsdelivr.com).

```html
<script src="https://cdn.jsdelivr.net/gh/fpereiro/dale@3199cebc19ec639abf242fd8788481b65c7dc3a3/dale.js"></script>
<script src="https://cdn.jsdelivr.net/gh/fpereiro/teishi@f93f247a01a08e31658fa41f3250f8bbfb3d9080/teishi.js"></script>
<script src="https://cdn.jsdelivr.net/gh/fpereiro/recalc@/recalc.js"></script>
```

And you also can use it in node.js. To install: `npm install recalc`

recalc should work in any version of node.js (tested in v0.8.0 and above). Browser compatibility has been tested in the following browsers:

- Google Chrome 15 and above.
- Mozilla Firefox 3 and above.
- Safari 4 and above.
- Internet Explorer 6 and above.
- Microsoft Edge 14 and above.
- Opera 10.6 and above.
- Yandex 14.12 and above.

The author wishes to thank [Browserstack](https://browserstack.com) for providing tools to test cross-browser compatibility.

<a href="https://www.browserstack.com"><img src="https://bstacksupport.zendesk.com/attachments/token/kkjj6piHDCXiWrYlNXjKbFveo/?name=Logo-01.svg" width="150px" height="33px"></a>

## Philosophy

Recalc is a library for working with side effects in a functional way. Functional programming traditionally tries to marginalize side effects as much as possible, but I feel this is dishonest, because the side effects are still there and still needed. And as any form of denial, it ends up generating more trouble.

Programming in a functional style entails making programs out of functions. These functions call each other, in predetermined sequences, passing data between them exclusively in the form of arguments (inputs) and return values (outputs). Control and data are passed simultaneously: when a function returns, it both returns a value and also control to the function which called it in the first place. When all functions return, the program terminates.

These limitations (data & control being passed simultaneously, data being passed only as arguments and return values, and arguments not being modified by the function which receives them) are very empowering, because they make it much easier to reason about data and control flow, while still allowing for powerful programs.

Before I continue, let me say that I consider functional programming to be the most solid way of programming, for both small and large applications. Not only I consider it much better than imperative programming - I also think it is superior to object oriented programming. Functional is the paradigm I choose every time for all my projects.

However, there are certain circumstances where a pure functional approach won't work. Interestingly, virtually all the objections to functional programming which I consider valid emerge in these circumstances. It is also in these circumstances that many employ imperative or object oriented techniques.

In a decently pure functional program, there's only one side effect: when someone actually starts the program passing it some input. This both provides control and data to the main function of the program, which then calls other functions. When the whole thing is done, the main function dutifully returns its result and exits. In most cases, though, it is allowed for that function to commit another side effect to do something useful with its output, like writing that data to a file. So, besides the initialization and occasionally the exit, the rest of the program is purely functional.

The shape of this program, however, is pretty much identical to a traditional batch-and-queue program. The only interactions (or side effects, since they amount to the same thing) with the outside world are located only at the beginning and at the end of the process.

But an interactive program, like a game or an application, has to process interactions from the user and the server while it is running. The question is, how do we handle these interactions/side effects in a functional manner?

This library is an attempt to answer that question.

If we can't get rid of side effects, we can instead embrace them without forgetting our functional roots. We can consider that each side effect is an *event*. When a side effect comes in, we make our program *call* an event. And here's the kicker: there might be one or more *responders* for a given event. Those responders are merely functions that are executed as a consequence of a given event being called. In this way, you can work on the problem of passing control around when side effects come into the picture.

The other question is: how do we pass data around? Since there might be multiple responders to an event, operating sequentially or parallely, it would be messy to depend on return values. Instead, we can create a central object where we can store all the state of the application. A *global object* shared by all functions (I hope you're cringing now), which we call the *store*.

But wait! If these events and their handlers modify this global object, wouldn't be this merely be imperative programming? It would, except for one catch: data changes on the global state can also be expressed as events, to which functions can respond/react. So you don't just increment a variable. You increment it through an event that notifies everyone concerned. Events allow us to create *first-class side effects*, so that we can define them, pass them around and reason about them in a clear way.

From a functional perspective, this is tantamount to heresy. We're talking here about systematizing side effects, using a global state to pass data and ignoring the return values from event handlers. However, this is exactly how I think that functional programming should be extended to deal with programs which continually interact with the outside world. In other words, this is an attempt to find the general case of functional programming.

## Programs as communication

The deep pattern behind recalc (and event systems in general) is *communication*. More precisely, the [call and response pattern](https://en.wikipedia.org/wiki/Call_and_response]), which takes us to the origins of [information](https://en.wikipedia.org/wiki/The_Information:_A_History,_a_Theory,_a_Flood).

By expressing computation as communication, some parts of the program perform *calls* and other parts of the program *respond* to those calls.

The two nouns with which we can structure this paradigm is: *event* and *responder*. The two corresponding verbs are *call* and *match*: events are *called* (almost always by responders), responders are *matched* by events. This constructive circularity can represent programs in an understandable and scalable way.

## Usage

To use recalc, you first need to create a recalc object.

Let's assume that the recalc library has been loaded at the variable `R` (this should happen automatically in the browser - in node.js, you would need to write `var R = require ('recalc')`). To initialize a recalc object you would do this:

```javascript
var r = R ();
```

`r` will be now our recalc object. The reason we use a [constructor](https://en.wikipedia.org/wiki/Constructor_(object-oriented_programming)) (instead of directly making `R` a recalc object) is that you may need to have multiple recalc objects at the same time; by executing the constructor more than once, you can get as many recalc objects as needed.

Every recalc object has six elements that you need to understand in order to use the library. The first three are objects, the other three are functions:

- `r.responders`
- `r.store`
- `r.log`
- `r.call`
- `r.respond`
- `r.forget`

### `r.responders`

The `responders` object is an object that contains all the responders. Whenever an event is called, recalc iterates all the elements within `responders`, and executes those that match the event being called.

To add and remove responders, rather than directly modifying the array, I recommend you use `r.respond` and `r.forget` (we'll see these functions in a moment).

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

An important thing to notice is that the responders are stored outside of the global store.

### `r.log`

An array that contains all the events called and all responders matched. While not essential for recalc's functioning, it is of great help for writing and debugging applications based on recalc. Each of the elements of this array are of the form `{t: TIMESTAMP, id: STRING, from: STRING|UNDEFINED, verb: ..., path: ..., args: UNDEFINED|ARRAY}`. We'll see more of `r.log` in the last section of the readme.

If you want to turn off logging, you can set `r.log` to `false` at the top of your application.

### `r.call`

So far, `responders`, `store` and `log` are simple objects. Where's the action? Enter `r.call`. This function *calls* events.

The standard practice is to say that events are *fired* or *triggered*. We use the term *call* instead, in order to emphasize two things: 1) the complementary nature of *calling* and *responding*; 2) the fact that events represent communication.

Every event has two properties:

- A `verb`, which is a string. For example: `'get'`, `'set'` or `'someverb'`.
- A `path`, which can be either a string, an integer, or an array with zero or more strings or integers. For example, `'hello'`, `1`, or `['hello', '1']`. If you pass a single string or integer, it will be interpreted as an array containing that element (for example, `'hello'` is considered to be `['hello']` and `0` is considered to be `[0]`).

The combination of a verb plus a path seems versatile enough to serve as a general purpose way of building an event system. It works well for [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) and it will probably work well for us too.

Both `verb` and `path` are required. If you don't pass them or pass invalid ones, `r.call` will return `false`. If its inputs are valid, the event will be called and the function will return a string with the id of the event just called (aren't side effects fun?).

For example, to call an event with verb `'fire'` and a path `['hello', 1]`, you can write:

```javascript
r.call ('fire', ['hello', 1]);
```

You can pass unlimited additional arguments when you call an event. These arguments will be received by any responders that are responding to that particular event. For example, if you want to pass `'foo'` and `'bar'`, you can write:

```javascript
r.call ('fire', ['hello', 1], 'foo', 'bar');
```

You can also use wildcards for both verbs and paths. For example:

```javascript
r.call ('*', '*');
r.call ('fire', '*');
r.call ('fire', ['hello', '*']);
```

Wildcards are further explored in the next section - to really understand them, we need to understand how responders are matched against a new event.

### `r.respond`

This function is the one in charge of placing responders into `r.responders`. Every time it is invoked with valid arguments, it will add a responder. It takes the following arguments:

- `verb`, which can be a string or a regex.
- `path`, which can be a string, an integer, a regex, or an array containing those types of elements.
- `options`, an optional object with additional options.
- `rfun`, the function that will be executed when the responder is matched. `rfun` is short for `responder function`.

As with `r.call`, if you pass invalid parameters, this function will return `false` and print an error message. Otherwise it will return the `id` of the responder.

It is important to notice that while *call* and *respond* are complementary operations, `r.call` and `r.respond` are not exactly complementary. `r.call` calls a single event, whereas `r.respond` creates a responder that can be matched multiple times over the course of a program. In other words, an invocation to `r.call` represents a single execution (with multiple possible ramifications) whereas `r.respond` represents multiple possible executions over the course of the program.

Let's see an example: to match the last event we showed on the last section, we could write a responder like this:

```javascript
r.respond ('fire', ['hello', 1], function () {
   // Your logic here.
});
```

Remember that we said earlier that *the `responders` object is an object that contains all the responders. Whenever an event is called, recalc iterates all the elements within `responders`, and executes those that match the event being called.* The most important question regarding responders is: when does a responder match an event? And the answer is: when both the verb and path of the called event match those of the responder.

In the case of the verb, matching is straightforward: the verb of the path must be identical to that of the responder.

In the case of the path, matching is also straightforward (as of recalc v5): the paths of both event and responder must have the same length and each of their elements must match. For example:

```javascript
r.respond ('fire', 'hello', function () {...});
```

The responder above will match the following event:

```javascript
r.call ('fire', 'hello');
```

But it will *not* match the following events:

```javascript
r.call ('fire', ['hello', 'there']);

r.call ('fire', 'nothello');

r.call ('fire', []);
```

Historical notes:
- In recalc v3 and below, the responder path was the "measure" of comparison, and the event path was compared against it. This had the consequence that a responder with a path longer than an event path would not be matched, even if all its elements matched those of the path.
- In recalc v4, event and responder path were compared but if any of them had extra items, those were ignored. While better than v3 logic, for most cases it is best to leave non-trivial path comparison logic to the `match` functions in responders (see below).

If the path of the responder is a regex (or given element of a path is a regex), said regex will be used to match against the corresponding member of the event's path. For example, this responder:

```javascript
r.respond ('hello', /foo|bar/, function () {...});
```

Will be matched by the first and third events below, but not the second.

```javascript
r.call ('hello', 'foo');
r.call ('hello', 'bach');
r.call ('hello', 'bar');
```

responder verbs can also be regexes. For example, this responder:

```javascript
r.respond (/foo|bar/, 'bach', function () {...});
```

Will match the following two events.

```javascript
r.call ('foo', 'bach');
r.call ('bar', 'bach');
```

Let's see now which `options` can be passed to a responder. `options` All of them are optional:

- `id`: a string or integer that will uniquely identify a responder. If you don't pass one, `r.respond` will generate one for you. This `id` will be used as the key where the responder is bound - for example, if `options.id === 'hello'`, the responder will be stored at `r.responders.hello`. If you pass an `id` that's already being used by another responder, an error will be printed and `r.respond` will return `false`. If `id` is a string, it cannot be an `L` followed by digits (or an `E` followed by digits), since those ids are used by recalc when creating responders (without ids) and event ids (in general).
- `parent`: a string or integer that will represent the `id` of this responder. By default this is `undefined`. The purpose of this will be explained below when we explain `r.forget`.
- `burn`: a boolean value. By default this is `undefined`. When you set it to `true`, the responder will auto-destroy after being matched a single time. This allows you to create one-off events that later disappear, hence allowing you to keep clean the event space.
- `match`: a function that is used to determine whether the responder matches a given event. This function works as a bypass to the standard matching logic defined in `r.match`. This function receives two arguments: 1) an object of the form `{verb: ..., path: ..., args: [...]}` which correspond to those of the event being called. If the event was called with no `args`, `args` will be an empty array. 2) the `responder` itself. This function must return `true` to indicate that the given event matches the responder; otherwise, the responder won't be matched for that particular event.
- `priority`: an integer value. By default this is `undefined` (which will be considered as a priority of `0`). The higher the value, the sooner this responder will be matched, compared to other responders that also were matched. You can also use negative values.

This last property reminds us that it is perfectly normal to have more than one responder matching a certain event. `priority` simply lets us make certain responders to be matched ahead of others. This allows for sophisticated (yet necessary) constructs like view redrawing, where some responders have to be called ahead of others to prevent unnecessary operations. As of recalc >= v4.1.0, responders of equal priority are run first by the order in they were created - older responders are matched before new ones (previous versions matched responders of equal priority in arbitrary order). To keep track of which responders were created first, an `index` parameter is added to each `responder` - the lower the `index`, the earlier the responder was created.

It is also perfectly possible to have *zero* responders matching a certain event.

Here's an example of how to invoke `r.respond` with options.

```javascript
r.respond ('fire', 'test', {id: 'matchEverything', parent: 'someOtherresponderId', priority: 3, burn: false}, function () {...});
```

You can also place the `verb` and the `path` inside the options object. In this case, `options` becomes the first argument passed to the function, and is now mandatory (since `r.respond` must receive a `verb` and a `path` always).

```javascript
r.respond ({verb: 'fire', path: 'test', id: 'matchEverything', parent: 'someOtherresponderId', priority: 3, burn: false}, function () {...});
```

### `r.respond` advanced matching: wildcards & empty paths

Within event and responder paths, you can also use wildcards. For example, this responder will be matched by any event that has a path that's exactly one element long:

```javascript
r.respond ('*', '*', function () {...});
```

You can also use wildcards for single elements in an array path. For example, this responder:

```javascript
r.respond ('fire', ['hello', '*', 'handsome'], function () {...});
```

Will be matched by the following events:

```javascript
r.call ('fire', ['hello', 'there', 'handsome']);

r.call ('fire', ['hello', 'out there', 'handsome']);

r.call ('*', ['hello', '*', '*']);
```

A path can also be an empty array. Conceptually, an empty path represents the [root path](https://en.wikipedia.org/wiki/Tree_(data_structure)#Terminology). For example, this responder:

```
r.respond ('fire', []);
```

will only match the following event:

```javascript
r.call ('fire', []);
```

But not the following events:

```javascript
r.call ('fire', '*');

r.call ('fire', ['another', 'path']);
```

To make a responder match any event, you can pass a `match` attribute like the following:

```javascript
r.respond ('*', [], function () {return true});
```

To make a responder match all event with a matching verb, you can pass a `match` attribute like the following:

```javascript
r.respond ('someverb', [], function (ev, responder) {return r.compare (ev.verb, responder.verb)});
```

In both examples above, the `path` passed to `r.respond` makes no difference.

### `r.forget`

This function allows us to remove responders. Its first argument is `id`, which should be a string or integer. This `id` is the one of the responder we are removing.

If you call `r.forget ('foo')`, this will also remove all the responders that have `'foo'` as its parent, plus all their children. In effect, the `parent` property of the responder allows for tree-like deletion of responders.

If you call `r.forget ('foo')` and there's no responder named `foo`, this function will return `false` and print an error.

If you pass a function as the second argument to `r.forget`, this function will be executed for every responder deleted (that is, the responder with the `id` specified, plus all its children). This `onforget` function will receive as first argument the responder that is being deleted.

For example, `r.forget ('foo', function (r) {console.log (r.id)})` will print `foo`, as well as the ids of any responders that have `foo` as parent.

If you pass a function as the second argument to `r.forget`, the responder being deleted will be removed from `r.responders` before this function is executed.

### `r.count`

For the sake of completeness, we mention a seventh element, `r.count`, which is a mere counter variable to keep track of how many events and responders we added so far. This variable serves for generating incrementing ids for events and responders. The `index` variable is added by `r.respond` to each responder references `r.count`, solely for the purpose of disambiguating the matching order of responders that have the same priority (older responders are matched first).

### responder functions

I lied - you also need to understand how responder functions work in order to use recalc. But this is the very last thing.

A responder function always receives an `execution context` (or merely *context*) as its first argument. The context is an object with six elements:

- `verb`, the verb of the event that matched the responder.
- `path`, the path of the event that matched the responder.
- `args`, an array with extra arguments passed to the event. If no extra arguments were passed, this element will be undefined.
- `from`, the id of the event that matched this responder (which is the same value returned by the corresponding `r.call` invocation).
- `cb`, a callback function which you only need to use if your responder function is asynchronous.
- `responder`, the matched responder.

As a convention, I name `context` as `x`. Let's see an example:

```javascript
r.respond ('fire', '*', function (x, extraArg1, extraArg2) {
   // Do something...
});
```

If we call the following event:

```javascript
r.call ('fire', 'hello');
```

Then the responder above will receive an `x` of the form `{verb: 'fire', path: ['hello'], cb: ..., responder: {...}, from: ...}` and both `extraArg1` and `extraArg2` will be `undefined`.

To set `extraArg1` and `extraArg2` to `'foo'` and `'bar'` respectively, you could call the following event:

```javascript
r.call ('fire', 'hello', 'foo', 'bar');
```

This means that any parameters passed to `r.call` besides `verb` and `path` will be passed to the responder function.

In this case, the `x` will be `{verb: 'fire', path: ['hello'], args: ['foo', 'bar'], cb: ..., responder: {...}, from: ...}`.

Having covered the arguments, we now have to see what you to have in mind when writing responder functions. There's two issues: control and data.

Regarding control, if your responder function is synchronous, there's nothing to worry about: once your function finishes executing, the responder functions of any other responders will be executed, one at a time. However, if your function is asynchronous, you need to signal this to recalc, so that the order in which responders are matched will be preserved.

Let's say that you have a responder function that executes an asynchronous operation. The proper way to write it is like this:

```
r.call ('fire', 'hello', function (x) {
   asyncOperation ('foo', 'bar', function () {
      x.cb ();
   });
   return x.cb ();
});
```

The above async responder function does two things that every async responder function should do:

1. Call `x.cb` from within the asynchronous callback, to resume execution of further matching responders.
2. Return `x.cb`, to notify recalc that this is an async function and it should not keep on executing other responders synchronously.

Interestingly enough, if you don't want to resume the execution of further responders, you can skip the call to `x.cb` from within the asynchronous callback. This may be handy in case of an error.

Note that if two responders are matched for a single call, and the responder with the highest priority is async, the second responder will be only called after the first responder finished its async operation.

Regarding the issue of calling events from within a responder (something which is both possible and necessary), it can be done freely as long as the events match responders with synchronous responder functions. If, however, you call an event that matches one or more asynchronous responder functions, you should do that as the *last* thing within the body of your responder function, in order to preserve the sequence. Not only that, you should also return `x.cb` in order to signal that this operation was async, and hence your responder function is async as well.

Regarding data: unless your responder function returns `x.cb` (which signals that it is async), any other return values will be *discarded*. If you want to pass data, you should place it in `r.store`, through a function that calls an event.

Because recalc wants to retain generality, we haven't bundled any functions for calling updates on `r.store` using the event system. This is done on [gotoв](https://github.com/fpereiro/gotoB), which is built on top of recalc. However, consider the following example, where `r.store` is an array:

```javascript
r.respond ('setElement', '*', function (x, value) {
   r.store [x.path] = element;
});

r.call ('setElement', 2, 'something');
```

The two functions above will set the third element of `r.store` to the value `'something'`. This function can be generalized to arrays and objects, and also to support deletions.

### Tracking event & responder chains

Whenever an event is called with `r.call`, or whenever a responder is matched by an event call, an entry will be added to `r.log` with the following fields: `{t: TIMESTAMP, id: STRING, from: STRING|UNDEFINED, verb: ..., path: ..., args: UNDEFINED|ARRAY}`. `id` corresponds to the value returned by a successful invocation to `r.call` or `r.respond` (the `id` of either the event or the responder).

If you are inside a `rfun` and you want to call further events with `r.call`, **you can pass the context (`x`) argument as the first argument to `r.call`**. This will allow you to create a trackable chain of events.

This is quite hard to grasp conceptually, so let's see an example:

```javascript
r.respond ('hello', 'there', {id: 'vamo'}, function (x) {
   r.call (x, 'goodbye', 'goodbye');
});

r.call ('hello', 'there');
```

We first define a `rfun`. Whenever it gets matched, we call `r.call` and we pass the context.

After that, we call an event. Let's say this event will return a value of `id1` (just for exemplary purposes; actual ids generated by recalc are longer). When the `rfun` we defined above is matched, `x.from` will have a value of `id1` (which is the id of the event that matched that `rfun`).

The invocation to `r.call` from within the `rfun` will return another id (let's call it `id2`). The interesting part will happen in `r.log`, which will look like this:

```
[
   {id: 'id1',  from: undefined, verb: 'hello',   path: ['there'],   t: ..., args: undefined},
   {id: 'vamo', from: 'id1',     verb: 'hello',   path: ['there'],   t: ..., args: undefined},
   {id: 'id2',  from: 'vamo',    verb: 'goodbye', path: ['goodbye'], t: ..., args: undefined},
]
```

As you can see, the log for `id2` will mark that this event came *from* `vamo`, which in turn came from `id1`.

Any `rfuns` matched by `id2` will receive `id2` as its `x.from`, and if you pass the context to further event invocations, you'll have longer chains of dependencies. In this way, you will have the raw data to track complex (and often asynchronous) events, which can be useful in many applications.

Two more things to have in mind: if you don't pass `x` to an invocation to `r.call` within a `rfun`, recalc has no way of knowing where that event came from and then the chain will be broken. The second one is that initial invocations of `r.call` (that happen on their own, without being the result of previous events) will naturally receive no context, since there's no context yet for them.

Finally, if you want to turn off logging, you can always do so by setting `r.log` to `false`.

### `r.prod` and `r.error`

In addition to the six main elements of a recalc instance, there's two more that you can optionally use.

The first one is `r.prod`. If you set this flag to `true`, all the recalc functions will stop performing validations. This can be useful to speed up a thoroughly debugged application - you can roughly expect to save execution time by ~20% when invoking `r.call` and by ~90% when invoking `r.respond`. Please be aware that if you turn on `r.prod` and there's an error in your code, you'll experience either an exception or unexpected behavior, so be sure to turn this on only when you are very confident of your code.

The second one is `r.error`. This is a function that is executed whenever one of recalc's functions finds a validation error - if any recalc function receives invalid inputs, it will invoke `r.error` and pass to it one or more arguments describing the error. `r.error` is by default mapped to `teishi.clog`, which prints output to the console and returns `false`.

If you want to override `r.error`, make sure that the function returns `false`, otherwise  It defaults to printing errors to the console, but you can override it with another function for custom error reporting.

### Turning off a responder

If you set a responders `disabled` property to `true` (i.e.: `r.responders.SOMEID.disabled = true`), said responder won't be matched by any events until the property is set to `false` or eliminated. This allows for temporarily disabling a responder without having to store it in a variable, remove it and later add it again.

## Internals

There's six other functions that support the usage functions. If you override them, you can change the innards of recalc. These are:

- `r.isPath`, a helper function to determine whether something is a valid `path`.
- `r.compare`, a helper function for comparing a responder item (either the verb or one of the elements of the path) with a corresponding event item; this function is used by `r.match`.
- `r.logpush`, a helper function that pushes a log entry to `r.log` as long as `r.log` is not `false`.
- `r.mill`, the function that gets executed by `r.call` when an event is called - it represents the core engine of the library.
- `r.match`, the function in charge of matching an event with the relevant responders.
- `r.sort`, the function that sorts the order of the matching responders that will be executed in response to a certain event.

## Source code

The complete source code is contained in `recalc.js`. It is about 200 lines long.

Below is the annotated source.

```javascript
/*
recalc - v5.0.0

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source.
*/
```

### Setup

We wrap the entire file in a self-executing anonymous function. This practice is commonly named [the javascript module pattern](http://yuiblog.com/blog/2007/06/12/module-pattern/). The purpose of it is to wrap our code in a closure and hence avoid making the local variables we define here to be available outside of this module. A cursory test indicates that local variables exceed the scope of a script in the browser, but not in node.js. This means that this pattern is useful only on the browser.

```javascript
(function () {
```

Since this file must run both in the browser and in node.js, we define a variable `isNode` to check where we are. The `exports` object only exists in node.js.

```javascript
   var isNode = typeof exports === 'object';
```

We require [dale](http://github.com/fpereiro/dale) and [teishi](http://github.com/fpereiro/teishi). Note that, in the browser, `dale` and `teishi` will be loaded as global variables.

```javascript
   var dale   = isNode ? require ('dale')   : window.dale;
   var teishi = isNode ? require ('teishi') : window.teishi;
```

We create an alias to `teishi.type`, the function for finding out the type of an element. We do the same for `teishi.clog`, a function for printing logs that also returns `false`.

```javascript
   var type = teishi.type, log = teishi.clog;
```

### Constructor

We define a `main` function that will return a recalc object. A function returning an object which contains the functionality of a library is commonly known as *constructor*. Recalc is built with a constructor pattern because it is reasonable to assume that you might want to use more than one recalc object at the same time; in this case, the constructor will be invoked once per each object that the user desires to create.

`main` takes a single argument, a `store`.

```javascript
   var main = function (store) {
```

The `store` can be `undefined`, an array or an object. By passing a `store` to `main`, the user can already initialize the store to have certain values.

```javascript
      if (teishi.stop ([
         ['store', store, ['array', 'object', 'undefined'], 'oneOf']
      ])) return;
```

We create `r`, a local object which will be the sole thing returned by the constructor. We'll put everything inside of `r`.

```javascript
      var r = {
```

We set `r.responders` to be an empty object; as for `r.store`, we set it to the `store` passed to `main`, else we initialize it to an empty object. Notice that the `responders` are going to be stored outside the `store`.

```javascript
         responders: {},
         store:     store || {},
```

We set `r.log` to an empty array.

```javascript
         log:       [],
```

We set `r.error` to `clog` (`teishi.clog`). By using `r.error` below to report errors, we make it possible to report errors in a different way other than printing them to the console.

```javascript
         error:     clog,
```

Finally we set `r.count` to an object with two keys `e` and `l`, each initialized to 1; we will use this variable to generate ids for events in `r.call` and in `r.respond` to register the order in which responders were added and optionally to generate responder ids.

```javascript
         count:     {e: 1, l: 1}
      }
```

### The three usage functions

We now define the first of the three usage functions, `r.call`, which serves the purpose of firing an event.

```javascript
      r.call = function () {
```

`r.call` is a variadic function (this means it takes a variable number of arguments). While it must always receive a `verb` and a `path`, it can optionally receive a `context` (named `x`, here and henceforth). Since the `verb` cannot be an object, we consider `x` to be present if the first argument is an object. We then consider the following arguments to be the `verb` and the `path`.

```javascript
         var x    = type (arguments [0]) === 'object' ? arguments [0] : undefined;
         var verb = arguments [x ? 1 : 0];
         var path = arguments [x ? 2 : 1];
```

A valid path can only be an array. However, it is quite convenient to write paths with a single element (`['foo']`) as the element itself (`'foo'`); for this reason, `r.call` automatically wraps any simple path (ie: neither an array nor an object) into an array, using `teishi.simple` to detect whether this is the case.

```javascript
         if (teishi.simple (path)) path = [path];
```

If `r.prod` is falsy, we validate the arguments passed to `r.call`.

```javascript
         if (! r.prod && teishi.stop ('r.call', [
```

If `x` is not `undefined`, it must be an object (remember that when detecting whether `x` was passed, we only considered that to happen only if the first argument was an object).

```javascript
            ['context', x, ['object', 'undefined'], 'oneOf'],
```

If `x` is present, we check that `x.from` should be either a string or undefined.

```javascript
            [x !== undefined, [function () {
               return ['x.from', x.from, ['string', 'undefined'], 'oneOf'];
            }]],
```

This concludes our validation of `x`.

We check that `verb` is a string.

```javascript
            ['verb', verb, 'string']
```

If any part of the validation fails, we return `false`. Note we pass `r.error` as an apres argument so that this function will also receive the validation error, if any.

```javascript
         ], function (error) {
            x ? r.error (x, 'r.call', error) : r.error ('r.call', error);
         })) return false;
```
If `r.prod` is falsy, we check that `path` is valid through a helper function `r.isPath` that will return `true` or `false`. While we'll see the implementation of `r.isPath` later, this function makes sure that `path` is an array composed of strings and integers. In case of error, we print it through `r.error` and return `false`.

```javascript
         if (! r.prod && ! r.isPath (path)) return x ? r.error (x, 'r.call', 'Invalid path. Arguments:', {verb: verb, path: path}) : r.error ('r.call', 'Invalid path. Arguments:', {verb: verb, path: path});
```

We define two local variables. First, `oargs`, which is a mere reference to `arguments`. Second, we create `args`, which will be either an array with all the "extra" arguments received by `r.call` (that is, arguments beyond `x`, `verb` and `path`). If no extra arguments are passed, this variable will be undefined.

`args` is done by iterating the `arguments` pseudo-array and using `oargs` as a reference to it.

```javascript
         var oargs = arguments;
         var args  = arguments.length === (x ? 3 : 2) ? undefined : dale.go (dale.times (arguments.length - (x ? 3 : 2), x ? 3 : 2), function (k) {
            return oargs [k];
         });
```

Notice that if `x` was passed, extra arguments will be those starting with index 3 (fourth element and above), while if `x` wasn't passed, extra arguments will be those starting with index 2 (third element and above).

We define a local variable `from` and set it to either `x.responder.id` or `x.from`, only if `x` is present. If present, this will represent the id of a previous responder (or a previous event) that is calling the current event.

```javascript
         var from = x ? (x.responder ? x.responder.id : x.from) : undefined;
```

We now set `x` to a brand new object with the following fields: `from`, with a freshly generated id prepended by an `E` (using and incrementing `r.count.e`); the `verb` and `path` received as arguments; and `args`, the array (or undefined) variable we just created above.

Notice that if `x` was passed to this invocation of `r.call`, we have already overwritten it and only kept a reference to the original `x.from` - no other field of the original context is used.

```javascript
         x = {from: 'E' + r.count.e++, verb: verb, path: path, args: args};
```

We invoke a helper function, `r.logpush`, to add a log entry to `r.log`. We will cover this function later. This function receives the `from` field from the old context (if present, otherwise it will be undefined), the id of the current event being called, the `verb` and `path` received, and the `args` variable containing further arguments.

```javascript
         r.logpush (from, x.from, verb, path, args);
```

We call an internal function, `r.mill`, passing it an array with all the arguments. If there are no extra arguments, we merely pass `x` wrapped in an array; otherwise, we pass an array with `x` plus all the extra arguments. Note that `x` already contains `verb` and `path`.

```javascript
         r.mill (args === undefined ? [x] : [x].concat (args));
```

We return `x.from`, which contains an id to identify the current event invocation. This concludes the function.

```javascript
         return x.from;
      }
```

We now define `r.respond`, a function for creating `responders`, which are functions that are executed when a matching event is called.

```javascript
      r.respond = function () {
```

We set two local variables: `options` (as of yet uninitialized) and `rfun` (set to the last argument passed to `r.respond`. `options` will be an object with options passed to the responder, while `rfun` will be the responder function.

```javascript
         var options, rfun = arguments [arguments.length - 1];
```

`r.respond` is a variadic function that must receive a minimum of two arguments. If it receives less than two arguments, we will print an error and return `false`.

```javascript
         if (arguments.length < 2) return r.error ('r.respond', 'Too few arguments passed to r.respond');
```

If we receive two arguments only, we'll consider `options` to be the first one. Since we already set `rfun` to the last argument received, there's nothing else to do in this case.

```javascript
         if (arguments.length === 2) options = arguments [0];
```

If there's more than two arguments, the function expects `verb` and `path` to be the first two arguments. If there's four arguments in total, the function expects `options` to be the third argument. In either case, `rfun` will be considered to be the last argument. Notice that we place both the `verb` and `path` inside `options`.

```javascript
         else {
            options      = arguments.length === 3 ? {} : arguments [2];
            options.verb = arguments [0];
            options.path = arguments [1];
         }
```

In the same way as `r.call`, `r.respond` automatically wraps any simple path (ie: neither an array nor an object) into an array, using `teishi.simple` to detect whether this is the case.

```javascript
         if (teishi.simple (options.path)) options.path = [options.path];
```

If `r.prod` is falsy, we validate the arguments.

```javascript
         if (! r.prod && teishi.stop ('r.respond', [
```

`options` must be an object and only certain keys are allowed in it.

```javascript
            ['options',   options, 'object'],
            ['keys of options', dale.keys (options), ['verb', 'path', 'id', 'parent', 'priority', 'burn', 'match'], 'eachOf', teishi.test.equal],
```

`options.verb` can be either a string or a regex.

```javascript
            function () {return [
               ['options.verb',     options.verb,     ['string', 'regex'],                'oneOf'],
```

If defined, both `options.id` and `options.parent` must be strings or integers.

```javascript
               ['options.id',       options.id,       ['string', 'integer', 'undefined'], 'oneOf'],
               ['options.parent',   options.parent,   ['string', 'integer', 'undefined'], 'oneOf'],
```

If defined, `options.priority` must be an `integer`, as `options.burn` must be a boolean.

```javascript
               ['options.priority', options.priority, ['undefined', 'integer'],           'oneOf'],
               ['options.burn',     options.burn,     ['undefined', 'boolean'],           'oneOf'],
```

If defined, `options.match` must be a function.

```javascript
               ['options.match',    options.match,    ['undefined', 'function'],          'oneOf']
            ]},
```

`rfun` must be a function.

```javascript
            ['responder function', rfun, 'function']
```

If any part of the validation fails, we return `false`. Note we pass `r.error` as an apres argument so that this function will also receive the validation error, if any.

```javascript
         ], function (error) {
            r.error ('r.respond', error);
         })) return false;
```

If `r.prod` is falsy, we validate `path` with `r.isPath`, which we'll define later. In this case, we consider a `path` as valid if it's an array composed of strings, integers and regexes (which is the reason for passing `true` as the second argument to `r.isPath`). If there's an error, we print it through `r.error` and return `false`.

```javascript
         if (! r.prod && ! r.isPath (options.path, true)) return r.error ('r.respond', 'Invalid path. Options:', options);
```

If `options.id` is not `undefined`, we first coerce it into a string (in case it is an integer). Second, if `r.prod` is falsy, we check that 1) the id has a shape different to `Rd...` (where `d` represents a digit) or `Ed...` since those id forms are used by recalc; and 2) that there's no responder within `r.responders` with that id. If it does, we print an error and return `false`.

```javascript
         if (options.id !== undefined) {
            options.id += '';
            if (! r.prod && options.id.match (/^[L|E]\d+$/)) return r.error ('r.respond', 'If you pass an id for a responder, it cannot be an `R` or an `E` followed by digits, since that is the form that recalc gives to auto-generated ids.');
            if (! r.prod && r.responders [options.id])       return r.error ('r.respond', 'A responder with id', options.id, 'already exists.');
         }
```

If `options.id` is `undefined`, we generate an id of the form `R` followed by the current value of `r.count.l` (which is a number).

```javascript
         else options.id = 'R' + r.count.l;
```

We place `rfun` within the `options` object.

```javascript
         options.rfun = rfun;
```

We set `options.index` to the current value of `r.count.l`, and increment `r.count.l`.

```javascript
         options.index = r.count.l++;
```

By this point, `options` contains all the information relevant for the responder - it is effectively the responder object. We now set it within `r.responders`.

```javascript
         r.responders [options.id] = options;
```

We return the `id` of the responder and close the function.

```javascript
         return options.id;
      }
```

We now define the third and last usage function of recalc, `r.forget`, which has the purpose of removing responders from `r.responders`.

This function takes two arguments, `id` and `fun`. The first one is the `id` of the responder that must be removed. `fun` is an optional function that will be executed when the responder is deleted.

```javascript
      r.forget = function (id, fun) {
```

If present, `fun` must be a function; otherwise we print an error and return `false`. Note we skip the check if `r.prod` is falsy.

```javascript
         if (! r.prod && fun !== undefined && type (fun) !== 'function') return r.error ('r.forget', 'Second argument to r.forget must be a function or undefined. Id is:', id);
```

If `r.prod` is falsy and the responder does not exist, we print an error and return `false`.

```javascript
         if (! r.prod && ! r.responders [id])                            return r.error ('r.forget', 'responder', id, 'does not exist.');
```

We store the responder in a local variable `responder`. We then remove it from `r.responders`.

```javascript
         var responder = r.responders [id];
         delete r.responders [id];
```

If `fun` is present, we invoke it passing `responder` as its first argument. This is why we stored `responder` locally, so that we could pass it to this function *after* the responder was removed from `r.responders`.

```javascript
         if (fun) fun (responder);
```

We iterate all the other responders; if any of them has `id` as its parent, we recursively call `r.forget` on it, taking care to also pass `fun`. This allows for tree-like deletion of responders. Notice that if other responders have `id` as a parent, `fun` will be executed multiple times.

```javascript
         dale.go (r.responders, function (v, k) {
            if (v.parent === id) r.forget (k, fun);
         });
```

There's nothing else to do, so we close the function.

```javascript
      }
```

### Internals

We now define `r.isPath`, a helper function that determines whether a `path` is valid. Besides `path` it takes an optional `regex` flag.

This function is used by the two main functions, once by `r.call` and once by `r.respond`.

```javascript
      r.isPath = function (path, fun, regex) {
```

`path` can be either an array, an integer or a string. If it's an array, it must be comprised of integers and strings. If the `regex` flag is passed, `path` can also be a regex (and if it's an array, it can also include regexes).

The `regex` flag is used by `r.respond`, because responder paths can be (or include) regexes, unlike event paths.

We return the result of invoking `teishi.v` with these rules. We also pass an empty `apres` argument to `teishi.v` so that if there's an error, we don't print it.

```javascript
         return teishi.v ([
            ['path', path, ['array', 'integer', 'string'].concat (regex ? 'regex' : []), 'oneOf'],
            ['path', path,          ['integer', 'string'].concat (regex ? 'regex' : []), 'eachOf']
         ], function () {});
      }
```

We define the third helper function, `r.compare`. It takes two arguments, a `verb` or `path` element belonging to an event and a `verb` or `path` element belonging to a responder. This function is used later by `r.match` to compare verbs and paths.

```javascript
      r.compare = function (eventItem, responderItem) {
```

If either of the arguments is a string containing a star (wildcard), the function returns `true`.

```javascript
         if (eventItem === '*' || responderItem === '*') return true;
```

If the responder element (its `verb` or a part of its `path`), we check whether the corresponding event element matches it. Notice we coerce the event element to a string in case it's an integer. Depending on whether there's a match or not, the function will return `true` or `false`.

```javascript
         if (type (responderItem) === 'regex') return (eventItem + '').match (responderItem) !== null;
```

If we're here, it means that both elements are either strings or integers. The only way there can be a match is if they're identical. We return the result of this comparison and close the function.

```javascript
         return eventItem === responderItem;
      }
```

We define `r.logpush`, the fourth and last helper function, which adds log entries to `r.log` and is invoked only by `r.call` and `r.mill`. The function takes five arguments, most of which are self-explanatory. `from`, the first argument, indicates the id of a previous event or responder that called the current event or matched the current responder; and `id`, the second argument, represents the id of the event being logged.

```javascript
      r.logpush = function (from, id, verb, path, args) {
```

If `r.log` is not falsy (which could happen if the user sets `r.log` to `false` to avoid further logging), we push an entry to `r.log`. This entry contains seven items: `t` (a timestamp), `from`, `id`, `verb`, `path` and `args`. `from` can be either undefined or a string; args can be either `undefined` or an array with at least one element inside.

```javascript
         if (r.log) r.log.push ({t: teishi.time (), from: from, id: id, verb: verb, path: path, args: args});
      }
```

We now define `r.mill`, the implementation function that represents the core engine of the library. This function is invoked by `r.call`. The function takes a single argument, `args`, which is an array with the context (`x`) plus other optional arguments.

```javascript
      r.mill = function (args) {
```

We define an `inner` function that will execute each of the responders matching the event in turn. `matching`, its sole argument, must be an array containing responders.

```javascript
         var inner = function (matching) {
```

If `matching` is empty, there's nothing else to do, so we return `undefined`.

```javascript
            if (matching.length === 0) return;
```

We set up a `cb` (callback) within the context of args; the purpose of this function is to be executed by asynchronous responder functions, so as to preserve the order in which the responder functions are executed, even when some of them are asynchronous and some of them are not. Notice that the callback simply executes `inner` recursively.

```javascript
            args [0].cb = function () {
               inner (matching);
            }
```

We pick the first responder within `matching` and remove it from the array.

```javascript
            var responder = matching.shift ();
```

We set the `responder` of the context to the responder itself.

```javascript
            args [0].responder = responder;
```

If the responder does not exist, we ignore this responder and call `inner` recursively. This check is useful if a certain responder function removes other responder functions that were matched by the same event.

```javascript
            if (! r.responders [responder.id]) return inner (matching);
```

We invoke `r.logpush` to add a log entry to `r.log` for the matched responder. As before, this function receives the `from` field from the old context (if present, otherwise it will be undefined), the id of the responder being matched, the `verb` and `path` of the responder; if `args` were passed to the responder, we pass them as well, otherwise we pass `undefined` as the last argument to denote their abasence.

```javascript
            r.logpush (args [0].from, responder.id, responder.verb, responder.path, args.slice (1).length ? args.slice (1) : undefined);
```

If the responder has the `burn` attribute, we invoke `r.forget` to remove it.

```javascript
            if (responder.burn) r.forget (responder.id);
```

`inner` does two more things. First, it invokes the responder function of the responder, passing `args` to it. Second, if the `rfun` did *not* return a function, then it invokes itself recursively.

Why does `inner` avoid calling itself to process the next responder if `rfun` returns a function? Because in case `rfun` is asynchronous, it must signal that to recalc, and to do so it returns a function. However, the asynchronous `rfun` is responsible for invoking `inner` to execute any other responders; by making `cb` available to the `rfun`, we allow asynchronous functions to resume execution of other matching responders for the same event.

```javascript
            if (type (responder.rfun.apply (null, args)) !== 'function') inner (matching);
         }
```

The last thing left to do is to call `inner` with the matching responders. For this, we invoke `r.match` with the `verb`, `path`, any extra arguments passed to the event invocation, and the list of responders. We then invoke `r.sort` on the output of `r.match`, so that the responders are placed in the right order.

```javascript
         inner (r.sort (r.match (args [0].verb, args [0].path, r.responders, args.slice (1))));
      }
```

This concludes `r.mill`. Let's now define `r.match`, which is the function that takes a `verb`, a `path`, optional `args` and a list of responders and returns only those responders that match an incoming event.

Instead of reading `r.responders` directly, it is possible to use `r.match` to scan a different set of responders - this is the reason for which `responders` is an argument instead of internally being set to `r.responders`.

```javascript
      r.match = function (verb, path, args, responders) {
```

We initialize a `matching` array to store the responders that match the `verb` and `path`.

```javascript
         var matching = [];
```

We iterate the `responders`.

```javascript
         dale.go (responders, function (responder) {
```

If the responder is disabled, we ignore it.

```javascript
            if (responder.disabled) return;
```
If the responder contains a `match` function, we use that function to determine whether the responder matches the event. We invoke that function passing an object with `verb`, `path` and `args`, plus the responder. Depending on whether that function returned `true` or not, we push the `responder` to `matching`; in any case, we're done processing this particular responder.

```javascript
            if (responder.match) return responder.match ({verb: verb, path: path, args: args}, responder) === true ? matching.push (responder) : undefined;
```

We invoke `r.compare` to compare the `verb` of the responder with that of the event. If the comparison is not successful, the responder doesn't match.

```javascript
            if (! r.compare (verb, responder.verb)) return;
```

If we're here, the verbs match!

If the paths don't have equal length, the responder cannot be a match, so we return `undefined`.

```javascript
            if (path.length !== responder.path.length) return;
```

If both the responder and the event have `paths` of length 0, then the responder will be a match. We push `responder` to the list of matching responders.

```javascript
            if (path.length === 0 && responder.path.length === 0) return matching.push (responder);
```

We compare both paths. If any of the comparisons returns `false`, the loop will be interrupted.

```javascript
            if (dale.stop (path, false, function (v, k) {
```

We use `r.compare` to compare the kth elements of both paths. `r.compare` returns only `true` or `false`, and if it returns the latter it means that the comparison failed.

```javascript
               return r.compare (path [k], responder.path [k]);
```

If the last iteration of the loop returned `true`, all iterated elements of both paths match with each other. If this is the case, we push the `responder` to `matching`. Notice that if any of the iterations returned `false`, this will not happen.

```javascript
            })) matching.push (responder);
```

We close the iteration of the responders.

```javascript
         });
```

We return the array of matching responders and close the function.

```javascript
         return matching;
      }
```

We define `r.sort`, a function that takes a list of responders (outputted by `r.match`) and sorts it by priority.

```javascript
      r.sort = function (matching) {
```

We apply `sort` on `matching`, using a custom sort function. Notice that we modify `matching` instead of returning a new sorted array.

```javascript
         return matching.sort (function (a, b) {
```

We sort the responders based on their `priority` value. If no `priority` is defined, we'll consider the responder to have a `priority` of 0. The higher the priority, the closer a responder will be to the beginning of the array.

If both priorities are the same, we disambiguate by giving priority to the responder with the lower `index`. Since oldest responders have a lower index, given the same priority, the older responder will get matched first.

```javascript
            var priority = (b.priority || 0) - (a.priority || 0);
            return priority !== 0 ? priority : a.index - b.index;
         });
      }
```

We are done defining recalc's methods. We return the `r` object and close `main`.

```javascript
      return r;
   }
```

If we are in node, we set `module.exports` to main. If we're in the browser, we create a global variable named `R` and place `main` there.

```javascript
   if (isNode) module.exports  = main;
   else        window.R        = main;
```

We close the module.

```javascript
}) ();
```

## License

recalc is written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.
