/*
recalc - v0.2.1

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source.
*/

(function () {

   // *** SETUP ***

   var isNode = typeof exports === 'object';

   var dale   = isNode ? require ('dale')   : window.dale;
   var teishi = isNode ? require ('teishi') : window.teishi;
   var type   = teishi.t;

   var main = function (data, routes) {

      if (teishi.stop ([
         ['data', data, ['array', 'object'], 'oneOf'],
         ['routes', routes, 'array']
      ])) return;

      var pick = function (path) {
         var output = data;
         return dale.stop (path, false, function (v, k) {
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
            else {
               if (item [v] === undefined) item [v] = (type (path [k + 1]) === 'string' ? {} : []);
               item = item [v];
            }
         });
      }

      r.match = function (path, routes) {
         var output = [];
         dale.do (routes, function (v) {
            dale.stop (v [0], false, function (v2, k2) {
               if (path [k2] !== undefined && path [k2] !== '*' && v2 !== '*' && path [k2] !== v2) {
                  return false;
               }
               if (k2 === v [0].length - 1) output.push (v [1]);
            });
         });
         return output;
      }

      r.diff = function (obj1, obj2) {
      }

      r.data = data;

      r.routes = routes;

      r.events = function (where) {
         var maker = function (which, props) {
            return function () {
               var arg   = 0;
               var obj   = type (arguments [arg]) === 'object' ? arguments [arg++] : {};
               var path  = arguments [arg++];
               var value = arguments [arg] === undefined ? 'this.value' : JSON.stringify (arguments [arg]);
               if (where === 'select') value = 'this.selectedIndex';
               var string = where + ' (' + JSON.stringify (path) + ', ' + value + ')';
               if (which === 'fire') string = where + '.' + ['data'].concat (path).join ('.') + ' (' + value + ')';
               return dale.obj (props, obj, function (v) {
                  return [v, string];
               });
            }
         }
         return dale.obj ({
            write: ['onchange', 'onkeyup', 'onkeydown'],
            select: 'onchange',
            click: 'onclick',
            fire:  'onclick'
         }, function (v, k) {
            return [k, maker (k, v)];
         });
      }

      return r;
   }

   return isNode ? main : window.R = main;

}) ();
