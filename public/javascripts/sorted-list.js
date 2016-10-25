/**
 * UI element that keeps its children sorted given the name of a data attribute
 * to use for comparison.
 * @param {Object} $container
 * @param {String} dataAttribute
 * @listens event:ui:datachange
 * @constructor
 */
var SortedList = function ($container, dataAttribute) {
  var self = this;
  self.$container = $container;
  self.dataAttribute = dataAttribute;

  $container.on('ui:datachange', function (e) {
    var $element = $(e.target);
    self.update($element);
  })
};

/**
 * Inserts element in the list so that values in the dataAttribute are in
 * order. This can be viewed as an online insertion sort.
 * @param {Object} $element
 */
SortedList.prototype.insert = function ($element) {
  var $children = this.$container.children();

  if ($children.length) {
    this.update($element);

    // Container is empty initially
  } else {
    this.$container.append($element);
  }
};

/**
 * Finds the right place to insert given element and either inserts it
 * or moves it if already in the DOM.
 * @param {Object} $element
 */
SortedList.prototype.update = function ($element) {
  var $children = this.$container.children();

  for (var i = $children.length - 1; i >= 0; i--) {
    var child = $children.get(i);
    if ($(child).data(this.dataAttribute) < $element.data(this.dataAttribute)) {
      $element.insertAfter($(child));
      break;
    }
  }
};

module.exports = SortedList;
