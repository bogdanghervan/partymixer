/**
 * Modules that will be exposed for public (global) consumption under
 * the App namespace when this command is run:
 * ```
 * browserify public/javascripts/exports.js --standalone App \
 *   --outfile public/javascripts/bundle.js
 * ```
 *
 * @see https://github.com/substack/browserify-handbook#standalone
 * @see http://paulsalaets.com/posts/expose-node-module-as-global-variable
 */
exports.Party = require('./party');
exports.Youtube = require('./youtube');
exports.Search = require('./search');
