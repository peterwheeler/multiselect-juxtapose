/* juxtapose - v2017-03-16-19-29-42 - 2017-03-16
 * Copyright (c) 2017 Alex Duner and Northwestern University Knight Lab 
 */
/* juxtapose - v1.1.2 - 2015-07-16
 * Copyright (c) 2015 Alex Duner and Northwestern University Knight Lab
 */

(function (document, window) {

  var juxtapose = {
    sliders: [],
    OPTIMIZATION_ACCEPTED: 1,
    OPTIMIZATION_WAS_CONSTRAINED: 2
  };

  var flickr_key = "d90fc2d1f4acc584e08b8eaea5bf4d6c";
  var FLICKR_SIZE_PREFERENCES = ['Large', 'Medium'];

  function Graphic(properties, slider) {
    var self = this;
    this.image = new Image();

    this.loaded = false;
    // this.image.onload = function() {
    //   self.loaded = true;
    //   // slider._onLoaded();
    // };

    this.image.src = properties.src;
    this.label = properties.label || false;
    this.credit = properties.credit || false;
    this.id = properties.id || false;
  }

  function FlickrGraphic(properties, slider) {
    var self = this;
    this.image = new Image();

    this.loaded = false;
    // this.image.onload = function() {
    //   self.loaded = true;
    //   // slider._onLoaded();
    // };

    this.flickrID = this.getFlickrID(properties.src);
    this.callFlickrAPI(this.flickrID, self);

    this.label = properties.label || false;
    this.credit = properties.credit || false;
    this.id = properties.id || false;
  }

  FlickrGraphic.prototype = {
    getFlickrID: function(url) {
      var idx = url.indexOf("flickr.com/photos/");
      var pos = idx + "flickr.com/photos/".length;
      var photo_info = url.substr(pos);
      if (photo_info.indexOf('/') == -1) return null;
      if (photo_info.indexOf('/') === 0) photo_info = photo_info.substr(1);
      id = photo_info.split("/")[1];
      return id;
    },

    callFlickrAPI: function(id, self) {
      var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.getSizes' +
          '&api_key=' + flickr_key +
          '&photo_id=' + id + '&format=json&nojsoncallback=1';

      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onload = function() {
        if (request.status >= 200 && request.status < 400){
          data = JSON.parse(request.responseText);
          var flickr_url = self.bestFlickrUrl(data.sizes.size);
          self.setFlickrImage(flickr_url);
        } else {
          console.error("There was an error getting the picture from Flickr");
        }
      };
      request.onerror = function() {
        console.error("There was an error getting the picture from Flickr");
      };
      request.send();
    },

    setFlickrImage: function(src) {
      this.image.src = src;
    },

    bestFlickrUrl: function(ary) {
      var dict = {};
      for (var i = 0; i < ary.length; i++) {
        dict[ary[i].label] = ary[i].source;
      }
      for (var j = 0; j < FLICKR_SIZE_PREFERENCES.length; j++) {
        if (FLICKR_SIZE_PREFERENCES[j] in dict) {
          return dict[FLICKR_SIZE_PREFERENCES[j]];
        }
      }
      return ary[0].source;
    }
  };

  function getNaturalDimensions(DOMelement) {
    if (DOMelement.naturalWidth && DOMelement.naturalHeight) {
      return {width: DOMelement.naturalWidth, height: DOMelement.naturalHeight};
    }
    // http://www.jacklmoore.com/notes/naturalwidth-and-naturalheight-in-ie/
    var img = new Image();
    img.src = DOMelement.src;
    return {width: img.width, height: img.height};
  }

  function getImageDimensions(img) {
    var dimensions = {
      width: getNaturalDimensions(img).width,
      height: getNaturalDimensions(img).height,
      aspect: function() { return (this.width / this.height); }
    };
    return dimensions;
  }

  function addClass(element, c) {
    if (element.classList) {
      element.classList.add(c);
    } else {
      element.className += " " + c;
    }
  }

  function removeClass(element, c) {
    element.className = element.className.replace(/(\S+)\s*/g, function (w, match) {
      if (match === c) {
        return '';
      }
      return w;
    }).replace(/^\s+/, '');
  }

  function setText(element, text) {
    if (document.body.textContent) {
      element.textContent = text;
    } else {
      element.innerText = text;
    }
  }

  function getComputedWidthAndHeight(element) {
    if (window.getComputedStyle) {
      return {
        width: parseInt(getComputedStyle(element).width, 10),
        height: parseInt(getComputedStyle(element).height, 10)
      };
    } else {
      w = element.getBoundingClientRect().right - element.getBoundingClientRect().left;
      h = element.getBoundingClientRect().bottom - element.getBoundingClientRect().top;
      return {
        width: parseInt(w, 10) || 0,
        height: parseInt(h, 10) || 0
      };
    }
  }

  function viewport() {
    var e = window, a = 'inner';
    if ( !( 'innerWidth' in window ) ) {
      a = 'client';
      e = document.documentElement || document.body;
    }
    return { width : e[ a+'Width' ] , height : e[ a+'Height' ] }
  }

  function getPageX(e) {
    var pageX;
    if (e.pageX) {
      pageX = e.pageX;
    } else if (e.touches) {
      pageX = e.touches[0].pageX;
    } else {
      pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    }
    return pageX;
  }

  function getPageY(e) {
    var pageY;
    if (e.pageY) {
      pageY = e.pageY;
    } else if (e.touches) {
      pageY = e.touches[0].pageY;
    } else {
      pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    return pageY;
  }

  function checkFlickr(url) {
    var idx = url.indexOf("flickr.com/photos/");
    if (idx == -1) {
      return false;
    } else {
      return true;
    }
  }

  function getLeftPercent(slider, input) {
    if (typeof(input) === "string" || typeof(input) === "number") {
      leftPercent = parseInt(input, 10);
    } else {
      var sliderRect = slider.getBoundingClientRect();
      var offset = {
        top: sliderRect.top + document.body.scrollTop,
        left: sliderRect.left + document.body.scrollLeft
      };
      var width = slider.offsetWidth;
      var pageX = getPageX(input);
      var relativeX = pageX - offset.left;
      leftPercent = (relativeX / width) * 100;
    }
    return leftPercent;
  }

  function getTopPercent(slider, input) {
    if (typeof(input) === "string" || typeof(input) === "number") {
      topPercent = parseInt(input, 10);
    } else {
      var sliderRect = slider.getBoundingClientRect();
      var offset = {
        top: sliderRect.top + document.body.scrollTop,
        left: sliderRect.left + document.body.scrollLeft
      };
      var width = slider.offsetHeight;
      var pageY = getPageY(input);
      var relativeY = pageY - offset.top;
      topPercent = (relativeY / width) * 100;
    }
    return topPercent;
  }

  // values of BOOLEAN_OPTIONS are ignored. just used for 'in' test on keys
  var BOOLEAN_OPTIONS =  {'animate': true, 'showLabels': true, 'showCredits': true, 'makeResponsive': true };
  function interpret_boolean(x) {
    if (typeof(x) != 'string') {
      return Boolean(x);
    }
    return !(x === 'false' || x === '');
  }

  function JXSlider(selector, images, options) {

    this.selector = selector;
    this.images = [];
    this.imageDivs = [];

    var i;
    this.options = { // new options must have default values set here.
      animate: true,
      showLabels: true,
      showCredits: true,
      makeResponsive: true,
      startingPosition: "50%",
      mode: 'horizontal',
      multiSelect: true,
      callback: null // pass a callback function if you like
    };

    for (i in this.options) {
      if(i in options) {
        if (i in BOOLEAN_OPTIONS) {
          this.options[i] = interpret_boolean(options[i]);
        } else {
          this.options[i] = options[i];
        }
      }
    }

    if (images.length >= 2) {
      for (var i = 0; i < images.length; i++) {
        if(checkFlickr(images[i].src)) {
          this.imgNew = new FlickrGraphic(images[i], this);
        } else {
          this.imgNew = new Graphic(images[i], this);
        }
        this.imgNew.loaded = true;
        if(this.imgNew.loaded === true){
          this._onLoaded(this.imgNew);
        }
        // if (this.imgNew.credit) {
        // this.options.showCredits = true;
        // } else {
        // this.options.showCredits = false;
        // }
        this.images.push(this.imgNew);
      }
    } else if (images.length < 2) {
      console.warn("The images parameter takes at least two Image objects.");
    }
    this.imgBefore = this.images[0];
    this.imgAfter = this.images[1];

    this.allLoaded = function(loaded){
      return loaded = true;
    }
    if (this.images.every(this.allLoaded) === true) {
      this._allLoaded();
    };
  }

  JXSlider.prototype = {

    addSlider: function(input, image) {
      if (this.options.mode === "vertical") {
        leftPercent = getTopPercent(this.slider, input);
      } else {
        leftPercent = getLeftPercent(this.slider, input);
      }

      leftPercent = leftPercent.toFixed(2) + "%";

      if (this.options.mode === "vertical") {
          image.style.height = leftPercent;
        } else {
          image.style.width = leftPercent;
        }
    },

    updateSlider: function(input, animate) {
      var leftPercent, rightPercent;
      console.log(input);
      if (this.options.mode === "vertical") {
        leftPercent = getTopPercent(this.slider, input);
      } else {
        leftPercent = getLeftPercent(this.slider, input);
      }

      leftPercent = leftPercent.toFixed(2) + "%";
      leftPercentNum = parseFloat(leftPercent);
      rightPercent = (100 - leftPercentNum) + "%";

      if (leftPercentNum > 0 && leftPercentNum < 100) {
        removeClass(this.handle, 'transition');
        removeClass(this.rightImage, 'transition');
        removeClass(this.leftImage, 'transition');

        if (this.options.animate && animate) {
          addClass(this.handle, 'transition');
          addClass(this.leftImage, 'transition');
          addClass(this.rightImage, 'transition');
        }

        if (this.options.mode === "vertical") {
          this.handle.style.top = leftPercent;
          this.leftImage.style.height = leftPercent;
          this.rightImage.style.height = rightPercent;
        } else {
          this.handle.style.left = leftPercent;
          this.leftImage.style.width = leftPercent;
          this.rightImage.style.width = rightPercent;
        }
        this.sliderPosition = leftPercent;
      }
    },

    updateImage: function(inImage, outImage){
      var newImage, oldImage;

      newImage = document.getElementById(inImage);
      oldImage = this.slider.getElementsByClassName('jx-image ' + outImage)[0];

      removeClass(oldImage, outImage);
      addClass(newImage, outImage);
      removeClass(newImage, 'jx-hidden');
      addClass(oldImage, 'jx-hidden');

      if (this.options.mode === "vertical") {
        newImage.style.height = oldImage.style.height;
        oldImage.style.height = '50%';
      } else {
        newImage.style.width = oldImage.style.width;
        oldImage.style.width = '50%';
      }

      if(outImage === 'jx-left'){
        this.leftImage = newImage;
      } else {
        this.rightImage = newImage;
      }
    },

    getPosition: function() {
      return this.sliderPosition;
    },

    displayLabel: function(element, labelSide, labelText) {
      label = document.createElement("div");
      label.className = 'jx-label jx-label-' + labelSide;
      label.setAttribute('tabindex', 0); //put the controller in the natural tab order of the document

      setText(label, labelText);
      element.appendChild(label);
    },

    updateLabel: function(labelText, labelSide) {
      var label = document.getElementsByClassName(labelSide)[0];
      setText(label, labelText);
    },

    displayCredits: function(creditText) {
      credit = document.createElement("div");
      credit.className = "jx-credit";

      text = "<em>Photo Credits:</em>";
      if (creditText) {
        text += " <em>Before</em> " + creditText;
      }

      credit.innerHTML = text;

      // this.wrapper.appendChild(credit);
    },

    setStartingPosition: function(s) {
      this.options.startingPosition = s;
    },

    checkImages: function() {
      if (getImageDimensions(this.imgBefore.image).aspect() ==
        getImageDimensions(this.imgAfter.image).aspect()) {
        return true;
      } else {
        return false;
      }
    },

    calculateDims: function(width, height){
      var ratio = getImageDimensions(this.imgBefore.image).aspect();
      if (width) {
        height = width / ratio;
      } else if (height) {
        width = height * ratio;
      }
      return {
        width: width,
        height: height,
        ratio: ratio
      };
    },

    responsivizeIframe: function(dims){
      //Check the slider dimensions against the iframe (window) dimensions
      if (dims.height < window.innerHeight){
        //If the aspect ratio is greater than 1, imgs are landscape, so letterbox top and bottom
        if (dims.ratio >= 1){
          this.wrapper.style.paddingTop = parseInt((window.innerHeight - dims.height) / 2) + "px";
        }
      } else if (dims.height > window.innerHeight) {
        /* If the image is too tall for the window, which happens at 100% width on large screens,
         * force dimension recalculation based on height instead of width */
        dims = this.calculateDims(0, window.innerHeight);
        this.wrapper.style.paddingLeft = parseInt((window.innerWidth - dims.width) / 2) + "px";
      }
      if (this.options.showCredits) {
        // accommodate the credits box within the iframe
        dims.height -= 13;
      }
      return dims;
    },

    setWrapperDimensions: function() {
      var wrapperWidth = getComputedWidthAndHeight(this.wrapper).width;
      var wrapperHeight = getComputedWidthAndHeight(this.wrapper).height;
      var dims = this.calculateDims(wrapperWidth, wrapperHeight);
      // if window is in iframe, make sure images don't overflow boundaries
      if (window.location !== window.parent.location && !this.options.makeResponsive) {
        dims = this.responsivizeIframe(dims);
      }

      this.wrapper.style.height = parseInt(dims.height) + "px";
      this.wrapper.style.width = parseInt(dims.width) + "px";
    },

    optimizeWrapper: function(maxWidth){
      var result = juxtapose.OPTIMIZATION_ACCEPTED;
      if ((this.imgBefore.image.naturalWidth >= maxWidth) && (this.imgAfter.image.naturalWidth >= maxWidth)) {
        this.wrapper.style.width = maxWidth + "px";
        result = juxtapose.OPTIMIZATION_WAS_CONSTRAINED;
      } else if (this.imgAfter.image.naturalWidth < maxWidth) {
        this.wrapper.style.width = this.imgAfter.image.naturalWidth + "px";
      } else {
        this.wrapper.style.width = this.imgBefore.image.naturalWidth + "px";
      }
      this.setWrapperDimensions();
      return result;
    },

    _onLoaded: function(imageObject) {
        this.currentImage = document.createElement("div");
        this.currentImage.className = 'jx-image jx-hidden';
        this.currentImage.id = imageObject.id;
        this.currentImage.setAttribute('data-label', imageObject.label);
        this.currentImage.appendChild(imageObject.image);

        if (this.options.showCredits === true) {
          this.displayCredits(imageObject.credit);
        }

        this.imageDivs.push(this.currentImage);
    },

    _allLoaded: function(){
      this.container = document.getElementsByClassName('juxtapose-container')[0];
      this.wrapper = document.querySelector(this.selector);
      addClass(this.wrapper, 'juxtapose');

      this.wrapper.style.width = getNaturalDimensions(this.imgBefore.image).width;
      this.setWrapperDimensions();

      this.slider = document.createElement("div");
      this.slider.className = 'jx-slider';
      this.wrapper.appendChild(this.slider);

      if (this.options.mode != "horizontal") {
        addClass(this.slider, this.options.mode);
      }

      this.handle = document.createElement("div");
      this.handle.className = 'jx-handle';

      this.leftImage = this.imageDivs[0];
      this.leftImage.className = 'jx-image jx-left';

      this.rightImage = this.imageDivs[1];
      this.rightImage.className = 'jx-image jx-right';

      this.leftDropDownContainer = document.createElement('div');
      this.leftDropDownContainer.className = 'dropdown-container dropdown-left';

      this.leftDropDownButton = document.createElement("a");
      this.leftDropDownButton.className = 'dropdown-button btn left-button';
      this.leftDropDownButton.setAttribute('data-activates', 'left-dropdown');
      this.leftDropDownButton.setAttribute('href', '#');
      this.leftDropDownButton.innerHTML = '<span>Left map</span><i class="material-icons">&#xE5C5;</i>';

      this.leftDropDown = document.createElement("ul");
      this.leftDropDown.id = 'left-dropdown';
      this.leftDropDown.className = 'dropdown-content';

      this.rightDropDownContainer = document.createElement('div');
      this.rightDropDownContainer.className = 'dropdown-container dropdown-right';

      this.rightDropDownButton = document.createElement("a");
      this.rightDropDownButton.className = 'dropdown-button btn right-button';
      this.rightDropDownButton.setAttribute('data-activates', 'right-dropdown');
      this.rightDropDownButton.setAttribute('href', '#');
      this.rightDropDownButton.innerHTML = '<i class="material-icons">&#xE5C5;</i><span>Right map</span>';

      this.rightDropDown = document.createElement("ul");
      this.rightDropDown.id = 'right-dropdown';
      this.rightDropDown.className = 'dropdown-content';

      this.leftDropDownContainer.appendChild(this.leftDropDownButton);
      this.leftDropDownContainer.appendChild(this.leftDropDown);

      this.rightDropDownContainer.appendChild(this.rightDropDownButton);
      this.rightDropDownContainer.appendChild(this.rightDropDown);

      for (var i = 0; i < this.imageDivs.length; i++) {
        var currentLink = this.imageDivs[i];
        this.leftLink = document.createElement('li');
        this.leftLink.setAttribute('data-ref', this.imageDivs[i].id);
        this.leftLink.setAttribute('data-label', this.imageDivs[i].getAttribute('data-label'));
        this.leftLink.innerHTML = '<a href="#">'+ this.imageDivs[i].getAttribute('data-label') + '</a>';
        this.rightLink = document.createElement("li");
        this.rightLink.setAttribute('data-ref', this.imageDivs[i].id);
        this.rightLink.setAttribute('data-label', this.imageDivs[i].getAttribute('data-label'));
        this.rightLink.innerHTML = '<a href="#">'+ this.imageDivs[i].getAttribute('data-label') + '</a>';
        this.leftDropDown.appendChild(this.leftLink);
        this.rightDropDown.appendChild(this.rightLink);
      }

      this.labCredit = document.createElement("a");
      this.labCredit.setAttribute('href', 'http://juxtapose.knightlab.com');
      this.labCredit.setAttribute('target', '_blank');
      this.labCredit.className = 'jx-knightlab';

      this.labLogo = document.createElement("div");
      this.labLogo.className = 'knightlab-logo';

      this.labCredit.appendChild(this.labLogo);

      this.projectName = document.createElement("span");
      this.projectName.className = 'juxtapose-name';

      setText(this.projectName, 'JuxtaposeJS');
      this.labCredit.appendChild(this.projectName);

      this.slider.appendChild(this.handle);
      for (var i = 0; i < this.imageDivs.length; i++) {
        this.slider.appendChild(this.imageDivs[i])
      }
      this.slider.appendChild(this.labCredit);

      this.leftArrow = document.createElement("div");
      this.rightArrow = document.createElement("div");
      this.control = document.createElement("div");
      this.controller = document.createElement("div");

      this.leftArrow.className = 'jx-arrow jx-left';
      this.rightArrow.className = 'jx-arrow jx-right';
      this.control.className = 'jx-control';
      this.controller.className = 'jx-controller';

      this.controller.setAttribute('tabindex', 0); //put the controller in the natural tab order of the document
      this.controller.setAttribute('role', 'slider');
      this.controller.setAttribute('aria-valuenow', 50);
      this.controller.setAttribute('aria-valuemin', 0);
      this.controller.setAttribute('aria-valuemax', 100);

      this.handle.appendChild(this.leftArrow);
      this.handle.appendChild(this.control);
      this.handle.appendChild(this.rightArrow);
      this.control.appendChild(this.controller);

      this.container.prepend(this.rightDropDownContainer);
      this.container.prepend(this.leftDropDownContainer);

      this._init();
      console.log("all loaded");
    },

    _init: function() {

      // if (this.checkImages() === false) {
      //   console.warn(this, "Check that the two images have the same aspect ratio for the slider to work correctly.");
      // }
      for (var i = 0; i < this.imageDivs.length; i++) {
        this.addSlider(this.options.startingPosition, this.imageDivs[i]);
      }
      this.updateSlider(this.options.startingPosition, false);

      if (this.options.showLabels === true) {
        if (this.imgBefore.label) {
          this.displayLabel(this.wrapper, 'left', this.imgBefore.label);
        }
        if (this.imgAfter.label) {
          this.displayLabel(this.wrapper, 'right', this.imgAfter.label);
        }
      }

      if (this.options.showCredits === true) {
        this.displayCredits();
      }

      var self = this;
      window.addEventListener("resize", function() {
        self.setWrapperDimensions();
      });

      var leftList = document.getElementById('left-dropdown').getElementsByTagName("li");
      for (var i = 0; i < leftList.length; i++) {
          leftList[i].addEventListener("click", function(e) {
            self.updateImage(this.getAttribute('data-ref'), 'jx-left');
            self.updateLabel(this.getAttribute('data-label'), 'jx-label-left');
          }, false);
      }

      var rightList = document.getElementById('right-dropdown').getElementsByTagName("li");
      for (var i = 0; i < rightList.length; i++) {
          rightList[i].addEventListener("click", function(e) {
            self.updateImage(this.getAttribute('data-ref'), 'jx-right');
            self.updateLabel(this.getAttribute('data-label'), 'jx-label-right');
          }, false);
      }

      // Set up Javascript Events
      // On mousedown, call updateSlider then set animate to false
      // (if animate is true, adds css transition when updating).

      this.slider.addEventListener("mousedown", function(e) {
        e = e || window.event;
        e.preventDefault();
        self.updateSlider(e, true);
        animate = true;

        this.addEventListener("mousemove", function(e) {
          e = e || window.event;
          e.preventDefault();
          if (animate) { self.updateSlider(e, false); }
        });

        this.addEventListener('mouseup', function(e) {
          e = e || window.event;
          e.preventDefault();
          e.stopPropagation();
          this.removeEventListener('mouseup', arguments.callee);
          animate = false;
        });
      });

      this.slider.addEventListener("touchstart", function(e) {
        e = e || window.event;
        e.preventDefault();
        e.stopPropagation();
        self.updateSlider(e, true);

        this.addEventListener("touchmove", function(e) {
          e = e || window.event;
          e.preventDefault();
          e.stopPropagation();
          self.updateSlider(event, false);
        });
      });

      /* keyboard accessibility */

      this.handle.addEventListener("keydown", function (e) {
        e = e || window.event;
        var key = e.which || e.keyCode;
        var ariaValue = parseFloat(this.style.left);

          //move jx-controller left
          if (key == 37) {
            ariaValue = ariaValue - 1;
          var leftStart = parseFloat(this.style.left) - 1;
          self.updateSlider(leftStart, false);
          self.controller.setAttribute('aria-valuenow', ariaValue);
          }

          //move jx-controller right
          if (key == 39) {
            ariaValue = ariaValue + 1;
          var rightStart = parseFloat(this.style.left) + 1;
          self.updateSlider(rightStart, false);
          self.controller.setAttribute('aria-valuenow', ariaValue);
          }
      });

      //toggle right-hand image visibility
      this.leftImage.addEventListener("keydown", function (event) {
           var key = event.which || event.keyCode;
            if ((key == 13) || (key ==32)) {
              self.updateSlider("90%", true);
              self.controller.setAttribute('aria-valuenow', 90);
            }
      });

      //toggle left-hand image visibility
      this.rightImage.addEventListener("keydown", function (event) {
           var key = event.which || event.keyCode;
            if ((key == 13) || (key ==32)) {
              self.updateSlider("10%", true);
              self.controller.setAttribute('aria-valuenow', 10);
            }
      });

      juxtapose.sliders.push(this);

      if (this.options.callback && typeof(this.options.callback) == 'function') {
        this.options.callback(this);
      }
    }

  };

  /*
    Given an element that is configured with the proper data elements, make a slider out of it.
    Normally this will just be used by scanPage.
  */
  juxtapose.makeSlider = function (element, idx) {
    if (typeof idx == 'undefined') {
      idx = juxtapose.sliders.length; // not super threadsafe...
    }

    var w = element;
    var images = w.querySelectorAll('img');
    var allImages = [];

    var options = {};
    // don't set empty string into options, that's a false false.
    if (w.getAttribute('data-animate')) {
      options.animate = w.getAttribute('data-animate');
    }
    if (w.getAttribute('data-showlabels')) {
      options.showLabels = w.getAttribute('data-showlabels');
    }
    if (w.getAttribute('data-showcredits')) {
      options.showCredits = w.getAttribute('data-showcredits');
    }
    if (w.getAttribute('data-startingposition')) {
      options.startingPosition = w.getAttribute('data-startingposition');
    }
    if (w.getAttribute('data-mode')) {
      options.mode = w.getAttribute('data-mode');
    }
    if (w.getAttribute('data-makeresponsive')) {
      options.mode = w.getAttribute('data-makeresponsive');
    }

    specificClass = 'juxtapose-' + idx;
    addClass(element, specificClass);

    selector = '.' + specificClass;

    if (w.innerHTML) {
      w.innerHTML = '';
    } else {
      w.innerText = '';
    }

    for (var i = 0; i < images.length; i++) {
      allImages.push(
        {
          src: images[i].src,
          label: images[i].getAttribute('data-label'),
          credit: images[i].getAttribute('data-credit'),
          id: images[i].getAttribute('id')
        }
      )
    }

    slider = new juxtapose.JXSlider(selector, allImages, options);
  };

  //Enable HTML Implementation
  juxtapose.scanPage = function() {
      var elements = document.querySelectorAll('.juxtapose');
      for (var i = 0; i < elements.length; i++) {
      juxtapose.makeSlider(elements[i], i);
    }
  };

  juxtapose.JXSlider = JXSlider;
  window.juxtapose = juxtapose;

  juxtapose.scanPage();

}(document, window));


// addEventListener polyfill 1.0 / Eirik Backer / MIT Licence
(function(win, doc){
  if(win.addEventListener)return;   //No need to polyfill

  function docHijack(p){var old = doc[p];doc[p] = function(v){return addListen(old(v));};}
  function addEvent(on, fn, self){
    return (self = this).attachEvent('on' + on, function(e) {
      var e = e || win.event;
      e.preventDefault  = e.preventDefault  || function(){e.returnValue = false;};
      e.stopPropagation = e.stopPropagation || function(){e.cancelBubble = true;};
      fn.call(self, e);
    });
  }
  function addListen(obj, i){
    if(i = obj.length)while(i--)obj[i].addEventListener = addEvent;
    else obj.addEventListener = addEvent;
    return obj;
  }

  addListen([doc, win]);
  if('Element' in win)win.Element.prototype.addEventListener = addEvent;      //IE8
  else{                                     //IE < 8
    doc.attachEvent('onreadystatechange', function(){addListen(doc.all);});   //Make sure we also init at domReady
    docHijack('getElementsByTagName');
    docHijack('getElementById');
    docHijack('createElement');
    addListen(doc.all);
  }
})(window, document);
