/*
recalc - v1.0.0

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

   var error  = function (r, error) {
      log ('DEBUG', {
         store:  r.store,
         routes: r.routes
      });
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
            ['r.routes', R ().routes, 'array']
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
         ['someverb', []],
         ['someverb', [/invalid/, 'path']],
      ], true, function (args) {
         if (r.do.apply (null, args) !== false) return true;
      })) return error (r, 'Invalid input to r.do was accepted.');

      if (r.do ('fire', 'here') !== true) return error (r, 'Valid input to r.do didn\'t return true.');
   });

   tests.push (function () {
      var r = R ();
      r.listen ({verb: 'do', path: '*'}, function (x, arg1, arg2) {
         if (arg1 !== 'foo' || arg2 !== 'bar') return error (r, 'Extra arguments weren\'t passed to rfun.');
      });
      r.do ('do', '*', 'foo', 'bar');
   });

   tests.push (function () {
      var r = R ();
      setTimeout (function () {
         if (r.store.value !== 'onetwothree') return error (r, 'Async sequence wasn\'t executed.');
      }, 300);
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
            if (r.store.value !== 'onetwothree') return error (r, 'Async sequence wasn\'t executed in order.');
         }
      ], function (v) {
         r.listen ({verb: 'fire', path: '*'}, v);
      });
      r.do ('fire', '*');
   });

   tests.push (function () {
      var r = R ({execute: 0, notExecute: 0});

      var execute = function () {
         r.store.execute++;
      }

      var notExecute = function (x) {
         log (x);
         r.store.notExecute--;
      }

      dale.do ([
         [{verb: 'verb1', path: '*'},              execute],
         [{verb: 'verb2', path: ['some', 'path']}, notExecute],
         [{verb: 'verb3', path: ['foo', 'bar']},   execute]
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
      r.do ('verb4', 'whatever');

      if (r.store.notExecute !== 0) error (r, 'Matching error 3.');

   });

   tests.push (function () {
      var r = R ();

      dale.do ([
         function () {r.store.value = 'a'},
         function () {r.store.value += 'b'},
         function () {
            if (r.store.value !== 'ab') return error (r, 'Sequence error.');
         }
      ], function (v) {
         r.listen ({verb: 'do', path: 'it'}, v);
      });

      r.do ('do', 'it');

   });

   tests.push (function () {
      var r = R ();

      dale.do ([
         [{verb: 'do', path: 'it'},               function () {r.store.value += 'b'}],
         [{verb: 'do', path: 'it', priority: 1},  function () {r.store.value = 'a'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.do ('do', 'it');

      if (r.store.value !== 'ab') return error (r, 'Filter priority 1 error.');
   });

   tests.push (function () {
      var r = R ();

      dale.do ([
         [{verb: 'do', path: 'it'},              function () {r.store.value += 'c'}],
         [{verb: 'do', path: 'it', priority: 1}, function () {r.store.value += 'b'}],
         [{verb: 'do', path: 'it', priority: 2}, function () {r.store.value = 'a'}]
      ], function (v) {
         r.listen.apply (null, v);
      });

      r.do ('do', 'it');

      if (r.store.value !== 'abc') return error (r, 'Filter priority 2 error.');
   });

   tests.push (function () {

      var r = R ();

      var fun = function () {};

      if (r.listen ({verb: 'a', path: 'b'}, fun) !== true)  return error (r, 'listen return error.');
      if (r.listen ({verb: /a/, path: 'b'}, fun) !== false) return error (r, 'listen return error.');
      if (r.listen ({verb: 'a', path: /b/}, fun) !== false) return error (r, 'listen return error.');
      if (r.listen ({verb: 'a', path: 'b', id: /a/}, fun) !== false) return error (r, 'listen return error.');
      if (r.listen ({verb: 'a', path: 'b', id: 'a'}, fun) !== true)  return error  (r, 'listen return error.');
      if (r.listen ({verb: 'a', path: 'b', id: 'a'}, fun) !== false) return error (r, 'listen return error.');
      if (r.listen ({verb: 'a', path: 'b', priority: 'единственный'}, fun) !== false) return error (r, 'listen return error.');
   })

   tests.push (function () {

      var r = R ();

      var fun = function () {};

      r.listen ({verb: 'a', path: 'a', id: 'a'},     fun);
      r.listen ({verb: 'a', path: 'b', id: 'b'},     fun);
      r.listen ({verb: 'a', path: 'c', parent: 'a'}, fun);

      r.forget ('a');

      if (r.routes [0].path [0] !== 'b') return error (r, 'forget error.');

      r = R ();
      r.listen ({verb: 'a', path: 'a', id: 'a'}, fun);
      r.listen ({verb: 'a', path: 'b', id: 'b', parent: 'a'}, fun);
      r.listen ({verb: 'a', path: 'c', parent: 'b'}, fun);

      r.forget ('a');

      if (r.routes.length !== 0) return error (r, 'forget error.');
   });

   dale.do (tests, function (v) {
      return v ();
   });

   log ('Success', 'All tests were successful!');

}) ();
