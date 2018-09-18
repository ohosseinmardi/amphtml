/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
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
import {Observable} from '../../../src/observable';
import {StateProperty, getStoreService} from './amp-story-store-service';


/**
 * Types of state changes that can be consumed.
 * @enum {number}
 */
export const StateChangeType = {
  ACTIVE_PAGE: 0,
  BOOKEND_ENTER: 1,
  BOOKEND_EXIT: 2,
  END: 3,
};


/** @typedef {{type: !StateChangeType, value: *}} */
export let StateChangeEventDef;


/**
 * State store to decouple navigation changes from consumers.
 */
export class NavigationState {
  /**
   * @param {!Window} win
   * @param {function():Promise<boolean>} hasBookend
   */
  constructor(win, hasBookend) {
    /** @private @const {!function():Promise<boolean>} */
    this.hasBookend_ = hasBookend;

    /** @private {!Observable<StateChangeEventDef>} */
    this.observable_ = new Observable();

    /** @private @const {!Window} */
    this.win_ = win;

    /** @private @const {!./amp-story-store-service.AmpStoryStoreService} */
    this.storeService_ = getStoreService(this.win_);

    this.initializeListeners_();



      // Create a queue, but don't obliterate an existing one!
      analytics = window.analytics = window.analytics || [];

      // If the real analytics.js is already on the page return.
      if (analytics.initialize) {return;}

      // If the snippet was invoked already show an error.
      if (analytics.invoked) {
          if (window.console && console.error) {
              console.error('Segment snippet included twice.');
          }
          return;
      }
      // Invoked flag, to make sure the snippet
      // is never invoked twice.
      analytics.invoked = true;

      // A list of the methods in Analytics.js to stub.
      analytics.methods = [
          'trackSubmit',
          'trackClick',
          'trackLink',
          'trackForm',
          'pageview',
          'identify',
          'reset',
          'group',
          'track',
          'ready',
          'alias',
          'debug',
          'page',
          'once',
          'off',
          'on',
      ];

      // Define a factory to create stubs. These are placeholders
      // for methods in Analytics.js so that you never have to wait
      // for it to load to actually record data. The `method` is
      // stored as the first argument, so we can replay the data.
      analytics.factory = function(method) {
          return function() {
              const args = Array.prototype.slice.call(arguments);
              args.unshift(method);
              analytics.push(args);
              return analytics;
          };
      };

      // For each of our methods, generate a queueing stub.
      for (let i = 0; i < analytics.methods.length; i++) {
          const key = analytics.methods[i];
          analytics[key] = analytics.factory(key);
      }

      // Define a method to load Analytics.js from our CDN,
      // and that will be sure to only ever load it once.
      analytics.load = function(key, options) {
          // Create an async script element based on your key.
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          script.src = 'https://cdn.segment.com/analytics.js/v1/'
              + key + '/analytics.min.js';

          // Insert our script next to the first script element.
          const first = document.getElementsByTagName('script')[0];
          first.parentNode.insertBefore(script, first);
          analytics._loadOptions = options;
      };

      // Add a version to keep track of what's in the wild.
      analytics.SNIPPET_VERSION = '4.1.0';


      // Load Analytics.js with your key, which will automatically
      // load the tools you've enabled for your account. Boosh!
      analytics.load('5jaoCdY4zYYOSmldibWisiao5Io7L1ES');

      // Make the first page call to load the integrations. If
      // you'd like to manually name or tag the page, edit or
      // move this call however you'd like




  }

  /**
   * @private
   */
  initializeListeners_() {
    this.storeService_.subscribe(StateProperty.BOOKEND_STATE, isActive => {
      if (isActive) {
        analytics.track("Bookend Enter");
        this.fire_(StateChangeType.BOOKEND_ENTER);
        this.fire_(StateChangeType.END);
      }

      if (!isActive) {
        analytics.track("Bookend Exit");
        this.fire_(StateChangeType.BOOKEND_EXIT);
      }
    });
  }

  /**
   * @param {function(!StateChangeEventDef):void} stateChangeFn
   */
  observe(stateChangeFn) {
    this.observable_.add(stateChangeFn);
  }

  /**
   * @param {number} pageIndex
   * @param {number} totalPages
   * @param {string} pageId
   * @param {boolean} isFinalPage
   * TODO(alanorozco): pass whether change was automatic or on user action.
   */
  updateActivePage(pageIndex, totalPages, pageId, isFinalPage) {
    const changeValue = {
      pageIndex,
      pageId,
      totalPages,
      storyProgress: pageIndex / totalPages,
    };
    analytics.track("Page Change",{
        page: pageIndex,
        storyProgress: pageIndex/totalPages
    });
    this.fire_(StateChangeType.ACTIVE_PAGE, changeValue);

    if (isFinalPage) {
      this.hasBookend_().then(hasBookend => {
        if (!hasBookend) {
        this.fire_(StateChangeType.END);
        }
      });
    }
  }

  /**
   * @param {!StateChangeType} type
   * @param {*=} opt_changeValue
   */
  fire_(type, opt_changeValue) {
    this.observable_.fire({type, value: opt_changeValue});
  }
}
