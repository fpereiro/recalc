/*
recalc - v5.0.2

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
         responders: {},
         store:     store || {},
         log:       [],
         error:     clog,
         count:     {e: 1, l: 1}
      }

      r.call = function () {

         var x    = type (arguments [0]) === 'object' ? arguments [0] : undefined;
         var verb = arguments [x ? 1 : 0];
         var path = arguments [x ? 2 : 1];

         if (teishi.simple (path)) path = [path];

         if (! r.prod && teishi.stop ('r.call', [
            ['context', x, ['object', 'undefined'], 'oneOf'],
            [x !== undefined, [function () {
               return ['x.from', x.from, ['string', 'undefined'], 'oneOf'];
            }]],
            ['verb', verb, 'string']
         ], function (error) {
            x ? r.error (x, 'r.call', error) : r.error ('r.call', error);
         })) return false;

         if (! r.prod && ! r.isPath (path)) return x ? r.error (x, 'r.call', 'Invalid path. Arguments:', {verb: verb, path: path}) : r.error ('r.call', 'Invalid path. Arguments:', {verb: verb, path: path});

         var oargs = arguments;
         var args  = arguments.length === (x ? 3 : 2) ? undefined : dale.go (dale.times (arguments.length - (x ? 3 : 2), x ? 3 : 2), function (k) {
            return oargs [k];
         });

         var from = x ? (x.responder ? (x.responder.id + '/' + x.from) : x.from) : undefined;
         x = {from: 'E' + r.count.e++, verb: verb, path: path, args: args};
         r.logpush (from, x.from, verb, path, args);
         r.mill (args === undefined ? [x] : [x].concat (args));
         return x.from;
      }

      r.respond = function () {

         var options, rfun = arguments [arguments.length - 1];
         if (arguments.length < 2) return r.error ('r.respond', 'Too few arguments passed to r.respond');
         if (arguments.length === 2) options = arguments [0];
         else {
            options      = arguments.length === 3 ? {} : arguments [2];
            options.verb = arguments [0];
            options.path = arguments [1];
         }

         if (teishi.simple (options.path)) options.path = [options.path];

         if (! r.prod && teishi.stop ('r.respond', [
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
            ['responder function', rfun, 'function']
         ], function (error) {
            r.error ('r.respond', error);
         })) return false;

         if (! r.prod && ! r.isPath (options.path, true)) return r.error ('r.respond', 'Invalid path. Options:', options);

         if (options.id !== undefined) {
            options.id += '';
            if (! r.prod && options.id.match (/^[R|E]\d+$/)) return r.error ('r.respond', 'If you pass an id for a responder, it cannot be an `L` or an `E` followed by digits, since that is the form that recalc gives to auto-generated ids.');
            if (! r.prod && r.responders [options.id])       return r.error ('r.respond', 'A responder with id', options.id, 'already exists.');
         }
         else options.id = 'R' + r.count.l;
         options.rfun = rfun;
         options.index = r.count.l++;

         r.responders [options.id] = options;
         return options.id;
      }

      r.forget = function (id, fun) {
         if (! r.prod && fun !== undefined && type (fun) !== 'function') return r.error ('r.forget', 'Second argument to r.forget must be a function or undefined. Id is:', id);
         if (! r.prod && ! r.responders [id])                            return r.error ('r.forget', 'responder', id, 'does not exist.');
         var responder = r.responders [id];
         delete r.responders [id];
         if (fun) fun (responder);
         dale.go (r.responders, function (v, k) {
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

      r.compare = function (eventItem, responderItem) {
         if (eventItem === '*' || responderItem === '*') return true;
         if (type (responderItem) === 'regex') return (eventItem + '').match (responderItem) !== null;
         return eventItem === responderItem;
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

            var responder = matching.shift ();
            args [0].responder = responder;
            if (! r.responders [responder.id]) return inner (matching);
            r.logpush (args [0].from, responder.id, responder.verb, responder.path, args.slice (1).length ? args.slice (1) : undefined);
            if (responder.burn) r.forget (responder.id);
            if (type (responder.rfun.apply (null, args)) !== 'function') inner (matching);
         }

         inner (r.sort (r.match (args [0].verb, args [0].path, args.slice (1), r.responders)));
      }

      r.match = function (verb, path, args, responders) {

         var matching = [];

         dale.go (responders, function (responder) {

            if (responder.disabled) return;

            if (responder.match) return responder.match ({verb: verb, path: path, args: args}, responder) === true ? matching.push (responder) : undefined;

            if (! r.compare (verb, responder.verb)) return;

            if (path.length !== responder.path.length) return;
            if (path.length === 0 && responder.path.length === 0) return matching.push (responder);

            if (dale.stop (path, false, function (v, k) {
               return r.compare (path [k], responder.path [k]);
            })) matching.push (responder);
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
