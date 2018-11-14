# recalc

> "[T]hus, the external world would only have a triggering role in the release of the internally-determined activity of the nervous system." --Humberto Maturana

> "Should that function take the whole world as input and return a brand new world as output? Why even use functional programming, then?" --[James Hague](http://prog21.dadgum.com/26.html)

recalc is a library for reasoning functionally about side effects. Its core ideas are: use events to pass *control* and a global store that is updated through events to pass *data*.

## Current status of the project

The current version of recalc, v3.8.1, is considered to be *stable* and *complete*. [Suggestions](https://github.com/fpereiro/recalc/issues) and [patches](https://github.com/fpereiro/recalc/pulls) are welcome. Besides bug fixes, there are no future changes planned.

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
<script src="https://cdn.jsdelivr.net/gh/fpereiro/dale@ac36810de20ee18d5d5077bd2ccb94628d621e58/dale.js"></script>
<script src="https://cdn.jsdelivr.net/gh/fpereiro/teishi@e1d6313b4269c54d163ac2097d6713d9e9e3f213/teishi.js"></script>
<script src=""></script>
```

And you also can use it in node.js. To install: `npm install recalc`

recalc is pure ES5 javascript and it should work in any version of node.js (tested in v0.8.0 and above). Browser compatibility is as follows:

- Chrome 15 (released 2011/10/25) and above.
- Firefox 22 (released 2013/02/23) and above.
- Safari 5.1 (released 2011/07/20) and above.
- Internet Explorer 9 (released 2011/03/14) and above.
- Microsoft Edge 14 (released 2016/02/19) and above.
- Opera 11.6 (released 2011/12/07) and above.
- Yandex 14.12 (released 2014/12/11) and above.

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

But an interactive program, like a game or a web page, has to process interactions from the user and the server while it is running. The question is, how do we handle these interactions/side effects in a functional manner?

This library is an attempt to answer that question.

If we can't get rid of side effects, we can instead embrace them without forgetting our functional roots. We can consider that each side effect is an *event*. When a side effect comes in, we make our program fire an event. And here's the kicker: there might be one or more listeners for a given event. Those listeners are simply functions that then operate in consequence. In this way, you can work on the problem of passing control around when side effects come into the picture.

The other question is: how do we pass data around? Since there might be multiple listeners to an event, operating sequentially or parallely, it would be messy to depend on return values. Instead, we can create a central object where we can store all the state of the application. A *global object* shared by all functions (I hope you're cringing now), which we call the *store*.

But wait! If these events and their handlers modify this global object, wouldn't be this merely be imperative programming? It would, except for one catch: data changes on the global state can also be expressed as events, to which functions can respond/react. So you don't just increment a variable. You increment it through an event that notifies everyone concerned. Events allow us to create first-class side effects, so that we can define them, pass them around and reason about them in a clear way.

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
- A `path`, which can be either a string, an integer, or an array with zero or more strings or integers. For example, `'hello'`, `1`, or `['hello', '1']`. If you pass a single string or integer, it will be interpreted as an array containing that element (for example, `'hello'` is considered to be `['hello']` and `0` is considered to be `[0]`).

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

- `verb`, which can be a string or a regex.
- `path`, which can be a string, an integer, a regex, or an array containing those types of elements.
- `options`, an optional object with additional options.
- `rfun`, the function that will be executed when the route is matched. `rfun` is short for `route function`.

As with `r.do`, if you pass invalid parameters, this function will return `false` and print an error message. Otherwise it will return the `id` of the route.

For example, to match the last event we showed on the last section, we could write a route like this:

```javascript
r.listen ('fire', ['hello', 1], function () {
   // Your logic here.
});
```

Remember that we said earlier that *the `routes` object is an object that contains all the event handlers. Whenever an event is fired, recalc iterates all the elements within `routes`, and executes the route handlers of those routes that match the event being fired.* The most important question regarding routes is: when does a route match an event? And the answer is: when both the verb and path of the executed event match those of the route.

In the case of the verb, matching is straightforward: the verb of the path must be identical to that of the route.

In the case of the path, matching is somewhat more involved. Let's explain this with an example. Suppose you have the following route:

```javascript
r.listen ('fire', 'hello', function () {...});
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

If the path of the route is a regex (or given element of a path is a regex), said regex will be used to match against the corresponding member of the event's path. For example, this listener:

```javascript
r.listen ('hello', /foo|bar/, function () {...});
```

Will be fired by the first and third events below, but not the second.

```javascript
r.do ('hello', 'foo');
r.do ('hello', 'bach');
r.do ('hello', 'bar');
```

Route verbs can also be regexes. For example, this route:

```javascript
r.listen (/foo|bar/, 'bach', function () {...});
```

Will match the following two events.

```javascript
r.do ('foo', 'bach');
r.do ('bar', 'bach');
```

Let's see now which `options` can be passed to a route. `options` All of them are optional:

- `id`: a string or integer that will uniquely identify a route. If you don't pass one, `r.listen` will generate one for you. This `id` will be used as the key where the route is bound - for example, if `options.id === 'hello'`, the route will be stored at `r.routes.hello`. If you pass an `id` that's already being used by another route, an error will be printed and `r.listen` will return `false`.
- `parent`: a string or integer that will represent the `id` of this route. By default this is `undefined`. The purpose of this will be explained below when we explain `r.forget`.
- `burn`: a boolean value. By default this is `undefined`. When you set it to `true`, the route will auto-destroy after being matched/executed a single time. This allows you to create one-off events that later disappear, hence allowing you to keep clean the event space.
- `priority`: an integer value. By default this is `undefined` (which will be considered as a priority of `0`). The higher the value, the sooner this route will be executed in case of a match. You can also use negative values.
- `match`: a function that is used to determine whether the route matches a given event. This function works as a bypass to the standard matching logic defined in `r.match`. This function receives the `route` as the first argument and an object of the form `{verb: ..., path: ...}` with the `verb` and `path` corresponding to the given event. This function must return `true` to indicate that the given event matches the route.

This last property reminds us that it is perfectly normal to have more than one route matching a certain event. `priority` simply lets us make certain routes to be executed ahead of others. Again, I have pragmatic reasons for this, but still no carefully considered rationale. Routes of equal priority are run in arbitrary order - to ensure a specific sequence, you need to use the `priority` parameter.

It is also perfectly possible to have *zero* routes matching a certain event.

Here's an example of how to invoke `r.listen` with options.

```javascript
r.listen ('fire', 'test', {id: 'matchEverything', parent: 'someOtherRouteId', priority: 3, burn: false}, function () {...});
```

You can also place the `verb` and the `path` inside the options object. In this case, `options` becomes the first argument passed to the function, and is now mandatory (since `r.listen` must receive a `verb` and a `path` always).

```javascript
r.listen ({verb: 'fire', path: 'test', id: 'matchEverything', parent: 'someOtherRouteId', priority: 3, burn: false}, function () {...});
```

### `r.listen` advanced matching: wildcards & empty paths

Within event and route paths, you can also use wildcards. For example, this route will be executed by any event that has a path that's at least one element long:

```javascript
r.listen ('*', '*', function () {...});
```

You can also use wildcards for single elements in an array path. For example, this route:

```javascript
r.listen ('fire', ['hello', '*', 'handsome'], function () {...});
```

Will be matched by the following events:

```javascript
r.do ('fire', ['hello', 'there', 'handsome']);

r.do ('fire', ['hello', 'out there', 'handsome']);

r.do ('*', ['hello', '*']);
```

A path can also be an empty array. Conceptually, an empty path represents the [root path](https://en.wikipedia.org/wiki/Tree_(data_structure)#Terminology). In practical terms, if the path of a route is an empty array, that route will match any event that has a matching verb, no matter what their paths are. For example, this route:

```
r.listen ('fire', []);
```

will match the following events:

```javascript
r.do ('fire', 'hello');

r.do ('fire', '*');

r.do ('fire', ['another', 'path']);

r.do ('fire', []);
```

And this route will match any event:

```javascript
r.listen ('*', []);
```

If the path of an event is an empty array, the only routes that can possibly match it have 1) an empty array as path; and 2) a matching verb. For example, the only two routes that can match this event:

```javascript
r.do ('foo', []);
```

are:

```javascript
r.listen ('foo', []);
r.listen ('*', []);
```

### `r.forget`

This function allows us to remove routes. Its first argument is `id`, which should be a string or integer. This `id` is the one of the route we are removing.

If you call `r.forget ('foo')`, this will also remove all the routes that have `'foo'` as its parent, plus all their children. In effect, the `parent` property of the route allows for tree-like deletion of routes.

If you call `r.forget ('foo')` and there's no route named `foo`, this function will return `false` and print an error.

If you pass a function as the second argument to `r.forget`, this function will be executed for every route deleted (that is, the route with the `id` specified, plus all its children). This `onforget` function will receive as first argument the route that is being deleted.

For example, `r.forget ('foo', function (r) {console.log (r.id)})` will print `foo`, as well as the ids of any routes that have `foo` as parent.

If you pass a function as the second argument to `r.forget`, the route being deleted will be removed from `r.routes` before this function is executed.

### Route functions

I lied - you also need to understand how route functions work in order to use recalc. But this is the very last thing.

A route function always receives a `context` as its first argument. The context is an object with five or six elements:

- `verb`, the verb of the event that matched the route.
- `path`, the path of the event that matched the route.
- `args`, an array with extra arguments passed to the event. If no extra arguments were passed, this element won't be present.
- `cb`, a callback function which you only need to use if your route function is asynchronous.
- `route`, the matched route.
- `from`, an array that contains a list of all the events that caused the current event to fire.

As a convention, I name `context` as `x`. Let's see an example:

```javascript
r.listen ('fire', '*', function (x, extraArg1, extraArg2) {
   // Do something...
});
```

If we execute the following event:

```javascript
r.do ('fire', 'hello');
```

Then the route above will receive an `x` of the form `{verb: 'fire', path: ['hello'], cb: ..., route: {...}, from: [...]}` and both `extraArg1` and `extraArg2` will be `undefined`.

To set `extraArg1` and `extraArg2` to `'foo'` and `'bar'` respectively, you could trigger the following event:

```javascript
r.do ('fire', 'hello', 'foo', 'bar');
```

This means that any parameters passed to `r.do` besides `verb` and `path` will be passed to the route function.

In this case, the `x` will be `{verb: 'fire', path: ['hello'], args: ['foo', 'bar'], cb: ..., route: {...}, from: [...]}`.

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

Regarding the issue of calling events from within a route (something which is both possible and encouraged), it can be done freely as long as the events trigger routes with synchronous route functions. If, however, you trigger an event that triggers one or more asynchronous route functions, you should do that as the *last* thing within the body of your route function, in order to preserve the sequence. Not only that, you should also return `x.cb` in order to signal that this operation was async, and hence your route function is async as well.

Regarding data: unless your route function returns `x.cb` (which signals that it is async), any other return values will be *discarded*. If you want to pass data, you should place it in `r.store`, through a function that triggers an event.

Because recalc wants to retain generality, we haven't bundled any functions for doing updates on `r.store` using the event system. This is done on [gotoв](https://github.com/fpereiro/gotoB), which is built on top of recalc. However, consider the following example, where `r.store` is an array:

```javascript
r.listen ('setElement', '*', function (x, value) {
   r.store [x.path] = element;
});

r.do ('setElement', 2, 'something');
```

The two functions above will set the third element of `r.store` to the value `'something'`. This function can be generalized to arrays and objects, and also to support deletions.

One final thing we left unmentioned: `x.from` is an object that helps you debug nested event calls. To use it, you can pass `x` as the first argument to `r.do`, whenever you are calling it from within a `rfun`: for example, instead of writing `r.do ('verb', 'path')` you would instead write `r.do (x, 'verb', 'path')`. If you do so, you will find that `x.from` contains an array of objects, each of them of the shape: `{verb: ..., path: ..., args: ..., date: ...}`. Each of these objects describe the verb, path, arguments and date for each of the events fired in the chain. The first object corresponds to the event that triggered the particular rfun you are in, while subsequent items refer to the event that triggered the rfun that in turn triggered another event that triggered the particular rfun you are in.

Notice that each of the objects in `x.from` looks a lot like `x`: `verb` and `path` are the same, `args` is only present if `args` were passed to that particular event; the only differences are that `date` is added, while `route` and `cb` are removed (the former is removed because it has nothing to do with an event, only with the route; while the latter is only useful programatically, not for logging purposes).

A final note: you can invoke `r.do` from outside a `rfun` passing a valid context. For a context to be considered valid, its `from` key must be either undefined, an object or an array of objects (what you put inside the objects is up to you. If you pass an array of objects, that's already considered `x.from`. If you pass a single object, it will be wrapped into an array and considered `x.from`. For example, if you invoke `r.do ({from: {ev: 'onclick', id: 'foo'}, 'a', 'b')`, the `rfuns` triggered by that event will receive a `x.from` array with two elements: the first one will be `{verb: 'a', path: ['b'], date: ...}` and the second one will be `{ev: 'onclick', id: 'foo'}`.

## Implementation functions

There's six other functions that support the usage functions. If you override them, you can change the innards of recalc. These are:

- `r.isPath`, a helper function to determine whether something is a valid `path`.
- `r.random`, a helper function for generating random ids for new routes.
- `r.compare`, a helper function for comparing a route item (either the verb or one of the elements of the path) with a corresponding event item; this function is used by `r.match`.
- `r.mill`, the function that gets executed by `r.do` when an event is fired - it represents the core engine of the library.
- `r.match`, the function in charge of matching an event with the relevant routes.
- `r.sort`, the function that sorts the order of the matching routes that will be executed in response to a certain event.

## Source code

The complete source code is contained in `recalc.js`. It is about 200 lines long.

Below is the annotated source.

```javascript
/*
recalc - v3.8.1

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source.
*/
```

### Setup

We wrap the entire file in a self-executing anonymous function. This practice is commonly named [the javascript module pattern](http://yuiblog.com/blog/2007/06/12/module-pattern/). The purpose of it is to wrap our code in a closure and hence avoid making the local variables we define here to be available outside of this module. A cursory test indicates that local variables exceed the scope of a file in the browser, but not in node.js. Globals exceed their scope despite this pattern - but we won't be using them.

```javascript
(function () {
```

Since this file must run both in the browser and in node.js, we define a variable `isNode` to check where we are. The `exports` object only exists in node.js.

```javascript
   var isNode = typeof exports === 'object';
```

We require [dale](http://github.com/fpereiro/dale) and [teishi](http://github.com/fpereiro/teishi).

```javascript
   var dale   = isNode ? require ('dale')   : window.dale;
   var teishi = isNode ? require ('teishi') : window.teishi;
```

```javascript
   if (isNode) var lith = exports;
   else        var lith = window.lith = {};
```

We create an alias to `teishi.t`, the function for finding out the type of an element. We do the same for `teishi.l`, a function for printing logs that also returns `false`.

```javascript
   var type = teishi.t, log = teishi.l;
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
      var r = {};
```

We set `r.routes` to be an empty object; as for `r.store`, we set it to the `store` passed to `main`, else we initialize it to an empty object. Notice that the `routes` are going to be stored outside the `store`.

```javascript
      r.routes  = {};
      r.store   = store || {};
```

### The three usage functions

We now define the first of the three usage functions, `r.do`, which serves the purpose of firing an event.

```javascript
      r.do = function () {
```

`r.do` is a variadic function (this means it takes a variable number of arguments). While it must always receive a `verb` and a `path`, it can optionally receive a `context` (named `x`, here and henceforth). Since the `verb` cannot be an object, we consider `x` to be present if the first argument is an object. We then consider the following arguments to be the `verb` and the `path`.

```javascript
         var x = type (arguments [0]) === 'object' ? arguments [0] : undefined;
         var verb = arguments [x ? 1 : 0];
         var path = arguments [x ? 2 : 1];
```

A valid path can only be an array. However, it is quite convenient to write paths with a single element (`['foo']`) as the element itself (`'foo'`); for this reason, `r.do` automatically wraps any simple path (ie: neither an array nor an object) into an array, using `teishi.simple` to detect whether this is the case.

```javascript
         if (teishi.simple (path)) path = [path];
```

We create a local variable `args` that will consist of an array with the following elements: 1) a `context` (either `x`, if present, or a brand new empty object otherwise); 2) `verb`; 3) `path`; 4) any further arguments passed to `r.do`.

```javascript
         var args = [x || {}, verb, path].concat ([].slice.call (arguments, x ? 3 : 2));
```

We now validate the arguments passed to `r.do`.

```javascript
         if (teishi.stop ('r.do', [
```

If `x` is not `undefined`, it must be an object (remember that when detecting whether `x` was passed, we only considered that to happen only if the first argument was an object). We now check that `x.from` should be either an array, an object, or `undefined`.

```javascript
            [x !== undefined, [function () {
               return [
                  ['x.from', x.from, ['array', 'object', 'undefined'], 'oneOf'],

```

If `x.from` is an array, we check that each of its contents is an object. Note that this also allows `x.from` to be an empty array. We do no further validation of the objects within `x.from`. This concludes our validation of `x`.

```javascript
                  [type (x.from) === 'array', [function () {
                     return ['x.from', x.from, 'object', 'each'];
                  }]],
               ];
            }]]
```

We check that `verb` is a string; as for `path`, we invoke a helper function `r.isPath` that will return `true` or `false` depending on whether `path` is a valid path. While we'll see the implementation of `r.isPath` later, this function makes sure that `path` is an array composed of strings and integers.

```javascript
            ['verb', verb, 'string'],
            r.isPath (path, 'r.do')
```

If any part of the validation fails, we return `false`.

```javascript
         ])) return false;
```

We call an internal function, `r.mill`, passing it `args`. For doing this, we use `apply`, which allows us to pass to the function an array with all the arguments.

```javascript
         r.mill.apply (null, args);
```

We return `true` to indicate that the event has been fired successfully. This concludes the function.

```javascript
         return true;
      }
```

We now define `r.listen`, a function for creating `routes`, which are functions that are executed when a matching event is fired.

```javascript
      r.listen = function () {
```

We set two local variables: `options` (as of yet uninitialized) and `rfun` (set to the last argument passed to `r.listen`. `options` will be an object with options passed to the route, while `rfun` will be the route function.

```javascript
         var options, rfun = arguments [arguments.length - 1];
```

`r.listen` is a variadic function that must receive a minimum of two arguments. If it receives less than two arguments, we will print an error and return `false`.

```javascript
         if (arguments.length < 2) return log ('r.listen', 'Too few arguments passed to r.listen');
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

In the same way as `r.do`, `r.listen` automatically wraps any simple path (ie: neither an array nor an object) into an array, using `teishi.simple` to detect whether this is the case.

```javascript
         if (teishi.simple (options.path)) options.path = [options.path];
```

We now validate the arguments.

```javascript
         if (teishi.stop ('r.listen', [
```

`options` must be an object and only certain keys are allowed in it.

```javascript
            ['options',   options, 'object'],
            ['keys of options', dale.keys (options), ['verb', 'path', 'id', 'parent', 'priority', 'burn', 'match'], 'eachOf', teishi.test.equal],
```

`options.verb` can be either a string or a regex.

```javascript
            function () {return [
               ['options.verb', options.verb, ['string', 'regex'], 'oneOf'],
```

As for `path`, we validate it with `r.isPath`, which we'll define later. In this case, we consider a `path` as valid if it's an array composed of strings, integers and regexes.

```javascript
               r.isPath (options.path, 'r.listen', true),
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
               ['options.match',    options.match,    ['undefined', 'function'], 'oneOf']
            ]},
```

`rfun` must be a function.

```javascript
            ['route function', rfun, 'function']
```

If any part of the validation fails, we return `false`.

```javascript
         ])) return false;

```

If `options.id` is present, we check that there's no route within `r.routes` with that id. If it does, we print an error and return `false`.

```javascript
         if (options.id) {
            if (r.routes [options.id]) return log ('r.listen', 'A route with id', options.id, 'already exists.');
         }
```

If `options.id` is not present, we invoke `r.random` to generate one.

```javascript
         else options.id = r.random ();
```

We place `rfun` within the `options` object.

```javascript
         options.rfun = rfun;
```

By this point, `options` contains all the information relevant for the route - it is effectively the route object. We now set it within `r.routes`.

```javascript
         r.routes [options.id] = options;
```

We return the `id` of the route and close the function.

```javascript
         return options.id;
      }
```

We now define the third and last usage function of recalc, `r.forget`, which has the purpose of removing routes from `r.routes`.

This function takes two arguments, `id` and `fun`. The first one is the `id` of the route that must be removed. `fun` is an optional function that will be executed when the route is deleted.

```javascript
      r.forget = function (id, fun) {
```

If present, `fun` must be a function; otherwise we print an error and return `false`.

```javascript
         if (fun !== undefined && type (fun) !== 'function') return log ('Second argument to r.forget must be a function or undefined.');
```

If the route does not exist, we print an error and return `false`.

```javascript
         if (! r.routes [id]) return log ('Route', id, 'does not exist.');
```

We store the route in a local variable `route`. We then remove it from `r.routes`.

```javascript
         var route = r.routes [id];
         delete r.routes [id];
```

If `fun` is present, we invoke it passing `route` as its first argument. This is why we stored `route` locally, so that we could pass it to this function *after* the route was removed from `r.routes`.

```javascript
         if (fun) fun (route);
```

We iterate all the other routes; if any of them has `id` as its parent, we recursively call `r.forget` on it, taking care to also pass `fun`. This allows for tree-like deletion of routes. Notice that if other routes have `id` as a parent, `fun` will be executed multiple times.

```javascript
         dale.do (r.routes, function (v, k) {
            if (v.parent === id) r.forget (k, fun);
         });
```

There's nothing else to do, so we close the function.

```javascript
      }
```

### Implementation functions

We define `r.random`, a helper function used by `r.listen` to create random ids for new routes. This function takes no arguments.

```javascript
      r.random = function () {
```

This function returns a random alphanumeric string (with possible characters being `0-9` and `a-f`). To generate it, we create a random number, convert it into a hexadecimal string and finally remove the first two characters (`0.`) which are present because `Math.random` always generates a number between 0 and 1.

```javascript
         return Math.random ().toString (16).slice (2);
      }
```

We now define `r.isPath`, a helper function that determines whether a `path` is valid. Besides `path`, it takes `fun` (a string with the name of the function that invokes it) and an optional `regex` flag.

This function is used by two usage functions, once by `r.do` and once by `r.listen`.

```javascript
      r.isPath = function (path, fun, regex) {
```

`path` can be either an array, an integer or a string. If it's an array, it must be comprised of integers and strings. If the `regex` flag is passed, `path` can also be a regex (and if it's an array, it can also include regexes).

The `regex` flag is used by `r.listen`, because route paths can be (or include) regexes, unlike event paths.

```javascript
         return teishi.v (fun, [
            ['path', path, ['array', 'integer', 'string'].concat (regex ? 'regex' : []), 'oneOf'],
            ['path', path,          ['integer', 'string'].concat (regex ? 'regex' : []), 'eachOf'],
         ]);
      }
```

We define the third and last implementation helper function, `r.compare`. It takes two arguments, a `verb` or `path` element belonging to a route and a `verb` or `path` element belonging to an event. This function is used later by `r.match` to compare verbs and paths.

```javascript
      r.compare = function (rvp, evp) {
```

If either of the arguments is a string containing a star (wildcard), the function returns `true`.

```javascript
         if (rvp === '*' || evp === '*') return true;
```

If the route element (its `verb` or a part of its `path`), we check whether the corresponding event element matches it. Notice we coerce the event element to a string in case it's an integer. Depending on whether there's a match or not, the function will return `true` or `false`.

```javascript
         if (type (rvp) === 'regex') return (evp + '').match (rvp) !== null;
```

If we're here, it means that both elements are either strings or integers. The only way there can be a match is if they're identical. We return the result of this comparison and close the function.

```javascript
         return rvp === evp;
      }
```

We now define `r.mill`, the implementation function that represents the core engine of the library. This function is invoked by `r.do`. The function takes three arguments, a context (`x`), a `verb` and a `path`.

```javascript
      r.mill = function (x, verb, path) {
```

The function does some initialization of `x.from`, the object within the context that contains a list of events that fired earlier in the event chain. If `x.from` doesn't exist, we initialize it to an array. If it's an object, we set `x.from` to be an array containing that object; this is done so that if you invoke `r.do` with a manually created `x.from` object, you don't need to wrap it in an array. Finally, if `x.from` is an array, we *copy* it.

After this, `from` will represent our `x.from` object. Because we copied it, we can modify it without changing the `x.from` of other events further up the change.

```javascript
         var from;
         if (! x.from)                        from = [];
         else if (type (x.from) === 'object') from = [x.from];
         else                                 from = x.from.slice (0);
```

We place a new object as the first element of `from`, containing `date`, the `verb` and the `path`.

```javascript
         from.unshift ({date: new Date ().toISOString (), verb: verb, path: path});
```

We create an array `args` with the arguments to be passed to the route function. They consist of `verb`, `path`, and the `from` we just created. Notice we also append any extra arguments received by `r.mill` (which are the same ones passed to `r.do`).

```javascript
         var args = [{verb: arguments [1], path: arguments [2], from: from}].concat ([].slice.call (arguments, 3));
```

If extra arguments were passed to `r.mill`, we place them both inside the context and within the `from` object within the context.

```javascript
         if (arguments.length > 3) {
            args [0].args = [].slice.call (arguments, 3);
            from [0].args = [].slice.call (arguments, 3);
         }
```

We define an `inner` function that will execute each of the routes matching the event in turn. `matchingRoutes`, its sole argument, must be an array containing routes.

```javascript
         var inner = function (matchingRoutes) {
```

If `matchingRoutes` is empty, there's nothing else to do, so we return `undefined`.

```javascript
            if (matchingRoutes.length === 0) return;
```

We set up a `cb` (callback) within the context of args; the purpose of this function is to be executed by asynchronous route functions, so as to preserve the order in which the route functions are executed, even when some of them are asynchronous and some of them are not. Notice that the callback simply executes `inner` recursively.

```javascript
            args [0].cb = function () {
               inner (matchingRoutes);
            }
```

We pick the first route within `matchingRoutes` and remove it from the array.

```javascript
            var route = matchingRoutes.shift ();
```

We set the `route` of the context to the route itself.

```javascript
            args [0].route = route;
```

If the route does not exist, we ignore this route and call `inner` recursively. This check is useful if a certain route function removes other route functions that were matched by the same event.

```javascript
            if (! r.routes [route.id]) return inner (matchingRoutes);
```

If the route has the `burn` attribute, we invoke `r.forget` to remove it.

```javascript
            if (route.burn) r.forget (route.id);
```

`inner` does two more things. First, it invokes the route function of the route, passing `args` to it. Second, if the `rfun` did *not* return a function, then it invokes itself recursively.

Why does `inner` avoid calling itself to process the next route if `rfun` returns a function? Because in case `rfun` is asynchronous, it must signal that to recalc, and to do so it returns a function. However, the asynchronous `rfun` is responsible for invoking `inner` to execute any other routes; by making `cb` available to the `rfun`, we allow asynchronous functions to resume execution of other matching routes for the same event.

```javascript
            if (type (route.rfun.apply (null, args)) !== 'function') inner (matchingRoutes);
         }
```

The last thing left to do is to call `inner` with the matching routes. For this, we invoke `r.match` with the `verb`, `path` and the list of routes. We then invoke `r.sort` on the output of `r.match`, so that the routes are placed in the right order.

```javascript
         inner (r.sort (r.match (verb, path, r.routes)));
      }
```

This concludes `r.mill`. Let's now define `r.match`, which is the function that takes a `verb`, a `path` and a list of routes and returns only those routes that match an incoming event.

Instead of reading `r.routes` directly, it is possible to use `r.match` to scan a different set of routes - this is the reason for which `routes` is an argument instead of internally being set to `r.routes`.

```javascript
      r.match = function (verb, path, routes) {
```

We initialize a `matching` array to store the routes that match the `verb` and `path`.

```javascript
         var matching = [];
```

We iterate the `routes`.

```javascript
         dale.do (routes, function (route) {
```

If the route contains a `match` function, we use that function to determine whether the route matches the event. We invoke that function passing the route and an object with `verb` and `path`. Depending on whether that function returned `true` or not, we push the `route` to `matching`; in any case, we're done processing this particular route.

```javascript
            if (route.match) return route.match (route, {verb: verb, path: path}) === true ? matching.push (route) : undefined;
```

We invoke `r.compare` to compare the `verb` of the route with that of the event. If the comparison is not successful, the route doesn't match.

```javascript
            if (! r.compare (route.verb, verb)) return;
```

If the route's `path` is longer than that of the event, we consider that there can not be a match.

```javascript
            if (route.path.length > path.length) return;
```

If the route's `path` is of length zero, this means its path will necessarily match the event's path. Since the verb is compatible (otherwise we wouldn't be here), we push this route to `matching` and return.

```javascript
            if (route.path.length === 0) return matching.push (route);
```

We iterate the elements of `route.path`. If any of the iterations returns `false`, the loop will be interrupted.

```javascript
            if (dale.stop (route.path, false, function (v2, k2) {
```

We compare the element of the route's `path` against the corresponding element of the event's path. For this, we use `r.compare` again. If `r.compare` returns `false`, the loop is interrupted; if it returns `true`, it keeps on going until the last element of the path is matched.

```javascript
               return r.compare (v2, path [k2]);
```

If the last iteration of the loop returned `true`, all the elements of the route's `path` match the corresponding elements of the event's `path`. If this is the case, we push the `route` to `matching`.

```javascript
            })) matching.push (route);
```

We return the array of matching routes and close the function.

```javascript
         return matching;
      }
```

We define `r.sort`, a function that takes a list of routes (outputted by `r.match`) and sorts it by priority.

```javascript
      r.sort = function (matching) {
```

We apply `sort` on `matching`, using a custom sort function. Notice that we modify `matching` instead of returning a new sorted array.

```javascript
         return matching.sort (function (a, b) {
```

We sort the routes based on their `priority` value. If no `priority` is defined, we'll consider the route to have a `priority` of 0. The higher the priority, the closer a route will be to the beginning of the array.

```javascript
            return (b.priority || 0) - (a.priority || 0);
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
