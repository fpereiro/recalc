/*
recalc - v5.0.2

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

   // We override dale.clog to avoid seeing a ton of alerts on old browsers.
   try {
      dale.clog = console.log.bind (console);
   }
   catch (error) {
      dale.clog = function () {
         var output = dale.go (arguments, function (v) {return v === undefined ? 'undefined' : v}).join (' ');
         if (window.console) window.console.log (output);
      }
   }

   var tests  = [];

   R.perf = true;

   var error  = function (r, error) {
      r.error ('DEBUG', {
         store:  r.store,
         responders: r.responders
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
            ['r.responders', R ().responders, 'object']
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
         if (r.call.apply (null, args) !== false) return true;
      })) return error (r, 'Invalid input to r.call was accepted.');

      var id = r.call ('fire', 'here');
      if (type (id) !== 'string' || id.split ('') [0] !== 'E') return error (r, 'Invalid event id.');
      if (r.log.length !== 1) return error (r, 'Log not added.');
      var flog = r.log [0];
      if (type (flog) !== 'object') return error (r, 'Invalid log type.');
      if (type (flog.t) !== 'integer' || Math.abs (teishi.time () - flog.t) > 1000) return error (r, 'Invalid timestamp in log.');
      delete flog.t;
      if (! eq (flog, {from: undefined, id: id, verb: 'fire', path: ['here'], args: undefined})) return error (r, 'Invalid log structure.');
   });

   tests.push (function () {

      var r = R ();

      var fun = function () {};

      if (type (r.respond ({verb: 'a', path: 'b'}, fun)) !== 'string')  return error (r, 'respond return error 1.');
      if (r.respond ({verb: null, path: 'b'}, fun) !== false) return error (r, 'respond return error 2.');
      if (r.respond ({verb: 'a', path: null}, fun) !== false) return error (r, 'respond return error 3.');
      if (r.respond ({verb: 'a', path: 'b', id: /a/}, fun) !== false) return error (r, 'respond return error 4.');
      if (r.respond ({verb: 'a', path: 'b', id: 'a'}, fun) !== 'a')  return error  (r, 'respond return error 5.');
      if (r.respond ({verb: 'a', path: 'b', id: 'a'}, fun) !== false) return error (r, 'respond return error 6.');
      if (r.respond ({verb: 'a', path: 'b', priority: 'единственный'}, fun) !== false) return error (r, 'respond return error 7.');
      if (r.respond ({verb: 'a', path: 'b', foo: 'bar'}, fun) !== false) return error (r, 'respond return error 8.');
      if (type (r.respond ('a', 'b', fun)) !== 'string')  return error (r, 'respond return error 9.');
      if (r.respond (NaN, 'b', fun) !== false) return error (r, 'respond return error 10.');
      if (r.respond ('a', NaN, fun) !== false) return error (r, 'respond return error 11.');
      if (r.respond ('a', 'b', {id: /a/}, fun) !== false) return error (r, 'respond return error 12.');
      if (r.respond ('a', 'b', {id: 'b'}, fun) !== 'b')  return error  (r, 'respond return error 13.');
      if (r.respond ('a', 'b', {id: 'b'}, fun) !== false) return error (r, 'respond return error 14.');
      if (r.respond ('a', 'b', {priority: 'единственный'}, fun) !== false) return error (r, 'respond return error 15.');
      if (r.respond ('a', 'b', {foo: 'bar'}, fun) !== false) return error (r, 'respond return error 16.');
      if (r.respond ('a', 'b', {id: 'c'}) !== false) return error (r, 'respond return error 17.');
      if (r.respond ('a', 'b') !== false) return error (r, 'respond return error 18.');
      if (r.respond ({verb: 'a', path: 'b', id: 'R1'}, fun) !== false) return error (r, 'respond return error 19.');
      if (r.respond ({verb: 'a', path: 'b', id: 'E1'}, fun) !== false) return error (r, 'respond return error 20.');
      clog ('Done with validation checks.');
   });

   tests.push (function () {
      var r = R ();
      var id = r.respond ('do', '*', {id: 'R12a'}, function (x, arg1, arg2) {
         if (x.responder.id !== 'R12a') return error (r, 'responder id not passed');
         if (arg1 !== 'foo' || arg2 !== 'bar') return error (r, 'Extra arguments weren\'t passed to rfun.');
      });
      if (type (id) !== 'string') return error (r, 'r.respond didn\'t return id of the created responder.');
      r.call ('do', '*', 'foo', 'bar');

      r.respond ('do2', '*', {id: 'E1!'}, function (x, arg1) {
         if (arguments.length !== 2 || arg1 !== undefined) return error (r, 'Undefined arguments weren\'t passed to rfun.');
      });
      r.call ('do2', [], undefined);

      r.respond ('do3', '*', function (x, arg1) {
         if (arguments.length !== 1) return error (r, 'Undefined arguments passed to rfun but no arguments were passed.');
      });
      r.call ('do3', []);
   });

   tests.push (function () {
      var r = R ({execute: 0, notExecute: 0});

      var which = [];

      var execute = function (n) {
         return function () {
            which.push (n);
         }
      }

      dale.go ([
         ['verb1', '*', execute (1)],
         ['verb1', ['*'], execute (2)],
         ['verb1', 'bar', execute (3)],
         ['verb2', '*', execute (4)],
         ['verb2', ['*'], execute (5)],
         [{verb: 'verb3', path: ['foo', 'bar']}, execute (6)],
         ['verb3', ['foo', '*'], execute (7)],
         ['verb3', [], execute (8)]
      ], function (v) {
         r.respond.apply (null, v);
      });

      r.call ('verb1', '*');
      if (! eq (which, [1, 2, 3])) error (r, 'Matching error 1.');
      r.call ('verb1', ['*']);
      if (! eq (which, [1, 2, 3, 1, 2, 3])) error (r, 'Matching error 2.');
      r.call ('verb1', ['aaa']);
      if (! eq (which, [1, 2, 3, 1, 2, 3, 1, 2])) error (r, 'Matching error 3.');
      r.call ('verb1', ['aaa', 'bbb']);
      if (! eq (which, [1, 2, 3, 1, 2, 3, 1, 2])) error (r, 'Matching error 4.');
      r.call ('verb3', ['foo', 'bar']);
      if (! eq (which, [1, 2, 3, 1, 2, 3, 1, 2, 6, 7])) error (r, 'Matching error 5.');

   });

   tests.push (function () {
      var r = R ({execute: 0, notExecute: 0});

      var execute = function (x) {
         r.store.execute++;
      }

      var notExecute = function (x) {
         r.store.notExecute++;
      }

      var extraArgs = [];

      var v4match = function (ev, responder) {
         if (extraArgs.length === 0) extraArgs.push (ev.args [0], ev.args [1]);
         if (! r.compare (ev.verb, responder.verb)) return false;
         if (ev.path.length === 0 || responder.path.length === 0) return true;

         return dale.stop (dale.times (Math.min (ev.path.length, responder.path.length), 0), false, function (k) {
            return r.compare (ev.path [k], responder.path [k]);
         });
      }

      dale.go ([
         ['verb1', '*',              {match: v4match}, execute],
         ['verb2', ['some', 'path'], {match: v4match}, notExecute],
         [{verb: 'verb3', path: ['foo', 'bar'], match: v4match}, execute],
         ['verb4', [], {match: v4match}, execute],
         ['verb4', '*', {match: v4match}, execute]
      ], function (v) {
         r.respond.apply (null, v);
      });

      r.call ('verb1', '*', 'a', 1);
      if (! eq (extraArgs, ['a', 1])) error (r, 'Matching function didn\'t receive extra arguments.');

      r.call ('verb1', ['*']);
      r.call ('verb1', ['aaa']);
      r.call ('verb1', ['aaa', 'bbb']);
      r.call ('verb3', ['foo', 'bar', 'bar']);

      if (r.store.execute    !== 5) error (r, 'Matching error 1 (v4 matching).');

      r.call ('verb2', ['some', 'path']);
      r.call ('verb3', ['some', 'path']);
      r.call ('verb3', 'foo');
      r.call ('verb3', ['foo']);

      if (r.store.execute    !== 7) error (r, 'Matching error 2 (v4 matching).');

      r.call ('verb2', ['some', 'Path', 'here']);
      r.call ('verb5', 'whatever');

      if (r.store.notExecute !== 1) error (r, 'Matching error 3 (v4 matching).');

      r.call ('verb4', 'a');
      if (r.store.execute    !== 9) error (r, 'Matching error 4 (v4 matching).');
      r.call ('verb4', ['a', 'b']);
      if (r.store.execute    !== 11) error (r, 'Matching error 5 (v4 matching).');
      r.call ('verb4', []);
      if (r.store.execute    !== 13) error (r, 'Matching error 6 (v4 matching).');
      r.call ('verb4', ['*']);
      if (r.store.execute    !== 15) error (r, 'Matching error 7 (v4 matching).');
      r.call ('verb4', '*');
      if (r.store.execute    !== 17) error (r, 'Matching error 8 (v4 matching).');

   });

   tests.push (function () {
      var r = R ();

      var paths = [];

      r.respond ('fire', ['hello', '*', 'handsome'], function (ev) {paths.push (ev.path)});

      r.call ('fire', ['hello', 'there', 'handsome']);
      r.call ('fire', ['hello', 'out there', 'handsome']);
      r.call ('*', ['hello', '*', '*']);
      r.call ('*', ['hello', 'out there', 'not so handsome']);
      r.call ('*', ['hello', '*']);
      r.call ('*', '*');

      if (! eq (paths, [['hello', 'there', 'handsome'], ['hello', 'out there', 'handsome'], ['hello', '*', '*']])) return error (r, 'Wildcard matching error.');

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
         r.respond ('do', 'it', {priority: 2 - k}, v);
      });

      r.call ('do', 'it');

   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it',                function () {r.store.value += 'b'}],
         ['do', 'it', {priority: 1}, function () {r.store.value = 'a'}]
      ], function (v) {
         r.respond.apply (null, v);
      });

      r.call ('do', 'it');

      if (r.store.value !== 'ab') return error (r, 'Filter priority 1 error.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', {priority: -1}, function () {r.store.value += 'c'}],
         ['do', 'it',                 function () {r.store.value += 'b'}],
         ['do', 'it', {priority: 1},  function () {r.store.value = 'a'}]
      ], function (v) {
         r.respond.apply (null, v);
      });

      r.call ('do', 'it');

      if (r.store.value !== 'abc') return error (r, 'Filter priority 2 error.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', {priority: 1}, function () {r.store.value += 'b'}],
         ['do', 'it', {priority: 2}, function () {r.store.value =  'a'}],
         ['do', 'it', {priority: 1}, function () {r.store.value += 'c'}]
      ], function (v) {
         r.respond.apply (null, v);
      });

      r.call ('do', 'it');

      if (r.store.value !== 'abc') return error (r, 'Filter priority 3 error.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', function () {r.store.value =  'a'}],
         ['do', 'it', {id: 2}, function () {r.store.value += 'b'}],
         ['do', 'it', function () {r.store.value += 'c'}]
      ], function (v) {
         r.respond.apply (null, v);
      });

      r.call ('do', 'it');

      if (r.store.value !== 'abc') return error (r, 'Sorting test with numeric id.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', {id: 0}, function () {r.store.value =  'a'}],
         ['do', 'it', {id: ''}, function () {r.store.value += 'b'}]
      ], function (v) {
         r.respond.apply (null, v);
      });

      if (! eq (dale.keys (r.responders).sort (), ['', '0'])) return error (r, 'Valid falsy id values not recognized.');
   });

   tests.push (function () {
      var r = R ();

      dale.go ([
         ['do', 'it', function () {r.store.value =  'a'}],
         ['do', 'it', {id: 2}, function () {r.store.value += 'b'}],
         ['do', 'it', function () {r.store.value += 'c'}]
      ], function (v) {
         r.respond.apply (null, v);
      });

      r.responders ['2'].disabled = true;

      r.call ('do', 'it');

      if (r.store.value !== 'ac') return error (r, 'Disabled responder was matched.');
   });

   tests.push (function () {

      var r = R ();

      var fun = function () {};

      r.respond ('a', 'a', {id: 'a'}, fun);
      r.respond ('a', 'b', {id: 'b'}, fun);
      var id = r.respond ('a', 'c', {id: 'c', parent: 'a'}, fun);

      if (id !== 'c') return error (r, 'r.respond didn\'t return specified id.');

      var onforget = '';

      r.forget ('a', function (r) {onforget += r.id});

      if (! r.responders.b || dale.keys (r.responders).length !== 1) return error (r, 'forget error.');

      if (onforget !== 'ac') return error (r, 'r.forget didn\'t execute onforget function.');

      r = R ();
      r.respond ('a', 'a', {id: 'a'},              fun);
      r.respond ('a', 'b', {id: 'b', parent: 'a'}, fun);
      r.respond ('a', 'c', {         parent: 'b'}, fun);

      r.forget ('a', function (r) {onforget += r.id});

      if (dale.keys (r.responders).length !== 0) return error (r, 'forget error.');
      if (! onforget.match (/^acab/)) return error (r, 'r.forget didn\'t execute onforget function.');
   });

   tests.push (function () {

      var r = R (), counter = 0;

      r.respond ('do', 'it', {id: 'yoestabadiciendoburns', burn: true}, function () {counter++});

      r.call ('do', 'it');

      if (counter !== 1) return error (r, 'burnable responder wasn\'t executed.');
      if (r.responders.yoestabadiciendoburns) return error (r, 'burnable responder wasn\'t burned.');

   });

   tests.push (function () {

      var r = R (), counter = 0;

      var id = r.call ('foo', 'bar');

      r.respond ('a', 'b', function (x) {
         counter++;
         r.call (x, 'a', 'c', 1);
      });

      r.respond ('a', 'c', function (x) {
         if (type (x.args) !== 'array') return error (r, 'x.args wasn\'t passed.');
         if (x.args [0] !== 1 || x.args.length !== 1) return error (r, 'x.args wasn\'t passed properly.');
         counter++;
         r.call (x, 'a', 'd');
      });

      r.respond ('a', 'd', function (x) {
         counter++;
         if (x.verb !== 'a') return error (r, 'x.verb wasn\'t passed.');
         if (type (x.path) !== 'array') return error (r, 'x.path wasn\'t passed.');
         if (x.path [0] !== 'd') return error (r, 'x.path wasn\'t passed properly.');
         if (type (x.responder) !== 'object') return error (r, 'x.responder wasn\'t passed.');
         if (x.responder.verb !== 'a') return error (r, 'x.responder.verb wasn\'t passed.');
         if (type (x.responder.path) !== 'array') return error (r, 'x.responder.path wasn\'t passed.');
         if (x.responder.path [0] !== 'd') return error (r, 'x.responder.path wasn\'t passed properly.');
         if (type (x.from) !== 'string') return error (r, 'x.from type error.');

         if (r.log.length !== 7) return error (r, 'Invalid r.log length.');

         var lid;

         var err = dale.stopNot (r.log, undefined, function (v, k) {
            if (! eq ([undefined, 'E1', 'E2', 'R1/E2', 'E3', 'R2/E3', 'E4', 'R3'] [k], v.from)) return 'r.log from mismatch.';
            if (! eq (['E1', 'E2', 'R1', 'E3', 'R2', 'E4', 'R3'] [k], v.id)) return 'r.log id mismatch.';
            if (! eq (['foo', 'a', 'a', 'a', 'a', 'a', 'a'] [k], v.verb)) return 'r.log verb mismatch.';
            if (! eq ([['bar'], ['b'], ['b'], ['c'], ['c'], ['d'], ['d']] [k], v.path)) return 'r.log path mismatch.';
            if (! eq ([undefined, [0], [0], [1], [1], undefined, undefined] [k], v.args)) return 'r.log args mismatch.';
         });

         if (err) return error (r, err);
         r.call ('a', 'e', 4);
      });

      r.respond ('a', 'e', function (x) {
         var err = dale.stopNot (r.log.slice (7), undefined, function (v, k) {
            if (! eq ([undefined, 'E5'] [k], v.from)) return 'r.log from mismatch.';
            if (! eq (['E5', 'R4'] [k], v.id)) return 'r.log id mismatch.';
            if (! eq (['a', 'a'] [k], v.verb)) return 'r.log verb mismatch.';
            if (! eq ([['e'], ['e']] [k], v.path)) return 'r.log path mismatch.';
            if (! eq ([[4], [4]] [k], v.args)) return 'r.log args mismatch.';
         });
         var llog = teishi.last (r.log, 2);
         if (x.from !== 'E5') return error (r, 'Invalid x.from');
         if (llog.from !== undefined) return error (r, 'x.from broken chain was not broken.');
         if (llog.verb !== 'a' || ! eq (llog.path, ['e'])) return error (r, 'wrong items in x.from item from broken chain');
         r.call (x, 'b', 'a');
         r.call (x, 'b', 'b');

         counter++;
      });

      r.respond ('b', 'a', function (x) {
         if (x.from !== 'E6') return error (r, 'x.from not passed properly #1.');
         counter++;
      });

      r.respond ('b', 'b', function (x) {
         if (x.from !== 'E7') return error (r, 'x.from not passed properly #2.');
         counter++;
      });

      r.call ({from: id}, 'a', 'b', 0);

      if (counter !== 6) return error (r, 'x.item sequence not executed fully.');
   });

   tests.push (function () {

      var r = R (), counter = 0;

      r.respond ('o', 'p', function (x) {
         var llog = teishi.last (r.log, 2);
         if (llog.from !== 'abc') return error (r, 'Incorrect x.from.');
         counter++;
      });

      r.call ({from: 'abc'}, 'o', 'p');

      if (counter !== 1) return error (r, 'r.call (x, ...) sequence #1 not executed fully.');

   });

   tests.push (function () {

      var r = R (), counter = 0;

      r.respond ('q', 'r', function (x) {
         counter++;
      });

      r.call ({from: undefined}, 'q', 'r');

      if (counter !== 1) return error (r, 'r.call (x, ...) sequence #2 not executed fully.');

   });

   tests.push (function () {

      var r = R (), Error;

      r.respond ('s', 't', {id: 'pong'}, function () {});

      r.forget ('pong', function () {
         if (r.responders.pong) Error = 'responder wasn\'t removed before forget fun was executed.';
      });

      if (Error) return error (r, Error);

   });

   tests.push (function () {

      var r = R (), result = [];

      r.respond ('s', /a|b/, function (x) {
         result.push (x.path);
      });

      r.call ('s', 'a');
      r.call ('s', 'b');
      r.call ('s', 'ab');
      r.call ('s', 'c');
      r.call ('s', '*');
      r.call ('s', ['*', 'b']);

      if (! eq (result, [['a'], ['b'], ['ab'], ['*']])) return error (r, 'Regex matching error 1.');

      result = [];

      r.respond (/a/, '*', function (x) {
         result.push (x.path);
      });

      r.call ('a', 1);
      r.call ('ba', 2);
      r.call ('b', 3);
      r.call ('*', 4);

      if (! eq (result, [[1], [2], [4]])) return error (r, 'Regex matching error 2.');

      var counter = 0;

      r.respond ('hello', /foo|bar/, function (x, c) {counter += c});

      r.call ('hello', 'foo', 1);
      r.call ('hello', 'bach', 2);
      r.call ('hello', 'bar', 3);

      if (counter !== 4) return error (r, 'Regex matching error 3.');
      counter = 0;

      r.respond (/foo|bar/, 'bach', function (x, c) {counter += c});

      r.call ('foo', 'bach', 1);
      r.call ('bar', 'bach', 2);
      r.call ('bar', 'bar', 3);

      if (counter !== 3) return error (r, 'Regex matching error 4.');

   });

   tests.push (function () {

      var r = R (), result = [];

      var v3match = function (ev, responder) {
         if (! r.compare (responder.verb, ev.verb)) return;
         if (responder.path.length > ev.path.length) return;
         if (responder.path.length === 0) return true;
         return dale.stop (responder.path, false, function (v2, k2) {
            return r.compare (v2, ev.path [k2]);
         });
      }

      r.respond ('change', ['a', 'b', 'c'], {match: v3match}, function (x) {
         result.push (x.path);
      });

      r.call ('change', ['a', 'b', 'c']);
      r.call ('change', ['a', 'b', 'c', 'd']);
      r.call ('*', ['a', 'b', 'c', 'd']);
      r.call ('change', ['a', 'b', 'd']);
      r.call ('change', ['a']);
      r.call ('change', ['a', 'b']);
      r.call ('change', []);
      r.call ('change', ['*']);

      if (! eq (result, [['a', 'b', 'c'], ['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd']])) return error (r, 'Deep match error.');

   });

   tests.push (function () {

      var r = R ();

      r.respond ('a', [], function (x) {
         r.call (x, 'b', []);
         r.call (x, 'c', []);
      });

      r.respond ('b', [], function (x) {
         r.call (x, 'd', []);
      });

      r.respond ('c', [], function (x) {
         var err = dale.stopNot (r.log, undefined, function (v, k) {
            if (! eq ([undefined, 'E1', 'R1/E1', 'E2', 'R2/E2', 'E3', 'R1/E1', 'E4'] [k], v.from)) return 'r.log from mismatch when doing two calls from same fun #2.';
            if (! eq (['E1', 'R1', 'E2', 'R2', 'E3', 'R4', 'E4', 'R3'] [k], v.id)) return 'r.log id mismatch when doing two calls from same fun #2.';
            if (! eq (['a', 'a', 'b', 'b', 'd', 'd', 'c', 'c'] [k], v.verb)) return 'r.log verb mismatch when doing two calls from same fun #2.';
         });
         if (err) return error (r, err);
      });

      r.respond ('d', [], function (x) {
         var err = dale.stopNot (r.log, undefined, function (v, k) {
            if (! eq ([undefined, 'E1', 'R1/E1', 'E2', 'R2/E2', 'E3'] [k], v.from)) return 'r.log from mismatch when doing two calls from same fun #1.';
            if (! eq (['E1', 'R1', 'E2', 'R2', 'E3', 'R4'] [k], v.id)) return 'r.log id mismatch when doing two calls from same fun #1.';
            if (! eq (['a', 'a', 'b', 'b', 'd', 'd'] [k], v.verb)) return 'r.log verb mismatch when doing two calls from same fun #1.';
         });
         if (err) return error (r, err);
      });

      r.call ('a', []);
   });

   tests.push (function () {

      var r = R (), counter = 0;

      r.respond ('a', [], {id: 'a1'}, function (x) {
         if (x.responder.id !== 'a1') return error (r, 'Invalid responder passed in context #1.');
         counter++;
      });
      r.respond ('a', [], {id: 'a2'}, function (x) {
         if (x.responder.id !== 'a2') return error (r, 'Invalid responder passed in context #2.');
         setTimeout (x.cb, 2);
         counter++;
         return x.cb;
      });
      r.respond ('a', [], {id: 'a3'}, function (x) {
         if (x.responder.id !== 'a3') return error (r, 'Invalid responder passed in context #3.');
         counter++;
         if (counter !== 3) return error (r, 'responder test didn\'t execute all responders.');
      });

      r.call ('a', []);

   });

   tests.push (function () {

      var r = R ();

      r.call ('a', 'b');
      r.log = false;
      r.call ('c', 'd');
      if (r.log !== false) return error (r, 'Disabled r.log wasn\'t disabled.');
   });

   var benchmark = function () {
      var T = {dev: {respond: 0, call: 0}, prod: {respond: 0, call: 0}};
      var run = function (prod) {
         var t = teishi.time (), r = R ();
         r.prod = prod;
         dale.go (dale.times (50), function (v) {
            r.respond (v % 2 === 0 ? 'a' : 'b', {0: [], 1: ['c'], 2: ['c', 'd'], 3: ['e', 'f']} [v % 4], {priority: v % 7}, function () {});
         });
         T [prod ? 'prod' : 'dev'].respond += teishi.time () - t;
         t = teishi.time ();
         dale.go (dale.times (100), function (v) {
            r.call (v % 2 === 0 ? 'a' : 'b', {0: [], 1: ['c'], 2: ['c', 'd'], 3: ['e', 'f']} [v % 4], {priority: v % 7});
         });
         T [prod ? 'prod' : 'dev'].call += teishi.time () - t;
         t = teishi.time ();
      }
      dale.go (dale.times (10), function (v) {
         run (v % 2 === 0);
      });

      clog ('Benchmark', T);
   }

   tests.push (function () {

      var r = R (), counter;

      r.respond ('a', [], {priority: 1}, function (x) {
         setTimeout (function () {
            counter = 1;
            x.cb ();
         }, 10);
         return x.cb;
      });

      r.respond ('a', [], function () {
         if (counter !== 1) return error (r, 'async sequence wasn\'t executed in order.');
      });

      r.call ('a', []);

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
         r.respond ('fire', '*', {priority: 2 - k}, v);
      });
      r.call ('fire', '*');
   });

   dale.go (tests, function (v) {
      return v ();
   });

}) ();
