"use strict";
// Generated by CoffeeScript 1.8.0
(function() {
  var CoreScroller, activatedElement, checkVisibility, doesScroll, findScrollableElement //
    , sortBy0, firstScrollableElement //
    , getDimension, getSign, performScroll, scrollProperties, shouldScroll;

  activatedElement = null;

  getSign = function(val) {
    return val === 0 ? 0 : val < 0 ? -1 : 1;
  };

  scrollProperties = {
    x: {
      axisName: 'scrollLeft',
      max: 'scrollWidth',
      viewSize: 'clientWidth'
    },
    y: {
      axisName: 'scrollTop',
      max: 'scrollHeight',
      viewSize: 'clientHeight'
    }
  };

  getDimension = function(el, direction, name) {
    return !Utils.isString(name) ? name
      : (name !== 'viewSize' || el !== document.body) ? el[scrollProperties[direction][name]]
      : (direction === 'x') ? window.innerWidth : window.innerHeight;
  };

  performScroll = function(element, direction, amount) {
    var before;
    if (direction === 'x') {
      before = element.scrollLeft;
      element.scrollLeft += Math.ceil(amount * 0.6);
      return element.scrollLeft !== before;
    } else {
      before = element.scrollTop;
      element.scrollTop += amount;
      return element.scrollTop !== before;
    }
  };

  shouldScroll = function(element, direction) {
    var computedStyle = window.getComputedStyle(element), _ref;
    if (computedStyle.getPropertyValue("display") === "none") {
    }
    else if (computedStyle.getPropertyValue("overflow-" + direction) === "hidden") {
    }
    else if ((_ref = computedStyle.getPropertyValue("visibility")) === "hidden" || _ref === "collapse") {
    }
    else {
      return true;
    }
    return false;
  };

  doesScroll = function(element, direction, amount, factor) {
    var delta = factor * getDimension(element, direction, amount);
    delta = delta ? getSign(delta) : -1;
    return performScroll(element, direction, delta) && performScroll(element, direction, -delta);
  };

  findScrollableElement = function(element, direction, amount, factor) {
    while (element !== document.body && !(doesScroll(element, direction, amount, factor) && shouldScroll(element, direction))) {
      element = element.parentElement || document.body;
    }
    return element;
  };
  
  sortBy0 = function(a, b) {
    return a[0] - b[0];
  };

  firstScrollableElement = function(element) {
    if (doesScroll(element, "y", 1, 1) || doesScroll(element, "y", -1, 1)) {
      return element;
    }
    var children = [], rect, _ref = element.children, _len = _ref.length;
    while (0 <= --_len) {
      element = _ref[_len];
      if (rect = DomUtils.getVisibleClientRect(element)) {
        children.push([rect.width * rect.height, element]);
      }
    }
    if (_len = children.length) {
      children = children.sort(sortBy0);
      while (0 <= --_len) {
        if (element = firstScrollableElement(children[_len][1])) {
          return element;
        }
      }
    }
    return null;
  };

  checkVisibility = function(element) {
    if (DomUtils.isVisibile(element)) {
      return false;
    }
    activatedElement = element;
    return true;
  };

  CoreScroller = {
    smoothScroll: true,
    time: 0,
    isLastEventRepeat: false,
    keyIsDown: false,
    init: function() {
      handlerStack.push({
        keydown: function(event) {
          CoreScroller.keyIsDown = true;
          CoreScroller.isLastEventRepeat = event.repeat;
          return true;
        },
        keyup: function() {
          CoreScroller.keyIsDown = false;
          CoreScroller.time += 1;
          return true;
        }
      });
      this.data.animate = this.data.animate.bind(this.data);
    },
    wouldNotInitiateScroll: function() {
      return this.smoothScroll && (this.isLastEventRepeat);
    },
    minCalibration: 0.5,
    maxCalibration: 1.6,
    calibrationBoundary: 150,
    activationTime: 0,
    scroll: function(element, direction, amount) {
      if (!amount) {
        return;
      }
      if (!this.smoothScroll) {
        performScroll(element, direction, amount);
        checkVisibility(element);
        return;
      }
      if (this.isLastEventRepeat) {
        return;
      }
      this.activationTime = ++this.time;
      var data = this.data;
      data.sign = getSign(amount);
      data.element = element;
      data.direction = direction;
      data.amount = Math.abs(amount);
      data.duration = Math.max(100, 20 * Math.log(data.amount));
      data.totalDelta = 0;
      data.totalElapsed = 0.0;
      data.calibration = 1.0;
      data.timestamp = -1.0;
      requestAnimationFrame(this.data.animate);
    },
    KeyIsStillDown: function() {
      return this.time === this.activationTime && this.keyIsDown;
    },
    data: {
      amount: 0,
      calibration: 1.0,
      direction: "",
      duration: 0,
      element: null,
      sign: 0,
      timestamp: -1.0,
      totalDelta: 0,
      totalElapsed: 0.0,
      animate: function(timestamp) {
        var int1 = this.timestamp, elapsed;
        elapsed = (int1 !== -1) ? (timestamp - int1) : 0;
        if (elapsed === 0) {
          requestAnimationFrame(this.animate);
        } else {
          this.totalElapsed += elapsed;
        }
        this.timestamp = timestamp;
        if (CoreScroller.KeyIsStillDown()) {
          int1 = this.calibration;
          if (75 <= this.totalElapsed && (CoreScroller.minCalibration <= int1 && int1 <= CoreScroller.maxCalibration)) {
            int1 = CoreScroller.calibrationBoundary / this.amount / int1;
            this.calibration *= (int1 > 1.05) ? 1.05 : (int1 < 0.95) ? 0.95 : 1.0;
          }
          int1 = Math.ceil(this.amount * (elapsed / this.duration) * this.calibration);
        } else {
          int1 = Math.ceil(this.amount * (elapsed / this.duration) * this.calibration);
          int1 = Math.max(0, Math.min(int1, this.amount - this.totalDelta));
        }
        if (int1 && performScroll(this.element, this.direction, this.sign * int1)) {
          this.totalDelta += int1;
          requestAnimationFrame(this.animate);
        } else {
          checkVisibility(this.element);
          if (elapsed !== 0) {
            this.element = null;
          }
        }
      }
    }
  };

  (typeof exports !== "undefined" && exports !== null ? exports : window).Scroller = {
    init: function() {
      handlerStack.push({
        DOMActivate: function() {
          activatedElement = event.target;
          return true;
        }
      });
      CoreScroller.init();
    },
    setSmoothScroll: function(smoothScroll) {
      CoreScroller.smoothScroll = smoothScroll;
    },
    getActivatedElement: function() {
      return activatedElement;
    },
    scrollBy: function(direction, amount, factor) {
      var element, elementAmount;
      if (factor == null) {
        factor = 1;
      }
      if (!document.body && amount instanceof Number) {
        if (direction === "x") {
          window.scrollBy(amount, 0);
        } else {
          window.scrollBy(0, amount);
        }
        return;
      }
      if (activatedElement) {
      } else if (activatedElement = document.body && firstScrollableElement(document.body)) {
      } else {
        return;
      }
      if (!CoreScroller.wouldNotInitiateScroll()) {
        element = findScrollableElement(activatedElement, direction, amount, factor);
        elementAmount = factor * getDimension(element, direction, amount);
        CoreScroller.scroll(element, direction, elementAmount);
      }
    },
    scrollTo: function(direction, pos) {
      var amount, element;
      if (activatedElement) {
      } else if (activatedElement = document.body && firstScrollableElement(document.body)) {
      } else {
        return;
      }
      element = findScrollableElement(activatedElement, direction, pos, 1);
      amount = getDimension(element, direction, pos) - element[scrollProperties[direction].axisName];
      CoreScroller.scroll(element, direction, amount);
    }
  };

})();
