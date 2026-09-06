// core/index.js — Public facade for the tarot core.
// Browser: <script src="core/index.js"></script> -> window.TarotCore
// Node:    const TarotCore = require('./core/index.js')
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(
    require('./data/tarot-deck.js'),
    require('./elements.js'),
    require('./spreads.js'),
    require('./questions.js'),
    require('./engine.js'),
    require('./prose.js')
  ); }
  else { root.TarotCore = factory(root.TarotDataDeck, root.TarotElements, root.TarotSpreads, root.TarotQuestions, root.TarotEngine, root.TarotProse); }
})(typeof self !== 'undefined' ? self : this, function (DECK, Elements, Spreads, Questions, Engine, Prose) {
  return {
    VERSION: '0.1.0-core',
    DECK,
    elements: Elements,
    spreads: Spreads,
    questions: Questions,
    interpret: Engine.interpret,
    assembleProse: Prose.assembleProse,
    buildLLMPrompt: Prose.buildLLMPrompt,
    synthesize: Prose.synthesize
  };
});
