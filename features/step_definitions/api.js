// http://devexpress.github.io/testcafe/documentation/test-api/assertions/assertion-api.html
import {ClientFunction, Selector, TestController} from 'testcafe';

const getTitle = ClientFunction(() => document.title);

/**
 * TODO(cvializ);
 * Are the more objects with `with` functions than ClientFunction and Selector?
 * @record
 */
class Withable {
  /**
   * @template THIS
   * @this {THIS}
   * @return {THIS}
   * @param {!Object} config
   */
  with(config) {}
}

/**
 * @param {T} toBind
 * @param {TestController} testRun
 * @return {T}
 */
function bindTestRun(toBind, testRun) {
  return /** @type {T} */ (
    /** @type {Withable} */ (toBind.with({boundTestRun: testRun}))
  );
}

/** @implements {FunctionalTestControllerInterface} */
export class TestCafeController {
  /**
   * @param {TestController} t
   */
  constructor(t) {
    /** @private */
    this.t = t;

    /** @private */
    this.getTitle_ = bindTestRun(getTitle, this.t);
  }

  /**
   * @param {string} selector
   * @return {!Promise<!ElementHandle<!Selector>}
   * @override
   */
  async findElement(selector) {
    const elementHandle = await bindTestRun(Selector(selector).nth(0), this.t);
    return new ElementHandle(elementHandle);
  }

  /** @override */
  async navigateTo(location) {
    this.t.navigateTo(location);
  }

  /**
   * @param {?ElementHandle<!Selector>} handle
   * @param {string} keys
   * @return {!Promise}
   * @override
   */
  async type(handle, keys) {
    if (!handle) {
      await this.t.pressKey(keys);
      return;
    }

    await this.t.typeText(handle.getElement(), keys);
  }

  /**
   * @param {!ElementHandle<!Selector>} handle
   * @return {!Promise<string>}
   * @override
   */
  async getElementText(handle) {
    return await handle.getElement().innerText;
  }


  /** @override */
  async getTitle() {
    return await this.getTitle_();
  }

  /**
   * @param {!ElementHandle<!Selector>} handle
   * @return {!Promise}
   * @override
   */
  async click(handle) {
    return await this.t.click(handle.getElement());
  }
}

/**
 * A wrapper class that allows client code to own references to
 * framework-specific element handles, but which does not expose any of the
 * framework-specific methods on that element.
 *
 * @template T
 * @public
 */
export class ElementHandle {
  /**
   * Wrap the framework-specific element handle object.
   * @param {!T} element
   * @package
   */
  constructor(element) {
    this.element = element;
  }

  /**
   * Unwrap the framework-specific element handle object.
   * @return {!T}
   * @package
   */
  getElement() {
  	return this.element;
  }
}


/** @interface */
class FunctionalTestControllerInterface {
  /**
   * Navigates to the given URL.
   * {@link https://www.w3.org/TR/webdriver1/#navigate-to}

   * @param {string} url
   * @return {!Promise}
   */
  async navigateTo(url) {}

  /**
   * Retrieves the URL for the current page.
   * {@link https://www.w3.org/TR/webdriver1/#get-current-url}
   *
   * @return {!Promise<string>}
   */
  async getCurrentUrl() {}

  /**
   * Causes the browser to traverse one step backward in the browser history.
   * {@link https://www.w3.org/TR/webdriver1/#back}
   *
   * @return {!Promise}
   */
  async back() {}

  /**
   * Causes the browser to traverse one step forwards in the browser history.
   * {@link https://www.w3.org/TR/webdriver1/#forward}
   *
   * @return {!Promise}
   */
  async forward() {}

  /**
   * Causes the browser to reload the page.
   * {@link https://www.w3.org/TR/webdriver1/#refresh}
   *
   * @return {!Promise}
   */
  async refresh() {}

  /**
   * Returns the document title.
   * {@link https://www.w3.org/TR/webdriver1/#get-title}
   *
   * @return {!Promise<string>}
   */
  async getTitle() {}

  /**
   * Selects the current top-level browsing context or a child browsing context
   * of the current browsing context to use as the current browsing context for
   * subsequent commands.
   * {@link https://www.w3.org/TR/webdriver1/#switch-to-frame}
   *
   * @param {string} id
   * @return {!Promise}
   */
  async switchToFrame(id) {}

  /**
   * The Switch to Parent Frame command sets the current browsing context for
   * future commands to the parent of the current browsing context.
   * {@link https://www.w3.org/TR/webdriver1/#switch-to-parent-frame}
   *
   * @return {!Promise}
   */
  async switchToParentFrame() {}

  /**
   * The Get Window Rect command returns the size and position on the screen of
   * the operating system window corresponding to the current top-level
   * browsing context.
   * {@link https://www.w3.org/TR/webdriver1/#get-window-rect}
   * {@link https://www.w3.org/TR/webdriver1/#resizing-and-positioning-windows}
   *
   * @return {!Promise<!DOMRectDef>}
   */
  async getWindowRect() {}

  /**
   * The Set Window Rect command alters the size and the position of the
   * operating system window corresponding to the current top-level
   * browsing context.
   * {@link https://www.w3.org/TR/webdriver1/#set-window-rect}
   * {@link https://www.w3.org/TR/webdriver1/#resizing-and-positioning-windows}
   *
   * @param {!DOMRectDef} rect
   * @return {!Promise}
   */
  async setWindowRect(rect) {}

  /**
   * The Maximize Window command invokes the window manager-specific “maximize”
   * operation, if any, on the window containing the current top-level
   * browsing context.
   * This typically increases the window to the maximum available size without
   * going full-screen.
   * {@link https://www.w3.org/TR/webdriver1/#maximize-window}
   *
   * @return {!Promise}
   */
  async maximizeWindow() {}

  /**
   * Invokes the window manager-specific “fullscreen” operation on the window
   * containing the current top-level browsing context.
   * {@link https://www.w3.org/TR/webdriver1/#fullscreen-window}
   *
   * @return {!Promise}
   */
  async fullscreenWindow() {}

  /**
   * Gets the active element of the current browsing context’s document element.
   * {@link https://www.w3.org/TR/webdriver1/#get-active-element}
   *
   * @return {!Promise<!ElementHandle>}
   */
  async getActiveElement() {}

  /**
   * The Find Element command is used to find the first element matching the
   * given selector in the current browsing context that can be used as the
   * web element context for future element-centric commands.
   * {@link https://www.w3.org/TR/webdriver1/#find-element}
   *
   * @param {string} selector
   * @return {!Promise<!ElementHandle>}
   */
  async findElement(selector) {}

  /**
   * The Find Elements command is used to find all elements matching the
   * given selector in the current browsing context that can be used as the
   * web element context for future element-centric commands.
   * {@link https://www.w3.org/TR/webdriver1/#find-elements}
   *
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async findElements(selector) {}

  /**
   * The Find Element From Element command is used to find the first element
   * that is a descendent of the given element matching the given selector in
   * the current browsing context that can be used as the web element context
   * for future element-centric commands.
   * {@link https://www.w3.org/TR/webdriver1/#find-element-from-element}
   *
   * @param {!ElementHandle} handle
   * @param {string} selector
   * @return {!Promise<!ElementHandle>}
   */
  async findElementFromElement(handle, selector) {}

  /**
   * The Find Elements command is used to find all elements that are descendents
   * of the given element matching the given selector in the current
   * browsing context that can be used as the web element context for future
   * element-centric commands.
   * {@link https://www.w3.org/TR/webdriver1/#find-elements-from-element}
   *
   * @param {!ElementHandle} handle
   * @param {string} selector
   * @return {!Promise<!Array<!ElementHandle>>}
   */
  async findElementsFromElement(handle, selector) {}

  /**
   * Determines if the referenced element is elected or not.
   * This operation only makes sense on input elements of the Checkbox- and
   * Radio Button states, or on option elements.
   * {@link https://www.w3.org/TR/webdriver1/#is-element-selected}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise<boolean>}
   */
  async isElementSelected(handle) {}

  /**
   * Return the value of the given attribute name on the given element.
   * Note: for boolean attributes, the value returned is "true".
   * {@link https://www.w3.org/TR/webdriver1/#get-element-attribute}
   *
   * @param {!ElementHandle} handle
   * @param {string} attribute
   * @return {!Promise<string>}
   */
  async getElementAttribute(element, attribute) {}

  /**
   * Return the value of the given property name on the given element.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-property}
   *
   * @param {!ElementHandle} handle
   * @param {!Promise<string>} property
   */
  async getElementProperty(element, property) {}

  /**
   * Return the value of the given CSS value on the given element.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-css-value}
   *
   * @param {!ElementHandle} handle
   * @param {!Promise<string>} styleProperty
   */
  async getElementCssValue(element, styleProperty) {}

  /**
   * The Get Element Text command intends to return an element’s text
   * “as rendered”. An element’s rendered text is also used for locating `<a>`
   * elements by their link text and partial link text.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-text}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise<string>}
   */
  async getElementText(handle) {}

  /**
   * Return the value of the tag name for the given element.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-tag-name}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise<string>}
   */
  async getElementTagName(handle) {}

  /**
   * The Get Element Rect command returns the dimensions and coordinates of
   * the given web element.
   * {@link https://www.w3.org/TR/webdriver1/#get-element-rect}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise<!DOMRectDef>}
   */
  async getElementRect(handle) {}

  /**
   * Return the enabled state of the given element. i.e. `false` if the
   * given element has the "disabled" attribute.
   * {@link https://www.w3.org/TR/webdriver1/#is-element-enabled}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise<boolean>}
   */
  async isElementEnabled(element) {}

  /**
   * Executes the given function as a script in the current browsing context and
   * blocks until execution is complete.
   * {@link https://www.w3.org/TR/webdriver1/#execute-script}
   *
   * @param {function()} method
   * @return {!Promise<*>}
   */
  async executeScript(method) {}

  /**
   * Executes the given function as a script in the current browsing context.
   * Execution is not blocked while the given function executes.
   * {@link https://www.w3.org/TR/webdriver1/#execute-async-script}
   *
   * @param {function()} method
   * @return {Promise<*>}
   */
  async executeAsyncScript(method) {}

  /**
   * Serializes and returns all cookies for the document in the current
   * browsing context.
   * {@link https://www.w3.org/TR/webdriver1/#get-all-cookies}
   *
   * @return {string}
   */
  async getAllCookies() {}

  /**
   * Return the cookie value corresponding to the given name if it exists.
   * {@link https://www.w3.org/TR/webdriver1/#get-named-cookie}
   *
   * @param {string} name
   * @return {string}
   */
  async getNamedCookie(name) {}

  /**
   * Attempt to set the given cookie value with the given name for the document
   * in the current browsing context.
   * {@link https://www.w3.org/TR/webdriver1/#add-cookie}
   *
   * @param {string} name
   * @param {string} value
   * @return {string}
   */
  async addCookie(name, value) {}

  /**
   * {@link https://www.w3.org/TR/webdriver1/#delete-cookie}
   *
   * @param {string} name
   */
  async deleteCookie(name) {}

  /**
   * Attempt to delete all cookies for the document in the current
   * browsing context.
   * {@link https://www.w3.org/TR/webdriver1/#delete-all-cookies}
   */
  async deleteAllCookies() {}

  /**
   * The Take Screenshot command takes a screenshot of the
   * visible region encompassed by the bounding rectangle of the window.
   * {@link https://www.w3.org/TR/webdriver1/#take-screenshot}
   *
   * @return {!Promise<string>} An encoded string representing the image data
   */
  async takeScreenshot() {}

  /**
   * The Take Element Screenshot command takes a screenshot of the visible
   * region encompassed by the bounding rectangle of an element.
   * {@link https://www.w3.org/TR/webdriver1/#take-element-screenshot}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise<string>} An encoded string representing the image data
   */
  async takeElementScreenshot(handle) {}

  /**
   * Clicks the given element in its center point.
   * {@link https://www.w3.org/TR/webdriver1/#element-click}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise}
   */
  async click(handle) {}

  /**
   * Double-clicks the given element in its center point.
   *
   * @param {!ElementHandle} handle
   * @return {!Promise}
   */
  async doubleClick(handle) {}

  /**
   * Executes a drag-and-drop gesture on the given element.
   *
   * @param {!ElementHandle} handle
   * @param {!Object=} options
   * @return {!Promise}
   */
  async drag(target) {}

  /**
   * Hovers the given element in its center point.
   * @param {!ElementHandle} handle
   * @param {!Object=} options
   * @return {!Promise}
   */
  async hover(handle) {}

  /**
   * Right-clicks the given element in its center point.
   *
   * @param {!ElementHandle} handle
   * @return {!Promise}
   */
  async rightClick(handle) {}

  /**
   * Middle-clicks the given element in its center point.
   *
   * @param {!ElementHandle} handle
   * @return {!Promise}
   */
  async middleClick(handle) {}

  /**
   * Executes a select action on the given element.
   * This operation only makes sense on input elements of the Checkbox- and
   * Radio Button states, or on option elements.
   *
   * @param {!ElementHandle} handle
   * @return {!Promise}
   */
  async select(handle) {}

  /**
   * Sends the provided keys to the given form control element. If an element
   * is not provided, the active element receives the keys.
   * {@link https://www.w3.org/TR/webdriver1/#element-send-keys}
   *
   * @param {?ElementHandle} handle
   * @param {string} keys
   * @return {!Promise}
   */
  async type(handle, keys) {}

  /**
   * Clears the value of the given input element.
   * {@link https://www.w3.org/TR/webdriver1/#element-clear}
   *
   * @param {!ElementHandle} handle
   * @return {!Promise}
   */
  async clear(handle) {}

  /**
   * Executes a touch action on the given element.
   *
   * @param {!ElementHandle} handle
   * @return {!Promise}
   */
  async touch(handle) {}

  /**
   * Executes a swipe gesture on the given element.
   *
   * @param {!ElementHandle} handle
   * @return {!Promise}
   */
  async swipe(handle) {}
}

/** @typedef {{
 *   x: number,
 *   y: number,
 *   width: number,
 *   height: number
 * }}
*/
let DOMRectDef;
