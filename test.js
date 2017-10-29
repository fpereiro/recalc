/*
recalc - v3.5.1

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

   var type   = teishi.t, log = teishi.l;

   var tests  = [];

   R.perf = true;

   var error  = function (r, error) {
      log ('DEBUG', {
         store:  r.store,
         routes: r.routes
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
            ['r.routes', R ().routes, 'object']
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
      ], true, function (args) {
         if (r.do.apply (null, args) !== false) return true;
      })) return error (r, 'Invalid input to r.do was accepted.');

      if (r.do ('fire', 'here') !== true) return error (r, 'Valid input to r.do didn\'t return true.');
   });

   tests.push (function () {
      var r = R ();
      var id = r.listen ('do', '*', function (x, arg1, arg2) {
         if (arg1 !== 'foo' || arg2 !== 'bar') return error (r, 'Extra arguments weren\'t passed to rfun.');
      });
      if (type (id) !== 'string') return error (r, 'r.listen didn\'t return id of the created route.');
      r.do ('do', '*', 'foo', 'bar');
   });

   tests.push (function () {
      var r = R ();
      setTimeout (function () {
         if (r.store.value !== 'onetwothree') return error (r, 'Async sequence wasn\'t executed.');
      }, 2000);
      dale.do ([
         function (x) {
            setTimeout (function () {
               r.store.value = 'one';
               x.cb ();
            }, 100);
            return x.cb;
         },
         function (s) {
            r.store.value += 'two';
         },
         function (x) {
            setTimeout (function () {
               r.store.value += 'three';
               x.cb ();
            }, 100);
            return x.cb;
         },
         function () {
            if (r.store.value !== 'onetwothree') return error (r, 'Async sequence wasn\'t executed in order: ' + r.store.value);
         }
      ], function (v, k) {
         r.listen ('fire', '*', {priority: 2 - k}, v);
      });
      r.do ('fire', '*');
   });

   tests.push (function () {
      var r = R ({execute: 0, notExecute: 0});

      var execute = function () {
         r.store.execute++;
      }

      var notExecute = function (x) {
         r.store.notExecute++;
      }

      dale.do ([
         ['verb1', '*',              execute],
         ['verb2', ['some', 'path'], notExecute],
         [{verb: 'verb3', path: ['foo', 'bar']},   execute],
         ['verb4', [], execute],
         ['verb4', '*', execute]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.do ('verb1', '*');
      r.do ('verb1', ['*']);
      r.do ('verb1', ['aaa']);
      r.do ('verb1', ['aaa', 'bbb']);
      r.do ('verb3', ['foo', 'bar', 'bar']);

      if (r.store.execute    !== 5) error (r, 'Matching error 1.');

      r.do ('verb3', ['some', 'path']);
      r.do ('verb3', 'foo');
      r.do ('verb3', ['foo']);

      if (r.store.execute    !== 5) error (r, 'Matching error 2.');

      r.do ('verb2', ['some', 'Path', 'here']);
      r.do ('verb5', 'whatever');

      if (r.store.notExecute !== 0) error (r, 'Matching error 3.');

      r.do ('verb4', 'a');
      r.do ('verb4', ['a', 'b']);
      r.do ('verb4', []);

      if (r.store.execute    !== 10) error (r, 'Matching error 4.');

      r.do ('*', []);
      if (r.store.execute    !== 11) error (r, 'Matching error 5.');

   });

   tests.push (function () {
      var r = R ();

      dale.do ([
         function () {r.store.value = 'a'},
         function () {r.store.value += 'b'},
         function () {
            if (r.store.value !== 'ab') return error (r, 'Sequence error.');
         }
      ], function (v, k) {
         r.listen ('do', 'it', {priority: 2 - k}, v);
      });

      r.do ('do', 'it');

   });

   tests.push (function () {
      var r = R ();

      dale.do ([
         ['do', 'it',                function () {r.store.value += 'b'}],
         ['do', 'it', {priority: 1}, function () {r.store.value = 'a'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.do ('do', 'it');

      if (r.store.value !== 'ab') return error (r, 'Filter priority 1 error.');
   });

   tests.push (function () {
      var r = R ();

      dale.do ([
         ['do', 'it', {priority: -1}, function () {r.store.value += 'c'}],
         ['do', 'it',                 function () {r.store.value += 'b'}],
         ['do', 'it', {priority: 1},  function () {r.store.value = 'a'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.do ('do', 'it');

      if (r.store.value !== 'abc') return error (r, 'Filter priority 2 error.');
   });

   tests.push (function () {

      var r = R ();

      var fun = function () {};

      if (type (r.listen ({verb: 'a', path: 'b'}, fun)) !== 'string')  return error (r, 'listen return error 1.');
      if (r.listen ({verb: /a/, path: 'b'}, fun) !== false) return error (r, 'listen return error 2.');
      if (r.listen ({verb: 'a', path: /b/}, fun) !== false) return error (r, 'listen return error 3.');
      if (r.listen ({verb: 'a', path: 'b', id: /a/}, fun) !== false) return error (r, 'listen return error 4.');
      if (r.listen ({verb: 'a', path: 'b', id: 'a'}, fun) !== 'a')  return error  (r, 'listen return error 5.');
      if (r.listen ({verb: 'a', path: 'b', id: 'a'}, fun) !== false) return error (r, 'listen return error 6.');
      if (r.listen ({verb: 'a', path: 'b', priority: 'единственный'}, fun) !== false) return error (r, 'listen return error 7.');
      if (r.listen ({verb: 'a', path: 'b', foo: 'bar'}, fun) !== false) return error (r, 'listen return error 8.');
      if (type (r.listen ('a', 'b', fun)) !== 'string')  return error (r, 'listen return error 9.');
      if (r.listen (/a/, 'b', fun) !== false) return error (r, 'listen return error 10.');
      if (r.listen ('a', /b/, fun) !== false) return error (r, 'listen return error 11.');
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

      if (! r.routes.b || dale.keys (r.routes).length !== 1) return error (r, 'forget error.');

      if (onforget !== 'ac') return error (r, 'r.forget didn\'t execute onforget function.');

      r = R ();
      r.listen ('a', 'a', {id: 'a'},              fun);
      r.listen ('a', 'b', {id: 'b', parent: 'a'}, fun);
      r.listen ('a', 'c', {         parent: 'b'}, fun);

      r.forget ('a', function (r) {onforget += r.id});

      if (dale.keys (r.routes).length !== 0) return error (r, 'forget error.');
      if (! onforget.match (/^acab/)) return error (r, 'r.forget didn\'t execute onforget function.');
   });

   tests.push (function () {

      var r = R ();

      var counter = 0;

      r.listen ('do', 'it', {id: 'yoestabadiciendoburns', burn: true}, function () {counter++});

      r.do ('do', 'it');

      if (counter !== 1) return error (r, 'burnable route wasn\'t executed.');
      if (r.routes.yoestabadiciendoburns) return error (r, 'burnable route wasn\'t burned.');

   });

   dale.do (tests, function (v) {
      return v ();
   });

   log ('Success', 'All tests were successful!');

}) ();
