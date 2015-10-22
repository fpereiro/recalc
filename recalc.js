/*
recalc - v0.1.1

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source.
*/

(function () {

   // *** SETUP ***

   var isNode = typeof exports === 'object';

   var dale   = isNode ? require ('dale')   : window.dale;
   var teishi = isNode ? require ('teishi') : window.teishi;

   var main = function (data, routes) {
      if (teishi.stop ([
         ['data', data, ['array', 'object'], 'oneOf'],
         ['routes', routes, 'array']
      ])) return;

      var pick = function (path) {
         var output = data;
         return dale.stopOn (path, false, function (v, k) {
            if (k + 1 < path.length && teishi.simple (output [v])) return false;
            output = output [v];
         }) === false ? undefined : output;
      }

      var r = function (path, value) {
         if (teishi.stop ('r', [
            ['path', path, 'array'],
            ['path', path, ['integer', 'string'], 'eachOf'],
         ])) return;

         var result = pick (path);
         if (result === value) return;
         r.set (path, data, value);
         dale.do (r.match (path, routes), function (v) {
            v (path, value, result);
         });
      }

      r.pick = pick;

      r.set = function (path, data, value) {
         if (teishi.stop ('r.set', [
            ['path', path, 'array'],
            ['path', path, ['integer', 'string'], 'eachOf'],
         ])) return;

         var item = data;

         dale.do (path, function (v, k) {
            if (k + 1 === path.length) item [v] = value;
            else                       item = item [v];
         });
      }

      r.path = function (path) {
         if (teishi.stop ('r.path', ['path', path, 'array'])) return;
         return path.join ('-');
      }

      r.match = function (path, routes) {
         var output = [];
         dale.do (routes, function (v) {
            dale.stopOn (v [0], false, function (v2, k2) {
               if (path [k2] !== undefined && path [k2] !== '*' && v2 !== '*' && path [k2] !== v2) {
                  return false;
               }
               if (k2 === v [0].length - 1) output.push (v [1]);
            });
         });
         return output;
      }

      r.do = function (path) {
         var fun = r.pick (path);
         if (teishi.stop ('r.do', ['fun', fun, 'function'])) return;
         fun.apply (undefined, teishi.c (arguments).slice (1));
      }

      return r;
   }

   if (isNode) return main;
   else        window.R = main;

}) ();
