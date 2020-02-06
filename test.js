/*
recalc - v4.1.0

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

To run the tests:
   - node.js: enter `node test` at the command prompt.
   - browser: copy the following four lines into a new file and open it with your browser.

// Start copying here

<script src="node_modules/dale/dale.js"></script>
<script src="node_modules/teishi/teishi.js"></script>
<script src="recalc.js"></script>
<script src="test.js"></script>

// End copying here

*/

(function () {

   var isNode = typeof exports === 'object';

   var dale   = isNode ? require ('dale')        : window.dale;
   var teishi = isNode ? require ('teishi')      : window.teishi;
   var R      = isNode ? require ('./recalc.js') : window.R;

   var type   = teishi.type, clog = teishi.clog, eq = teishi.eq;

   var tests  = [];

   R.perf = true;

   var error  = function (r, error) {
      r.error ('DEBUG', {
         store:  r.store,
         listeners: r.listeners
      });
      R.perf = false;
      throw new Error (error);
   }

   tests.push (function () {
      teishi.stop ([
         ['R () with no state', R (),   'object'],
         ['R () with array state',  R ([]), 'object'],
         ['R () with object state', R ({}), 'object'],
         ['R () with invalid state', R (/invalid/), 'undefined'],
         function () {return [
            ['R () default store', R ().store,   'object'],
            ['R () object store',  R ({}).store, 'object'],
            ['R () array store',   R ([]).store, 'array'],
            ['R () object store',  R ({a: 'b'}).store.a,     'b', teishi.test.equal],
            ['R () object store',  R (['a', 'b']).store [1], 'b', teishi.test.equal],
            ['r.listeners', R ().listeners, 'object']
         ]}
      ], function (err) {
         error (R (), err);
      });
   });

   tests.push (function () {
      var r = R ();

      if (dale.stop ([
         [],
         [/invalidverb/, 'path'],
         ['someverb', /invalidpath/],
         ['someverb', [/invalid/, 'path']],
         [['someverb'], [/invalid/, 'path']],
         [/x/, 'verb', 'path'],
         [[/x/], 'verb', 'path'],
         [{from: 22}, 'verb', 'path'],
         [{from: null}, 'verb', 'path'],
         [{from: /null/}, 'verb', 'path'],
         [{from: []}, 'verb', 'path'],
         [{from: {}}, 'verb', 'path'],
         [{from: [[]]}, 'verb', 'path'],
         [{from: ['a']}, 'verb', 'path'],
         [{from: [{}, '']}, 'verb', 'path'],
         [{from: [[{}]]}, 'verb', 'path'],
         [[], 'verb', 'path']
      ], true, function (args) {
         if (r.say.apply (null, args) !== false) return true;
      })) return error (r, 'Invalid input to r.say was accepted.');

      var id = r.say ('fire', 'here');
      if (type (id) !== 'string' || id.split ('') [0] !== 'E') return error (r, 'Invalid event id.');
      if (r.log.length !== 1) return error (r, 'Log not added.');
      var flog = r.log [0];
      if (type (flog) !== 'object') return error (r, 'Invalid log type.');
      if (type (flog.t) !== 'integer' || Math.abs (teishi.time () - flog.t) > 1000) return error (r, 'Invalid timestamp in log.');
      delete flog.t;
      if (! teishi.eq (flog, {from: undefined, id: id, verb: 'fire', path: ['here'], args: undefined})) return error (r, 'Invalid log structure.');
   });

   tests.push (function () {
      var r = R ();
      var id = r.listen ('do', '*', function (x, arg1, arg2) {
         if (arg1 !== 'foo' || arg2 !== 'bar') return error (r, 'Extra arguments weren\'t passed to lfun.');
      });
      if (type (id) !== 'string') return error (r, 'r.listen didn\'t return id of the created listener.');
      r.say ('do', '*', 'foo', 'bar');

      r.listen ('do2', '*', function (x, arg1) {
         if (arguments.length !== 2 || arg1 !== undefined) return error (r, 'Undefined arguments weren\'t passed to lfun.');
      });
      r.say ('do2', [], undefined);

      r.listen ('do3', '*', function (x, arg1) {
         if (arguments.length !== 1) return error (r, 'Undefined arguments passed to lfun but no arguments were passed.');
      });
      r.say ('do3', []);
   });

   tests.push (function () {
   });

   tests.push (function () {
      var r = R ({execute: 0, notExecute: 0});

      var execute = function (x) {
         r.store.execute++;
      }

      var notExecute = function (x) {
         r.store.notExecute++;
      }

      dale.go ([
         ['verb1', '*',              execute],
         ['verb2', ['some', 'path'], notExecute],
         [{verb: 'verb3', path: ['foo', 'bar']},   execute],
         ['verb4', [], execute],
         ['verb4', '*', execute]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.say ('verb1', '*');
      r.say ('verb1', ['*']);
      r.say ('verb1', ['aaa']);
      r.say ('verb1', ['aaa', 'bbb']);
      r.say ('verb3', ['foo', 'bar', 'bar']);

      if (r.store.execute    !== 5) error (r, 'Matching error 1.');

      r.say ('verb2', ['some', 'path']);
      r.say ('verb3', ['some', 'path']);
      r.say ('verb3', 'foo');
      r.say ('verb3', ['foo']);

      if (r.store.execute    !== 7) error (r, 'Matching error 2.');

      r.say ('verb2', ['some', 'Path', 'here']);
      r.say ('verb5', 'whatever');

      if (r.store.notExecute !== 1) error (r, 'Matching error 3.');

      r.say ('verb4', 'a');
      if (r.store.execute    !== 9) error (r, 'Matching error 4.');
      r.say ('verb4', ['a', 'b']);
      if (r.store.execute    !== 11) error (r, 'Matching error 5.');
      r.say ('verb4', []);
      if (r.store.execute    !== 13) error (r, 'Matching error 6.');
      r.say ('verb4', ['*']);
      if (r.store.execute    !== 15) error (r, 'Matching error 7.');
      r.say ('verb4', '*');
      if (r.store.execute    !== 17) error (r, 'Matching error 8.');

   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         function () {r.store.value = 'a'},
         function () {r.store.value += 'b'},
         function () {
            if (r.store.value !== 'ab') return error (r, 'Sequence error.');
         }
      ], function (v, k) {
         r.listen ('do', 'it', {priority: 2 - k}, v);
      });

      r.say ('do', 'it');

   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it',                function () {r.store.value += 'b'}],
         ['do', 'it', {priority: 1}, function () {r.store.value = 'a'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.say ('do', 'it');

      if (r.store.value !== 'ab') return error (r, 'Filter priority 1 error.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', {priority: -1}, function () {r.store.value += 'c'}],
         ['do', 'it',                 function () {r.store.value += 'b'}],
         ['do', 'it', {priority: 1},  function () {r.store.value = 'a'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.say ('do', 'it');

      if (r.store.value !== 'abc') return error (r, 'Filter priority 2 error.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', {priority: 1}, function () {r.store.value += 'b'}],
         ['do', 'it', {priority: 2}, function () {r.store.value =  'a'}],
         ['do', 'it', {priority: 1}, function () {r.store.value += 'c'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.say ('do', 'it');

      if (r.store.value !== 'abc') return error (r, 'Filter priority 3 error.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', function () {r.store.value =  'a'}],
         ['do', 'it', {id: 2}, function () {r.store.value += 'b'}],
         ['do', 'it', function () {r.store.value += 'c'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.say ('do', 'it');

      if (r.store.value !== 'abc') return error (r, 'Sorting test with numeric id.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', {id: 0}, function () {r.store.value =  'a'}],
         ['do', 'it', {id: ''}, function () {r.store.value += 'b'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      if (! teishi.eq (dale.keys (r.listeners).sort (), ['', '0'])) return error (r, 'Valid falsy id values not recognized.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', function () {r.store.value =  'a'}],
         ['do', 'it', {id: 2}, function () {r.store.value += 'b'}],
         ['do', 'it', function () {r.store.value += 'c'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.listeners ['2'].disabled = true;

      r.say ('do', 'it');

      if (r.store.value !== 'ac') return error (r, 'Disabled listener was matched.');
   });

   tests.push (function () {

      var r = R ();

      var fun = function () {};

      if (type (r.listen ({verb: 'a', path: 'b'}, fun)) !== 'string')  return error (r, 'listen return error 1.');
      if (r.listen ({verb: null, path: 'b'}, fun) !== false) return error (r, 'listen return error 2.');
      if (r.listen ({verb: 'a', path: null}, fun) !== false) return error (r, 'listen return error 3.');
      if (r.listen ({verb: 'a', path: 'b', id: /a/}, fun) !== false) return error (r, 'listen return error 4.');
      if (r.listen ({verb: 'a', path: 'b', id: 'a'}, fun) !== 'a')  return error  (r, 'listen return error 5.');
      if (r.listen ({verb: 'a', path: 'b', id: 'a'}, fun) !== false) return error (r, 'listen return error 6.');
      if (r.listen ({verb: 'a', path: 'b', priority: 'единственный'}, fun) !== false) return error (r, 'listen return error 7.');
      if (r.listen ({verb: 'a', path: 'b', foo: 'bar'}, fun) !== false) return error (r, 'listen return error 8.');
      if (type (r.listen ('a', 'b', fun)) !== 'string')  return error (r, 'listen return error 9.');
      if (r.listen (NaN, 'b', fun) !== false) return error (r, 'listen return error 10.');
      if (r.listen ('a', NaN, fun) !== false) return error (r, 'listen return error 11.');
      if (r.listen ('a', 'b', {id: /a/}, fun) !== false) return error (r, 'listen return error 12.');
      if (r.listen ('a', 'b', {id: 'b'}, fun) !== 'b')  return error  (r, 'listen return error 13.');
      if (r.listen ('a', 'b', {id: 'b'}, fun) !== false) return error (r, 'listen return error 14.');
      if (r.listen ('a', 'b', {priority: 'единственный'}, fun) !== false) return error (r, 'listen return error 15.');
      if (r.listen ('a', 'b', {foo: 'bar'}, fun) !== false) return error (r, 'listen return error 16.');
      if (r.listen ('a', 'b', {id: 'c'}) !== false) return error (r, 'listen return error 17.');
      if (r.listen ('a', 'b') !== false) return error (r, 'listen return error 18.');
   })

   tests.push (function () {

      var r = R ();

      var fun = function () {};

      r.listen ('a', 'a', {id: 'a'}, fun);
      r.listen ('a', 'b', {id: 'b'}, fun);
      var id = r.listen ('a', 'c', {id: 'c', parent: 'a'}, fun);

      if (id !== 'c') return error (r, 'r.listen didn\'t return specified id.');

      var onforget = '';

      r.forget ('a', function (r) {onforget += r.id});

      if (! r.listeners.b || dale.keys (r.listeners).length !== 1) return error (r, 'forget error.');

      if (onforget !== 'ac') return error (r, 'r.forget didn\'t execute onforget function.');

      r = R ();
      r.listen ('a', 'a', {id: 'a'},              fun);
      r.listen ('a', 'b', {id: 'b', parent: 'a'}, fun);
      r.listen ('a', 'c', {         parent: 'b'}, fun);

      r.forget ('a', function (r) {onforget += r.id});

      if (dale.keys (r.listeners).length !== 0) return error (r, 'forget error.');
      if (! onforget.match (/^acab/)) return error (r, 'r.forget didn\'t execute onforget function.');
   });

   tests.push (function () {

      var r = R (), counter = 0;

      r.listen ('do', 'it', {id: 'yoestabadiciendoburns', burn: true}, function () {counter++});

      r.say ('do', 'it');

      if (counter !== 1) return error (r, 'burnable listener wasn\'t executed.');
      if (r.listeners.yoestabadiciendoburns) return error (r, 'burnable listener wasn\'t burned.');

   });

   tests.push (function () {

      var r = R (), counter = 0;

      var id = r.say ('foo', 'bar');

      r.listen ('a', 'b', function (x) {
         counter++;
         r.say (x, 'a', 'c', 1);
      });

      r.listen ('a', 'c', function (x) {
         if (type (x.args) !== 'array') return error (r, 'x.args wasn\'t passed.');
         if (x.args [0] !== 1 || x.args.length !== 1) return error (r, 'x.args wasn\'t passed properly.');
         counter++;
         r.say (x, 'a', 'd');
      });

      r.listen ('a', 'd', function (x) {
         counter++;
         if (x.verb !== 'a') return error (r, 'x.verb wasn\'t passed.');
         if (type (x.path) !== 'array') return error (r, 'x.path wasn\'t passed.');
         if (x.path [0] !== 'd') return error (r, 'x.path wasn\'t passed properly.');
         if (type (x.listener) !== 'object') return error (r, 'x.listener wasn\'t passed.');
         if (x.listener.verb !== 'a') return error (r, 'x.listener.verb wasn\'t passed.');
         if (type (x.listener.path) !== 'array') return error (r, 'x.listener.path wasn\'t passed.');
         if (x.listener.path [0] !== 'd') return error (r, 'x.listener.path wasn\'t passed properly.');
         if (type (x.from) !== 'string') return error (r, 'x.from type error.');

         if (r.log.length !== 4) return error (r, 'Invalid r.log length.');

         var lid;

         var err = dale.stopNot (r.log, undefined, function (v, k) {
            if (k === 0 && v.id !== id) return 'Passed x.from was ignored.';
            if (k > 0 && v.from !== r.log [k - 1].id) return 'x.from chain has invalid id.';
            if (! teishi.eq (['foo', 'a', 'a', 'a'] [k], v.verb)) return 'r.log verb mismatch.';
            if (! teishi.eq ([['bar'], ['b'], ['c'], ['d']] [k], v.path)) return 'r.log path mismatch.';
            if (! teishi.eq ([undefined, [0], [1], undefined] [k], v.args)) return 'r.log args mismatch.';
         });

         if (err) return error (r, err);
         r.say ('a', 'e', 4);
      });

      r.listen ('a', 'e', function (x) {
         counter++;
         var llog = teishi.last (r.log);
         if (x.from !== llog.id) return error (r, 'x.from type error.');
         if (llog.from !== undefined) return error (r, 'x.from broken chain was not broken.');
         if (llog.verb !== 'a' || ! teishi.eq (llog.path, ['e'])) return error (r, 'wrong items in x.from item from broken chain');
         r.say (x, 'b', 'a');
         r.say (x, 'b', 'b');
      });

      r.listen ('b', 'a', function (x) {
         var llog = teishi.last (r.log);
         var blog = teishi.last (r.log, 2);
         if (llog.from !== blog.id) return error (r, 'x.from not passed properly #1.');
         if (llog.verb !== 'b' || ! teishi.eq (llog.path, ['a'])) return (r, 'x.from log contains invalid verb/path #1.');
         counter++;
      });

      r.listen ('b', 'b', function (x) {
         var llog = teishi.last (r.log);
         var blog = teishi.last (r.log, 3);
         if (llog.from !== blog.id) return error (r, 'x.from not passed properly #2.');
         if (llog.verb !== 'b' || ! teishi.eq (llog.path, ['b'])) return (r, 'x.from log contains invalid verb/path #2.');
         counter++;
      });

      r.say ({from: id}, 'a', 'b', 0);

      if (counter !== 6) return error (r, 'x.item sequence not executed fully.');
   });

   tests.push (function () {

      var r = R (), counter = 0;

      r.listen ('o', 'p', function (x) {
         var llog = teishi.last (r.log);
         if (llog.from !== 'abc') return error (r, 'Incorrect x.from.');
         counter++;
      });

      r.say ({from: 'abc'}, 'o', 'p');

      if (counter !== 1) return error (r, 'r.say (x, ...) sequence #1 not executed fully.');

   });

   tests.push (function () {

      var r = R (), counter = 0;

      r.listen ('q', 'r', function (x) {
         counter++;
      });

      r.say ({from: undefined}, 'q', 'r');

      if (counter !== 1) return error (r, 'r.say (x, ...) sequence #2 not executed fully.');

   });

   tests.push (function () {

      var r = R (), Error;

      r.listen ('s', 't', {id: 'pong'}, function () {});

      r.forget ('pong', function () {
         if (r.listeners.pong) Error = 'listener wasn\'t removed before forget fun was executed.';
      });

      if (Error) return error (r, Error);

   });

   tests.push (function () {

      var r = R (), result = [];

      r.listen ('s', /a|b/, function (x) {
         result.push (x.path);
      });

      r.say ('s', 'a');
      r.say ('s', 'b');
      r.say ('s', 'ab');
      r.say ('s', 'c');
      r.say ('s', '*');
      r.say ('s', ['*', 'b']);

      if (! eq (result, [['a'], ['b'], ['ab'], ['*'], ['*', 'b']])) return error (r, 'Regex matching error 1.');

      result = [];

      r.listen (/a/, '*', function (x) {
         result.push (x.path);
      });

      r.say ('a', 1);
      r.say ('ba', 2);
      r.say ('b', 3);
      r.say ('*', 4);

      if (! eq (result, [[1], [2], [4]])) return error (r, 'Regex matching error 2.');

      var counter = 0;

      r.listen ('hello', /foo|bar/, function (x, c) {counter += c});

      r.say ('hello', 'foo', 1);
      r.say ('hello', 'bach', 2);
      r.say ('hello', 'bar', 3);

      if (counter !== 4) return error (r, 'Regex matching error 3.');
      counter = 0;

      r.listen (/foo|bar/, 'bach', function (x, c) {counter += c});

      r.say ('foo', 'bach', 1);
      r.say ('bar', 'bach', 2);
      r.say ('bar', 'bar', 3);

      if (counter !== 3) return error (r, 'Regex matching error 4.');

   });

   tests.push (function () {

      var r = R (), result = [];

      var dmatch = function (listener, ev) {
         if (! r.compare (listener.verb, ev.verb)) return;
         if (listener.path.length > ev.path.length) return;
         if (listener.path.length === 0) return true;
         return dale.stop (listener.path, false, function (v2, k2) {
            return r.compare (v2, ev.path [k2]);
         });
      }

      r.listen ('change', ['a', 'b', 'c'], {match: dmatch}, function (x) {
         result.push (x.path);
      });

      r.say ('change', ['a', 'b', 'c']);
      r.say ('change', ['a', 'b', 'c', 'd']);
      r.say ('*', ['a', 'b', 'c', 'd']);
      r.say ('change', ['a', 'b', 'd']);
      r.say ('change', ['a']);
      r.say ('change', ['a', 'b']);
      r.say ('change', []);
      r.say ('change', ['*']);

      if (! eq (result, [['a', 'b', 'c'], ['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd']])) return error (r, 'Deep match error.');

   });

   tests.push (function () {

      var r = R ();

      r.listen ('a', [], function (x) {
         r.say (x, 'b', []);
         r.say (x, 'c', []);
      });

      r.listen ('b', [], function (x) {
         r.say (x, 'd', []);
      });

      r.listen ('c', [], function (x) {
         var clog = dale.stopNot (r.log, undefined, function (v) {
            if (v.id === x.from) return v;
         });
         var alog = dale.stopNot (r.log, undefined, function (v) {
            if (v.id === clog.from) return v;
         });
         if (alog.verb !== 'a' || alog.path.length !== 0 || alog.from !== undefined) return error (r, 'Invalid from sequence when doing two calls from the same fun #1.');
      });

      r.listen ('d', [], function (x) {
         var dlog = dale.stopNot (r.log, undefined, function (v) {
            if (v.id === x.from) return v;
         });
         var blog = dale.stopNot (r.log, undefined, function (v) {
            if (v.id === dlog.from) return v;
         });
         if (blog.verb !== 'b') return error (r, 'Invalid from sequence when doing two calls from the same fun #2.');
         var alog = dale.stopNot (r.log, undefined, function (v) {
            if (v.id === blog.from) return v;
         });
         if (alog.verb !== 'a') return error (r, 'Invalid from sequence when doing two calls from the same fun #3.');
      });

      r.say ('a', []);
   });

   tests.push (function () {

      var r = R (), counter = 0;

      r.listen ('a', [], {id: 'a1'}, function (x) {
         if (x.listener.id !== 'a1') return error (r, 'Invalid listener passed in context #1.');
         counter++;
      });
      r.listen ('a', [], {id: 'a2'}, function (x) {
         if (x.listener.id !== 'a2') return error (r, 'Invalid listener passed in context #2.');
         setTimeout (x.cb, 2);
         counter++;
         return x.cb;
      });
      r.listen ('a', [], {id: 'a3'}, function (x) {
         if (x.listener.id !== 'a3') return error (r, 'Invalid listener passed in context #3.');
         counter++;
         if (counter !== 3) return error (r, 'Listener test didn\'t execute all listeners.');
      });

      r.say ('a', []);

   });

   tests.push (function () {

      var r = R ();

      r.say ('a', 'b');
      r.log = false;
      r.say ('c', 'd');
      if (r.log !== false) return error (r, 'Disabled r.log wasn\'t disabled.');
   });

   var benchmark = function () {
      var T = {dev: {listen: 0, say: 0}, prod: {listen: 0, say: 0}};
      var run = function (prod) {
         var t = teishi.time (), r = R ();
         r.prod = prod;
         dale.go (dale.times (50), function (v) {
            r.listen (v % 2 === 0 ? 'a' : 'b', {0: [], 1: ['c'], 2: ['c', 'd'], 3: ['e', 'f']} [v % 4], {priority: v % 7}, function () {});
         });
         T [prod ? 'prod' : 'dev'].listen += teishi.time () - t;
         t = teishi.time ();
         dale.go (dale.times (100), function (v) {
            r.say (v % 2 === 0 ? 'a' : 'b', {0: [], 1: ['c'], 2: ['c', 'd'], 3: ['e', 'f']} [v % 4], {priority: v % 7});
         });
         T [prod ? 'prod' : 'dev'].say += teishi.time () - t;
         t = teishi.time ();
      }
      dale.go (dale.times (10), function (v) {
         run (v % 2 === 0);
      });

      clog ('Benchmark', T);
   }

   tests.push (function () {

      var r = R (), counter;

      r.listen ('a', [], {priority: 1}, function (x) {
         setTimeout (function () {
            counter = 1;
            x.cb ();
         }, 10);
         return x.cb;
      });

      r.listen ('a', [], function () {
         if (counter !== 1) return error (r, 'async sequence wasn\'t executed in order.');
      });

      r.say ('a', []);

      if (counter !== undefined) return error (r, 'Something very strange just happened; sync call executed after async!');

      r = R ();
      setTimeout (function () {
         if (r.store.value !== 'onetwothree') return error (r, 'Async sequence wasn\'t executed.');
         if (isNode) clog  ('Success', 'All tests were successful!');
         else        alert ('All tests were successful!');
         benchmark ();
      }, 500);
      dale.go ([
         function (x) {
            setTimeout (function () {
               r.store.value = 'one';
               x.cb ();
            }, 1);
            return x.cb;
         },
         function (s) {
            r.store.value += 'two';
         },
         function (x) {
            setTimeout (function () {
               r.store.value += 'three';
               x.cb ();
            }, 1);
            return x.cb;
         },
         function () {
            if (r.store.value !== 'onetwothree') return error (r, 'Async sequence wasn\'t executed in order: ' + r.store.value);
         }
      ], function (v, k) {
         r.listen ('fire', '*', {priority: 2 - k}, v);
      });
      r.say ('fire', '*');
   });

   dale.go (tests, function (v) {
      return v ();
   });

}) ();
