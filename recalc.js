/*
recalc - v3.5.0

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source (but not yet!).
*/

(function () {

   // *** SETUP ***

   var isNode = typeof exports === 'object';

   var dale   = isNode ? require ('dale')   : window.dale;
   var teishi = isNode ? require ('teishi') : window.teishi;
   var type   = teishi.t, log = teishi.l;

   // *** CONSTRUCTOR ***

   var main = function (store) {

      if (teishi.stop ([
         ['store', store, ['array', 'object', 'undefined'], 'oneOf']
      ])) return;

      // *** FRONTEND ***

      var r = {};

      r.routes  = {};
      r.store   = store || {};

      r.isPath = function (path, fun) {
         return teishi.v (fun, [
            ['path', path, ['array', 'integer', 'string'], 'oneOf'],
            ['path', path, ['integer', 'string'], 'eachOf'],
         ]);
      }

      r.do = function (verb, path) {

         if (teishi.simple (path)) path = [path];

         if (teishi.stop ('r.do', [
            ['verb', verb, 'string'],
            r.isPath (path, 'r.do')
         ])) return false;

         r.mill.apply (null, arguments);
         return true;
      }

      r.listen = function () {

         var options, rfun = arguments [arguments.length - 1];
         if (arguments.length < 2) return log ('r.listen', 'Too few arguments passed to r.listen');
         if (arguments.length === 2) options = arguments [0];
         else {
            options      = arguments.length === 3 ? {} : arguments [2];
            options.verb = arguments [0];
            options.path = arguments [1];
         }

         if (teishi.simple (options.path)) options.path = [options.path];

         if (teishi.stop ('r.listen', [
            ['options',   options, 'object'],
            ['keys of options', dale.keys (options), ['verb', 'path', 'id', 'parent', 'priority', 'burn'], 'eachOf', teishi.test.equal],
            function () {return [
               ['options.verb', options.verb, 'string'],
               r.isPath (options.path, 'r.listen'),
               ['options.id',       options.id,       ['string', 'integer', 'undefined'], 'oneOf'],
               ['options.parent',   options.parent,   ['string', 'integer', 'undefined'], 'oneOf'],
               ['options.priority', options.priority, ['undefined', 'integer'],           'oneOf'],
               ['options.burn',     options.burn,     ['undefined', 'boolean'],           'oneOf']
            ]},
            ['route function', rfun, 'function']
         ])) return false;

         if (options.id) {
            if (r.routes [options.id]) return log ('r.listen', 'A route with id', options.id, 'already exists.');
         }
         else options.id = r.random ();
         options.rfun = rfun;

         r.routes [options.id] = options;
         return options.id;
      }

      r.forget = function (id, fun) {
         if (! r.routes [id]) return log ('Route', id, 'does not exist.');
         if (fun && type (fun) === 'function') fun (r.routes [id]);
         delete r.routes [id];
         dale.do (r.routes, function (v, k) {
            if (v.parent === id) r.forget (k, fun);
         });
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

            if (verb !== '*' && route.verb !== '*' && route.verb !== verb) return;

            if (route.path.length > path.length) return;

            if (route.path.length === 0) return matching.push (route);

            dale.stop (route.path, false, function (v2, k2) {
               if (path [k2] !== undefined && path [k2] !== '*' && v2 !== '*' && path [k2] !== v2) return false;

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
