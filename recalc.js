/*
recalc - v4.1.0

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source.
*/

(function () {

   // *** SETUP ***

   var isNode = typeof exports === 'object';

   var dale   = isNode ? require ('dale')   : window.dale;
   var teishi = isNode ? require ('teishi') : window.teishi;
   var type   = teishi.type, clog = teishi.clog;

   // *** CONSTRUCTOR ***

   var main = function (store) {

      if (teishi.stop ([
         ['store', store, ['array', 'object', 'undefined'], 'oneOf']
      ])) return;

      // *** FRONTEND ***

      var r = {
         listeners: {},
         store:     store || {},
         log:       [],
         error:     clog,
         count:     0
      }

      r.say = function () {

         var x    = type (arguments [0]) === 'object' ? arguments [0] : undefined;
         var verb = arguments [x ? 1 : 0];
         var path = arguments [x ? 2 : 1];

         if (teishi.simple (path)) path = [path];

         if (! r.prod && teishi.stop ('r.say', [
            ['context', x, ['object', 'undefined'], 'oneOf'],
            [x !== undefined, [function () {
               return ['x.from', x.from, ['string', 'undefined'], 'oneOf'];
            }]],
            ['verb', verb, 'string']
         ], function (error) {
            r.error (x, 'r.say', error);
         })) return false;

         if (! r.prod && ! r.isPath (path)) return r.error (x, 'r.say', 'Invalid path. Arguments:', {verb: verb, path: path});

         var oargs = arguments;
         var args  = arguments.length === (x ? 3 : 2) ? undefined : dale.go (dale.times (arguments.length - (x ? 3 : 2), x ? 3 : 2), function (k) {
            return oargs [k];
         });

         var from = x ? x.from : undefined;
         x = {from: 'E' + r.random (), verb: verb, path: path, args: args};
         r.logpush (from, x.from, verb, path, args);
         r.mill (args === undefined ? [x] : [x].concat (args));
         return x.from;
      }

      r.listen = function () {

         var options, lfun = arguments [arguments.length - 1];
         if (arguments.length < 2) return r.error ('r.listen', 'Too few arguments passed to r.listen');
         if (arguments.length === 2) options = arguments [0];
         else {
            options      = arguments.length === 3 ? {} : arguments [2];
            options.verb = arguments [0];
            options.path = arguments [1];
         }

         if (teishi.simple (options.path)) options.path = [options.path];

         if (! r.prod && teishi.stop ('r.listen', [
            ['options',   options, 'object'],
            ['keys of options', dale.keys (options), ['verb', 'path', 'id', 'parent', 'priority', 'burn', 'match'], 'eachOf', teishi.test.equal],
            function () {return [
               ['options.verb',     options.verb,     ['string', 'regex'],                'oneOf'],
               ['options.id',       options.id,       ['string', 'integer', 'undefined'], 'oneOf'],
               ['options.parent',   options.parent,   ['string', 'integer', 'undefined'], 'oneOf'],
               ['options.priority', options.priority, ['undefined', 'integer'],           'oneOf'],
               ['options.burn',     options.burn,     ['undefined', 'boolean'],           'oneOf'],
               ['options.match',    options.match,    ['undefined', 'function'],          'oneOf']
            ]},
            ['listener function', lfun, 'function']
         ], function (error) {
            r.error ('r.listen', error);
         })) return false;

         if (! r.prod && ! r.isPath (options.path, true)) return r.error ('r.listen', 'Invalid path. Options:', options);

         if (options.id !== undefined) {
            options.id += '';
            if (! r.prod && r.listeners [options.id]) return r.error ('r.listen', 'A listener with id', options.id, 'already exists.');
         }
         else options.id = r.random ();
         options.lfun = lfun;
         options.index = r.count++;

         r.listeners [options.id] = options;
         return options.id;
      }

      r.forget = function (id, fun) {
         if (! r.prod && fun !== undefined && type (fun) !== 'function') return r.error ('r.forget', 'Second argument to r.forget must be a function or undefined. Id is:', id);
         if (! r.prod && ! r.listeners [id])                             return r.error ('r.forget', 'Listener', id, 'does not exist.');
         var listener = r.listeners [id];
         delete r.listeners [id];
         if (fun) fun (listener);
         dale.go (r.listeners, function (v, k) {
            if (v.parent === id) r.forget (k, fun);
         });
      }

      // *** INTERNALS ***

      r.isPath = function (path, regex) {
         return teishi.v ([
            ['path', path, ['array', 'integer', 'string'].concat (regex ? 'regex' : []), 'oneOf'],
            ['path', path,          ['integer', 'string'].concat (regex ? 'regex' : []), 'eachOf']
         ], function () {});
      }

      r.random = function () {
         return Math.random ().toString (16).slice (2);
      }

      r.compare = function (rvp, evp) {
         if (rvp === '*' || evp === '*') return true;
         if (type (rvp) === 'regex') return (evp + '').match (rvp) !== null;
         return rvp === evp;
      }

      r.logpush = function (from, id, verb, path, args) {
         if (r.log) r.log.push ({t: teishi.time (), from: from, id: id, verb: verb, path: path, args: args});
      }

      r.mill = function (args) {

         var inner = function (matching) {

            if (matching.length === 0) return;
            args [0].cb = function () {
               inner (matching);
            }

            var listener = matching.shift ();
            args [0].listener = listener;
            if (! r.listeners [listener.id]) return inner (matching);
            if (listener.burn) r.forget (listener.id);
            if (type (listener.lfun.apply (null, args)) !== 'function') inner (matching);
         }

         inner (r.sort (r.match (args [0].verb, args [0].path, r.listeners)));
      }

      r.match = function (verb, path, listeners) {

         var matching = [];

         dale.go (listeners, function (listener) {

            if (listener.disabled) return;

            if (listener.match) return listener.match (listener, {verb: verb, path: path}) === true ? matching.push (listener) : undefined;

            if (! r.compare (listener.verb, verb)) return;

            if (listener.path.length === 0 || path.length === 0) return matching.push (listener);

            if (dale.stop (dale.times (Math.min (listener.path.length, path.length), 0), false, function (k) {
               return r.compare (listener.path [k], path [k]);
            })) matching.push (listener);
         });

         return matching;
      }

      r.sort = function (matching) {
         return matching.sort (function (a, b) {
            var priority = (b.priority || 0) - (a.priority || 0);
            return priority !== 0 ? priority : a.index - b.index;
         });
      }

      return r;
   }

   if (isNode) module.exports  = main;
   else        window.R        = main;

}) ();
