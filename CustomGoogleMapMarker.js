//This function is a constructor that takes in the arguments that are defined by the object that is getting displayed.
//This is currently on the index.html file on line 40
function CustomMarker(latlng, map, args) {
	this.latlng = latlng;	
	this.args = args;	
	this.setMap(map);	
}

//I'm not sure exactly what's happening here. I think it's creating the prototype as an overlay.
CustomMarker.prototype = new google.maps.OverlayView();

//This is the main function that creates the overlay.
CustomMarker.prototype.draw = function() {

	// setting up easy variable names for the div that is being created (the overlay is coded as a div)
	var self = this;
	var div = this.div;
	
	if (!div) {

		//setting var div as a new element on the dom
		div = this.div = document.createElement('div');


		var divText = document.createElement('div');
		var divNum = document.createElement('div');
		var highlightDiv = document.createElement('div');
		var divPoint = document.createElement('div');
		var number = document.createTextNode(self.args.number);
		var text = document.createTextNode(self.args.text);
		var pointImg = document.createElement('img');

		divText.className = 'markerPrice';
		divNum.className = 'markerNumber';
		divPoint.className = 'markerPoint';
		highlightDiv.className = 'markerHighlight';

		if (self.args.isSublease !== true) {
			highlightDiv.className += ' promo-highlight';
			divNum.className += ' promo-number';
			divText.className += ' promo-price';
			pointImg.src = 'sublease-pointer.png';
		} else {
			highlightDiv.className += ' sublease-highlight';
			divNum.className += ' sublease-number';
			divText.className += ' sublease-price';
			pointImg.src = 'sublease-pointer.png';
		}

		divNum.appendChild(number);
		divText.appendChild(text);
		divPoint.appendChild(pointImg);
		highlightDiv.appendChild(divNum);
		highlightDiv.appendChild(divText);
		div.appendChild(highlightDiv);
		div.appendChild(divPoint);

		// this is setting the class and styles of the overlay div.
		div.className = 'marker';

		$(div).addClass('js-listing-' + this.args.marker_id);

		// this is styling the div, but I want to find a way to style the text inside of the div. I'm still working on that.
		//div.style.position = 'absolute';
		//div.style.cursor = 'pointer';
		//div.style.width = '60px';
		//div.style.height = 'auto';
		//div.style.background = 'blue';
		//div.style.padding = '4px';
		//div.style.color = 'white';
		//div.style.font = '16px Helvetica, Arial, sans-serif';

		//if the object has a marker_id, set the div to have a marker_id
		if (typeof(self.args.marker_id) !== 'undefined') {
			div.dataset.marker_id = self.args.marker_id;
		}

		//This is your click functionality! What do you want to happen when someone clicks on the marker?
		//This is how we can highlight the appropriate listing in the side bar?
		google.maps.event.addDomListener(div, "click", function(event) {
			google.maps.event.trigger(self, "click");
			$('.js-housing').scrollTo($('.js-listing-' + id), 100);
		});

		google.maps.event.addDomListener(div, 'mouseover', function(event){
			var id = $(this).attr('class').split('js-listing-')[1];
			$('.js-listing-' + id).addClass('listing-hover');
			google.maps.event.trigger(self, 'mouseover');
			$('.js-housing').scrollTo($('.js-listing-' + id), 100);
		});

		google.maps.event.addDomListener(div, 'mouseout', function(event){
			$('.listing-hover').removeClass('listing-hover');
			google.maps.event.trigger(self, 'mouseout');
		});

		//I have no idea what this is doing.
		//I think it's creating a new layer for the overlays and appending them there. But I really have no idea and maybe Michelle can clarify what this is doing.
		var panes = this.getPanes();
		panes.overlayImage.appendChild(div);
	}

	//Nope, no clue what this is doing either. I think it's placing the marker at the correct latitude-longitude.
	var point = this.getProjection().fromLatLngToDivPixel(this.latlng);


	//Oh! I know this one! this is offsetting the marker so that it sits centered and above the point.
	if (point) {
		div.style.left = (point.x - 30) + 'px';
		div.style.top = (point.y - 20) + 'px';
	}
};

//removal fucntion, not currently used.
CustomMarker.prototype.remove = function() {
	if (this.div) {
		this.div.parentNode.removeChild(this.div);
		this.div = null;
	}	
};

//function about getting a position. Not currently used.
CustomMarker.prototype.getPosition = function() {
	return this.latlng;	
};