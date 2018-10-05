/*
recalc - v3.8.0

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source.
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

      r.do = function () {

         var x = type (arguments [0]) === 'object' ? arguments [0] : undefined;
         var verb = arguments [x ? 1 : 0];
         var path = arguments [x ? 2 : 1];

         if (teishi.simple (path)) path = [path];
         var args = [x || {}, verb, path].concat ([].slice.call (arguments, x ? 3 : 2));

         if (teishi.stop ('r.do', [
            [x !== undefined, [function () {
               return [
                  ['x.from', x.from, ['array', 'object', 'undefined'], 'oneOf'],
                  [type (x.from) === 'array', [function () {
                     return ['x.from', x.from, 'object', 'each'];
                  }]],
               ];
            }]],
            ['verb', verb, 'string'],
            r.isPath (path, 'r.do')
         ])) return false;

         r.mill.apply (null, args);
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
            ['keys of options', dale.keys (options), ['verb', 'path', 'id', 'parent', 'priority', 'burn', 'match'], 'eachOf', teishi.test.equal],
            function () {return [
               ['options.verb', options.verb, ['string', 'regex'], 'oneOf'],
               r.isPath (options.path, 'r.listen', true),
               ['options.id',       options.id,       ['string', 'integer', 'undefined'], 'oneOf'],
               ['options.parent',   options.parent,   ['string', 'integer', 'undefined'], 'oneOf'],
               ['options.priority', options.priority, ['undefined', 'integer'],           'oneOf'],
               ['options.burn',     options.burn,     ['undefined', 'boolean'],           'oneOf'],
               ['options.match',    options.match,    ['undefined', 'function'], 'oneOf']
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
         if (fun !== undefined && type (fun) !== 'function') return log ('Second argument to r.forget must be a function or undefined.');
         if (! r.routes [id]) return log ('Route', id, 'does not exist.');
         var route = r.routes [id];
         delete r.routes [id];
         if (fun) fun (route);
         dale.do (r.routes, function (v, k) {
            if (v.parent === id) r.forget (k, fun);
         });
      }

      // *** BACKEND ***

      r.isPath = function (path, fun, regex) {
         return teishi.v (fun, [
            ['path', path, ['array', 'integer', 'string'].concat (regex ? 'regex' : []), 'oneOf'],
            ['path', path,          ['integer', 'string'].concat (regex ? 'regex' : []), 'eachOf'],
         ]);
      }

      r.random = function () {
         return Math.random ().toString (16).slice (2);
      }

      r.compare = function (rvp, evp) {
         if (rvp === '*' || evp === '*') return true;
         if (type (rvp) === 'regex') return (evp + '').match (rvp) !== null;
         return rvp === evp;
      }

      r.mill = function (x, verb, path) {

         var from;
         if (! x.from)                        from = [];
         else if (type (x.from) === 'object') from = [x.from];
         else                                 from = x.from.slice (0);

         from.unshift ({date: new Date ().toISOString (), verb: verb, path: path});

         var args = [{verb: arguments [1], path: arguments [2], from: from}].concat ([].slice.call (arguments, 3));
         if (arguments.length > 3) {
            args [0].args = [].slice.call (arguments, 3);
            from [0].args = [].slice.call (arguments, 3);
         }

         var inner = function (matchingRoutes) {

            if (matchingRoutes.length === 0) return;
            args [0].cb = function () {
               inner (matchingRoutes);
            }

            var route = matchingRoutes.shift ();
            args [0].route = route;
            if (! r.routes [route.id]) return inner (matchingRoutes);
            if (route.burn) r.forget (route.id);
            if (type (route.rfun.apply (null, args)) !== 'function') inner (matchingRoutes);
         }

         inner (r.sort (r.match (verb, path, r.routes)));
      }

      r.match = function (verb, path, routes) {

         var matching = [];

         dale.do (routes, function (route) {

            if (route.match) return route.match (route, {verb: verb, path: path}) === true ? matching.push (route) : undefined;

            if (! r.compare (route.verb, verb)) return;

            if (route.path.length > path.length) return;

            if (route.path.length === 0) return matching.push (route);

            if (dale.stop (route.path, false, function (v2, k2) {
               return r.compare (v2, path [k2]);
            })) matching.push (route);

         });

         return matching;
      }

      r.sort = function (matching) {
         return matching.sort (function (a, b) {
            return (b.priority || 0) - (a.priority || 0);
         });
      }

      return r;
   }

   if (isNode) module.exports  = main;
   else        window.R        = main;

}) ();
