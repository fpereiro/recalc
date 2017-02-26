/*
recalc - v3.0.0

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source (but not yet!).
*/

(function () {

   // *** SETUP ***

   var isNode = typeof exports === 'object';

   var dale   = isNode ? require ('dale')   : window.dale;
   var teishi = isNode ? require ('teishi') : window.teishi;
   var type   = teishi.t, stop = teishi.stop;

   // *** CONSTRUCTOR ***

   var main = function (store) {

      if (stop ([
         ['store', store, ['array', 'object', 'undefined'], 'oneOf']
      ])) return;

      // *** FRONTEND ***

      var r = {};

      r.routes  = {};
      r.store   = store || {};

      r.do = function (verb, path) {

         if (teishi.simple (path)) path = [path];

         if (stop ('r', [
            ['verb', verb, 'string'],
            ['path', path, 'array'],
            function () {
               return ['path length', path.length, {min: 1}, teishi.test.range];
            },
            ['path', path, ['integer', 'string'], 'eachOf']
         ])) return false;

         r.mill.apply (null, arguments);
         return true;
      }

      r.listen = function (opts, rfun) {

         opts = opts || {};

         if (teishi.simple (opts.path)) opts.path = [opts.path];

         if (teishi.stop ('r.radd', [
            ['opts',   opts, 'object'],
            function () {return [
               ['opts.verb',     opts.verb, 'string'],
               ['opts.path',     opts.path, 'array'],
               ['opts.path',     opts.path,     ['integer', 'string'],              'eachOf'],
               ['opts.id',       opts.id,       ['string', 'integer', 'undefined'], 'oneOf'],
               ['opts.parent',   opts.parent,   ['string', 'integer', 'undefined'], 'oneOf'],
               ['opts.priority', opts.priority, ['undefined', 'integer'],           'oneOf'],
               ['opts.burn',     opts.burn,     ['undefined', 'boolean'],           'oneOf']
            ]},
            ['route function', rfun, 'function']
         ])) return false;

         if (opts.id && r.routes [opts.id]) return teishi.l ('r.radd', 'A route with id', opts.id, 'already exists.');

         opts.id = opts.id || r.random ();

         r.routes [opts.id] = dale.obj (['parent', 'priority', 'burn'], {id: opts.id, verb: opts.verb, path: opts.path, rfun: rfun}, function (v) {
            if (opts [v]) return [v, opts [v]];
         });

         return opts.id;
      }

      r.forget = function (id) {
         if (! r.routes [id]) return teishi.l ('Route', id, 'does not exist.');
         delete r.routes [id];
         dale.do (dale.fil (r.routes, undefined, function (v, k) {
            if (v.parent === id) return k;
         }), r.forget);
      }

      // *** BACKEND ***

      r.mill = function (verb, path) {

         var args = [{verb: arguments [0], path: arguments [1]}].concat ([].slice.call (arguments, 2));

         var inner = function (matching) {

            if (matching.length === 0) return;
            args [0].cb = function () {
               inner (matching);
            }

            var route = matching.shift ();
            if (! r.routes [route.id]) return inner (matching);
            if (route.burn) r.forget (route.id);
            if (type (route.rfun.apply (null, args)) !== 'function') inner (matching);
         }

         inner (r.sort (r.match (verb, path, r.routes)));
      }

      r.match = function (verb, path, routes) {

         var matching = [];

         dale.do (routes, function (route) {

            // If verb and route verb are not a wildcard and it doesn't match the verb, skip the route.
            if (verb !== '*' && route.verb !== '*' && route.verb !== verb) return;

            if (route.path.length > path.length) return;

            // Iterate through the route path, stop on false.
            dale.stop (route.path, false, function (v2, k2) {

               // If the kth element of the path is not undefined AND it is not a wildcard AND the corresponding element of the route path is not a wildcard AND the kth path element and the kth route path element are not equal, return false and stop the loop.
               if (path [k2] !== undefined && path [k2] !== '*' && v2 !== '*' && path [k2] !== v2) return false;

               // If the kth element of the path is equal to the length of the route path push the route.
               if (k2 === route.path.length - 1) {
                  matching.push (route);
                  return false;
               }
            });
         });

         return matching;
      }

      r.sort = function (matching) {
         return matching.sort (function (a, b) {
            var p1 = a.priority || 0;
            var p2 = b.priority || 0;
            return p2 - p1;
         });
      }

      r.random = function () {
         return Math.random ().toString (16).slice (2);
      }

      return r;
   }

   if (isNode) module.exports  = main;
   else        window.R        = main;

}) ();
