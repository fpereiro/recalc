# recalc

> "[T]hus, the external world would only have a triggering role in the release of the internally-determined activity of the nervous system." --Humberto Maturana

> "Should that function take the whole world as input and return a brand new world as output? Why even use functional programming, then?" -- [James Hague](http://prog21.dadgum.com/26.html)

recalc is a library for binding events to data changes. The core idea is to use side effects to trigger all code paths, in a systematic way.

recalc is very much a work in progress. Feedback is very welcome (fpereiro@gmail.com).

## Installation

The dependencies of recalc are two:

- [dale](https://github.com/fpereiro/dale)
- [teishi](https://github.com/fpereiro/teishi)

recalc is written in Javascript. You can use it in the browser by sourcing the dependencies and the main file:

```html
<script src="dale.js"></script>
<script src="teishi.js"></script>
<script src="recalc.js"></script>
```

Or you can use these links to use the latest version - courtesy of [RawGit](https://rawgit.com) and [MaxCDN](https://maxcdn.com).

```html
<script src="https://cdn.rawgit.com/fpereiro/dale/81569fa1077d7641a216d987a7a95a7251c62b68/dale.js"></script>
<script src="https://cdn.rawgit.com/fpereiro/teishi/aa2e4d64f71e1e93745e69ba99f1b71dc3eb8742/teishi.js"></script>
<script src="https://cdn.rawgit.com/fpereiro/recalc/25ab8925cb5245aebf02a3af099835d17d72f1d6/recalc.js"></script>
```

And you also can use it in node.js. To install: `npm install recalc`

## License

recalc is written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.
