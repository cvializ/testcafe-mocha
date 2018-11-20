/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview
 *
 * describes.js helps save you from writing a lot of boilerplate test code.
 * It also helps avoid mutating global state in tests by providing mock globals
 * like FakeWindow.
 *
 * `describes` is a global test variable that wraps and augments Mocha's test
 * methods. For each test method, it takes an additional `spec` parameter and
 * returns an `env` object containing mocks, etc. that help testing.
 *
 * For example, a typical Mocha test may look like:
 *
 *     describe('myTest', () => {
 *       // I gotta do this sandbox creation and restore for every test? Ugh...
 *       let sandbox;
 *       beforeEach(() => { sandbox = sinon.sandbox; })
 *       it('stubbing', () => { sandbox.stub(foo, 'bar'); });
 *       afterEach(() => { sandbox.restore(); });
 *     });
 *
 * A test that uses describes.js can save you the work of setting up sandboxes,
 * embedded iframes, mock windows, etc. For example:
 *
 *     // Yay! describes.sandboxed() sets up the sandbox for me.
 *     // Note the second `spec` param, and the returned `env` object.
 *     describes.sandboxed('myTest', {}, env => {
 *       it('stubbing', () => { env.sandbox.stub(foo, 'bar'); });
 *     });
 *
 * In addition to `sandboxed()`, describes.js has three other modes of
 * operation (that actually all support `env.sandbox`):
 *
 * 1. `sandboxed()` just helps you set up and tear down a sinon sandbox.
 *    Use this to save some sinon boilerplate code.
 *
 * 2. `fakeWin()` provides a fake Window (fake-dom.js#FakeWindow) in `env.win`.
 *    Use this when you're testing APIs that don't heavily depend on the DOM.
 *
 * 3. `realWin()` provides a real Window in an embedded iframe in `env.win`.
 *    Use this when you're testing APIs that need a real DOM.
 *
 * 4. `integration()` also provides a real Window in an embedded iframe, but
 *    the iframe contains an AMP doc where you can specify its <body> markup.
 *    Use this to save boilerplate for setting up the DOM of the iframe.
 *
 * The returned `env` object contains different objects depending on (A) the
 * mode of operation and (B) the `spec` object you provide it.
 *
 * - `fakeWin()` and `realWin()` both read `spec.amp`, which configures
 *   the AMP runtime on the returned window (see AmpTestSpec). You can also
 *   pass `false` to `spec.amp` to disable the AMP runtime if you just need
 *   a plain, non-AMP window.
 *
 *   Several AMP runtime objects (e.g. AmpDoc, AmpDocService) are returned to
 *   the test method in `env.amp`. See AmpTestEnv for details.
 *
 * - `integration()` reads `spec.body` and sets the string literal as the
 *   innerHTML of the embedded iframe's AMP document's <body>.
 *
 * The are more advanced usages of the various `spec` and returned `env`
 * objects. See the type definitions for `sandboxed`, `fakeWin`, `realWin`,
 * and `integration` below.
 */

import {
  createTestFile,
  cleanupTestFile,
  runTest,
} from './hooks';
import {
  TestCafeController,
} from '../step_definitions/api';
import testControllerHolder from './testControllerHolder';

/** Should have something in the name, otherwise nothing is shown. */
const SUB = ' ';

const TIMEOUT = 20000;

/**
 * @typedef {{
 *   fakeRegisterElement: (boolean|undefined),
 * }}
 */
export let TestSpec;


/**
 * An object specifying the configuration of an AmpFixture.
 *
 * - ampdoc: "single", "shadow", "multi", "none", "fie".
 *
 * @typedef {{
 *   runtimeOn: (boolean|undefined),
 *   extensions: (!Array<string>|undefined),
 *   canonicalUrl: (string|undefined),
 *   ampdoc: (string|undefined),
 *   params: (!Object<string, string>|undefined),
 * }}
 */
export let AmpTestSpec;


/**
 * An object containing artifacts of AmpFixture that's returned to test methods.
 * @typedef {{
 *   win: !Window,
 *   extensions: !Extensions,
 *   ampdocService: !AmpDocService,
 *   ampdoc: (!AmpDoc|undefined),
 *   flushVsync: function(),
 * }}
 */
export let AmpTestEnv;


/**
 * A test with a sandbox.
 * @param {string} name
 * @param {!TestSpec} spec
 * @param {function()} fn
 */
export const functional = describeEnv(unusedSpec => []);

/**
 * A repeating test.
 * @param {string} name
 * @param {!Object<string, *>} variants
 * @param {function(string, *)} fn
 */
export const repeated = (function() {
  /**
   * @param {string} name
   * @param {!Object<string, *>} variants
   * @param {function(string, *)} fn
   * @param {function(string, function())} describeFunc
   */
  const templateFunc = function(name, variants, fn, describeFunc) {
    return describeFunc(name, function() {
      for (const name in variants) {
        describe(name ? ` ${name} ` : SUB, function() {
          fn.call(this, name, variants[name]);
        });
      }
    });
  };

  /**
   * @param {string} name
   * @param {!Object<string, *>} variants
   * @param {function(string, *)} fn
   */
  const mainFunc = function(name, variants, fn) {
    return templateFunc(name, variants, fn, describe);
  };

  /**
   * @param {string} name
   * @param {!Object<string, *>} variants
   * @param {function(string, *)} fn
   */
  mainFunc.only = function(name, variants, fn) {
    return templateFunc(name, variants, fn, describe./*OK*/only);
  };

  return mainFunc;
})();

/**
 * Returns a wrapped version of Mocha's describe(), it() and only() methods
 * that also sets up the provided fixtures and returns the corresponding
 * environment objects of each fixture to the test method.
 * @param {function(!Object):!Array<?Fixture>} factory
 */
function describeEnv(factory) {
  /**
   * @param {string} name
   * @param {!Object} spec
   * @param {function(!Object)} fn
   * @param {function(string, function())} describeFunc
   */
  const templateFunc = function(name, spec, fn, describeFunc) {
    const fixtures = [new FunctionalFixture(spec)];
    factory(spec).forEach(fixture => {
      if (fixture && fixture.isOn()) {
        fixtures.push(fixture);
      }
    });
    return describeFunc(name, function() {
      const env = Object.create(null);
      this.timeout(TIMEOUT);
      beforeEach(() => {
        let totalPromise = undefined;
        // Set up all fixtures.
        fixtures.forEach((fixture, unusedIndex) => {
          if (totalPromise) {
            totalPromise = totalPromise.then(() => fixture.setup(env));
          } else {
            const res = fixture.setup(env);
            if (res && typeof res.then == 'function') {
              totalPromise = res;
            }
          }
        });
        return totalPromise;
      });

      afterEach(() => {
        // Tear down all fixtures.
        fixtures.slice(0).reverse().forEach(fixture => {
          fixture.teardown(env);
        });

        // Delete all other keys.
        for (const key in env) {
          delete env[key];
        }
      });

      describe(SUB, function() {
        fn.call(this, env);
      });
    });
  };

  /**
   * @param {string} name
   * @param {!Object} spec
   * @param {function(!Object)} fn
   */
  const mainFunc = function(name, spec, fn) {
    return templateFunc(name, spec, fn, describe);
  };

  /**
   * @param {string} name
   * @param {!Object} spec
   * @param {function(!Object)} fn
   */
  mainFunc.only = function(name, spec, fn) {
    return templateFunc(name, spec, fn, describe./*OK*/only);
  };

  mainFunc.skip = function(name, variants, fn) {
    return templateFunc(name, variants, fn, describe.skip);
  };

  return mainFunc;
}


/** @interface */
class FixtureInterface {

  /** @return {boolean} */
  isOn() {}

  /**
   * @param {!Object} env
   * @return {!Promise|undefined}
   */
  setup(unusedEnv) {}

  /**
   * @param {!Object} env
   */
  teardown(unusedEnv) {}
}


/** @implements {FixtureInterface} */
class FunctionalFixture {

  /** @param {!TestSpec} spec */
  constructor(spec) {
    /** @const */
    this.spec = spec;
  }

  /** @override */
  isOn() {
    return true;
  }

  /** @override */
  setup(env) {
    const browsers = this.spec.browsers;
    createTestFile('fixture');
    runTest(browsers);

    return testControllerHolder.get().then(controller => {
      env.controller = new TestCafeController(controller);
    })
  }

  /** @override */
  teardown(env) {
    cleanupTestFile();
  }
}
