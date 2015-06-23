var processedData;

/**
 * Gets the data from the U-Swap housing API.
 * URL: 'http://umn.u-swap.org/api/v1/housing'
 * IMPORTANT: We use a 'POST' method because of the way the API is set up.
 *
 * @param callback: The function that we call after: processData()
 * @param initialize: The function that configures the map: initializeCallback() (called -after- callback)
 * @param options: Things that we filter in by
 */
function getData(callback, initialize, options) {
    //var opts = options || {};
    var opts = {
        max_price : '400' //these values can be pulled from the page URL here are placeholder arguments.  If an argument is not to be used, omit it from the array
    };
    $.ajax({
        type: 'POST',
        dataType: 'json',
        data: opts,
        url:  'http://umn.u-swap.org/api/v1/housing',
        success: function(data, textstatus) {
            console.log(data);
            // Process the data
            callback(data);

            // Displays results in a list next to the map
            displayListings(processedData.features);

            // Create the map
            $(document).on('pageload', initialize());
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
        },
        complete: function (jqXHR, textStatus) {
            console.log("Ajax call complete: " + textStatus)
        }
    })
}

/**
 * Converts the JSON object received from the API to a GeoJSON object that can be displayed on the map, which is then
 * stored in var processedData. The result listing display also uses this GeoJSON object.
 *
 * "Features" are a collection of all the result properties that will be displayed on the map.
 *
 *
 * @param data: Data returned by the U-Swap housing API.
 */
function processData(data) {
    var geoJsonObject = {
        "type": "FeatureCollection",
        "features": []
    };

    var i;
    for (i=0; i < data.length; i++) {
        var result = data[i];

        // Only process the data if the result listing is currently active
        if (result["active"] == "1") {

            /**
             * Sort promotional leases into groups based on the building they are in (buildid)
             * TODO: Update this functionality so that all promotional listings are grouped beneath a building name instead of inside the first listing that comes up
             */

            // Get the index of a listing if there are other promotional listings already present with the same buildid
            var listingIndex = getOtherListings(result.buildid, geoJsonObject["features"]);

            /**
             * Process object into GeoJSON
             * Subleases get their own entry in "features."
             * Promos are sorted into building groups by buildid.
             *
             * GeoJSON is a format used by Google Maps and probably other mapping APIs. It has a strict format but we can put
             * whatever we want into "properties", which is where we put things like the listing name, price, and associated URL.
             *
             * Note: This is ONE GeoJSON object, not many, and we push each listing into its "features" property.
             */

            if (listingIndex != null && !isSublease(result["aid"])) {
                geoJsonObject["features"][listingIndex].properties["floor_plans"].push({
                    "weight": i + 1,
                    "name": result["list"].split(" at ")[0],
                    "buildid": result["buildid"],
                    "price": result["price"],
                    "gender": result["gender"],
                    "baths": result["baths"],
                    "beds": result["beds"],
                    "sublease": false,
                    "url": result["url"]
                });
            } else if (listingIndex == null && !isSublease(result["aid"])) {
                geoJsonObject["features"].push(
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [parseFloat(result["lng"]), parseFloat(result["lat"])]
                        },
                        "properties": {
                            "weight": i + 1,
                            // Gets the building name, assuming "Cordelia at Brentwood" etc
                            "name": result["list"].split(" at ")[1],
                            "buildid": result["buildid"],
                            "image": getThumbnail(result["images"]),
                            "sublease": false,
                            "url": result["url"],
                            "floor_plans": [{
                                "name": result["list"].split(" at ")[0],
                                "number": i,
                                "buildid": result["buildid"],
                                "price": result["price"],
                                "gender": result["gender"],
                                "baths": result["baths"],
                                "beds": result["beds"],
                                "sublease": false,
                                "url": result["url"]
                            }]
                        }
                    }
                );
            } else {
                geoJsonObject["features"].push(
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [parseFloat(result["lng"]), parseFloat(result["lat"])]
                        },
                        "properties": {
                            "weight": i + 1,
                            "name": "Sublease",
                            "price": result["price"],
                            "gender": result["gender"],
                            "baths": result["baths"],
                            "beds": result["beds"],
                            "image": getThumbnail(result["images"]),
                            "sublease": true,
                            "url": result["url"]
                        }
                    }
                );
            }
        }
    }

    // Before saving data: Loop through once more for promotional buildings and get the lowest price of each
    // We'll use this to display the lowest listing price on the DOM

    for (i=0; i<geoJsonObject.features.length; i++) {
        var listing = geoJsonObject.features[i].properties;
        var j, price, lowestPrice;
        if (listing.floor_plans) {
            for (j=0; j<listing.floor_plans.length; j++) {
                price = listing.floor_plans[j].price;
                if (!lowestPrice || price < lowestPrice) {
                    lowestPrice = price;
                }
            }
            listing.price = lowestPrice;
        }
    }

    // Save the geoJSON object globally
    processedData = geoJsonObject;

}

/**
 * Initializes the map object to be displayed on the DOM; it is called after the map data has been processed.
 * It sets the settings for the map
 */

function initializeCallback() {
    console.log("Initialize was called");
    var mapOptions = {
        center: { lat: 44.9747, lng: -93.2354},
        zoom: 12
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    var markers = [];
    console.log("processed data inside initialize: " + processedData);
    var features = map.data.addGeoJson(processedData);
    var myLatlng;
    //for (var l = 0; l < features.length; l++) {
    for (var l = 0; l < 200; l++) {
        //console.log(features[i]);
        myLatlng = features[l].getGeometry().get();
        //console.log(features[l].A.price);
        for (var k = l-1; k > 0; k--) {
            var thisLatlng = features[k].getGeometry().get();
            //console.log("compare ",  thisLatlng, " and ", myLatlng, ": ", (thisLatlng.equals(myLatlng)));
            if (thisLatlng.equals(myLatlng)) {
                console.log("Offset activated");
                //update the position of the coincident marker by applying a small multipler to its coordinates
                var newLat = myLatlng.lat() + (Math.random() - .5) / 1500;// * (Math.random() * (max - min) + min);
                var newLng = myLatlng.lng() + (Math.random() - .5) / 1500;// * (Math.random() * (max - min) + min);
                myLatlng = new google.maps.LatLng(newLat, newLng);
            }
        }
        overlay = new CustomMarker(
            myLatlng,
            map,
            {
                marker_id: features[l].A.weight.toString(),
                text: "$" + features[l].A.price.toString(),
                number: features[l].A.weight.toString(),
                point: 'markerPoint'
            }
        );
        markers.push(overlay);
        //console.log("overlay set: ", overlay);
    }

    var markerCluster = new MarkerClusterer(map, markers, {maxZoom: 16});

    /**
     * Set style decides whether the pin on the map should be green or red for each feature based on if it's a sublease
     * Loop through features in map.data -- the "features" property of GeoJSON, aka each listing in our housing results
     */
    //Transparent icon for potential use later: http://maps.gstatic.com/mapfiles/markers2/dd-via-transparent.png
    map.data.setStyle(function(feature) {
        var placeName = feature.getProperty('name');
        if (feature.getProperty('sublease')) {
            return {
                icon: "http://maps.gstatic.com/mapfiles/markers2/dd-via-transparent.png",
                visible: true,
                clickable: true,
                title: placeName
            };
        } else {
            return {
                icon: "http://maps.gstatic.com/mapfiles/markers2/dd-via-transparent.png",
                visible: true,
                clickable: true,
                title: placeName
            }
        }
    });

    // Sets each map pin so that, on clicking the pin, it opens a new tab that leads to the result listing URL
    map.data.addListener('click', function(event) {
        var windowObjectReference;
        var address = event.feature.getProperty('url');
        windowObjectReference = window.open(address, "__blank");
    });
}
//returns either the location of the property's first thumbnail url OR an "image not available" image, if there is none.
function getThumbnail(images) {
    if (images) {
        return images[0].thumb;
    }else{
        return "noimageavailable.png";
    }
}

// Returns true or false based on the presence of "aid" property -- "aid" is a number that will be null on subleases and not null on promotional properties
function isSublease(aid) {
    if (aid == null || aid == 0) {
        return true;
    }else {
        return false;
    }
}

// Returns "Sublease" for the name if the property is a sublease; otherwise returns the name itself -- we do this because sublease names can get really long
function getName(aid, list) {
    if (aid == null || aid == 0) {
        return "Sublease";
    } else {
        return list;
    }
}

/**
 * For promo listings only: Checks if the ID entered matches anything in the array, and returns the index of the match
 * if found. This is then used to nest this object inside the parent listing.
 * TODO: Update this so that instead of nesting in another listing they're grouped together underneath a building name?
 *
 * @param id: The building ID to search for -- we pass in the next listing to be processed
 * @param array: The array to search through -- we pass in all the listings that have already been processed
 * @returns {number}: The index in the array of a promo listing with a matching building ID, if applicable
 */
function getOtherListings(id, array) {
    var i;
    for (i=0; i<array.length; i++) {
        if (array[i].properties["buildid"] == id && !array[i].properties["sublease"]) {
            return i;
        }
    }
}

/**
 * jQuery wizardry; calls 2 other functions to make the scrolling list of housing results on the left of the map
 * @param data: Takes in processedData.features -- the list of housing results converted into GeoJSON format.
 */
function displayListings(data) {
    // Target the housing container already present in index.html
    var $housing = $('.js-housing');
    //$housing.empty();
    var $container, i;
    // Loop through each listing
    for (i=0; i<data.length; i++) {
        var listing = data[i].properties;
        // Creates a basic listing
        if (listing.sublease) {
            $container = displaySublease(listing, i);
        } else {
            $container = displayPromo(listing, i);
        }
        // Add the listing to the DOM
        $housing.append($container);
    }
}

/**
 * Formats a basic listing for display on the DOM
 *
 * TODO: Separate functionality for displaying list items with multiple floor plans, which should be referred to by building name instead of the first listing available
 *
 * @param listing: A real estate listing.
 * @param index: Used to handle accordion displays. Each accordion needs to know the ID that it is targeting, so we
 * refer to it as "#js-listing-index": e.g. "#js-listing-0" for the first listing we process
 * @returns {*|jQuery|HTMLElement}: Real estate listing formatted for display on the DOM (but not yet appended)
 */

function displaySublease(listing, index) {
    var $container = $('<div class="accordion-group js-listing-' + listing.weight + '">');
    var $wrapper = $('<div class="accordion-heading clearfix">');

    var $div = $('<div class="clearfix listing-info">');
    var $header = $('<div class="clearfix">');
    var $footer = $('<div class="clearfix">');

    var $title = $('<h3 class="listing-sublease-title">' + listing.name + '</h3>');
    var $price = $('<h3 class="listing-price">$' + listing.price + '+</h4>');
    var $details = $('<div class="listing-sublease-details"><p>' + formatPlural(listing.beds, 'bed', 'beds') + ' | ' + formatPlural(listing.baths, 'bath', 'baths') + ' | ' + formatGender(listing.gender) + '</p></div>');
    var $button = $('<a href="' + listing.url + '" target="_blank"><button class="btn btn-default btn-sublease">View Details</button></a>');

    $header.append($title);
    $header.append($price);
    $footer.append($details);
    $footer.append($button);

    $div.append($header);
    $div.append($footer);

    var $image = $('<div class="listing-image"><img class="listing-image" src="' + listing.image + '"></div>');
    var $link = $('<div class="listing-wrapper">');
    $link.append($image);
    $link.append($div);

    $wrapper.append($link);

    $container.append($wrapper);

    return $container;
}

function displayPromo(listing, index) {
    var $container = $('<div class="accordion-group affiliate js-listing-' + listing.weight + '">');
    var $wrapper = $('<div class="accordion-heading clearfix">');

    var $header = $('<div class="clearfix listing-info">');
    var $div = $('<div class="clearfix">');

    var $title = $('<h3 class="listing-promo-title">' + listing.name + '</h3>');
    var $price = $('<h3 class="listing-price">$' + listing.price + '+</h4>');
    var $floors = $('<div class="listing-promo-details"><button class="btn btn-success">' + listing.floor_plans.length + ' floor plans available</button></div>');

    $div.append($title);
    $div.append($price);
    $header.append($div);
    $header.append($floors);

    var $image = $('<div class="listing-image"><img class="listing-image" src="' + listing.image + '"></div>');
    var $link = $('<a class="accordion-toggle" data-parent="#js-listings" data-toggle="collapse" href="#js-listing-' + index + '">');
    $link.append($image);
    $link.append($header);

    $wrapper.append($link);

    $container.append('<div class="listing-promo-tag"><p>$$ Eligible for $100 cashback reward! $$</p></div>');
    $container.append($wrapper);
    $container.append(displayAccordionItems(listing.floor_plans, index));

    return $container;
}

/**
 * Formats a group of nested listings (i.e. a promo within a building) for display on the DOM
 *
 * @param listings: An ARRAY of real estate listings contained within an "additional" property -- part of the same building
 * @param index: Used to handle accordion displays. Each accordion needs to know the ID that it is targeting, so we
 * refer to it as "#js-listing-index": e.g. "#js-listing-0" for the first listing we process
 * @returns {*|jQuery|HTMLElement}: Real estate listings formatted for display (but not yet appended)
 */
function displayAccordionItems(listings, index) {
    var $container = $('<div class="accordion-body collapse" id="js-listing-' + index + '">');
    var i, $listing;

    for (i=0; i<listings.length; i++) {
        $listing = $('<div class="accordion-inner clearfix">');
        $listing.append('<div class="pull-left"><h4>' + listings[i].name + '</h4><p>' + formatPlural(listings[i].beds, 'bed', 'beds') + ' | ' + formatPlural(listings[i].baths, 'bath', 'baths') + ' | ' + formatGender(listings[i].gender) + '</p></div>');
        $listing.append('<div class="pull-right"><h4>$' + listings[i].price + '+</h4><a href="' + listings[i].url + '" target="_blank"' + '<button class="btn btn-success">View details</button></a></div>');
        $container.append($listing);
    }
    return $container;
}

// Utility display functions used by the result display
function formatPlural(number, singular, plural) {
    if (number == 1) {
        return '1 ' + singular;
    } else {
        return number + ' ' + plural;
    }
}

function formatGender(gender) {
    switch(gender) {
        case 'Male':
        case 'male':
            return 'Males only';
        case 'Female':
        case 'female':
            return 'Females only';
        default:
            return 'Any gender';
    }
}


getData(processData, initializeCallback);

$('document').ready(function(){
    console.log('Document is ready!');
    $('.js-housing').on('mouseenter', '.accordion-group', function() {
            var weight = $(this).attr('class').split('js-listing-')[1];
            //console.log('Hover on ', weight);
            $('.js-listing-' + weight).addClass('listing-hover');
        });
    $('.js-housing').on('mouseleave', '.accordion-group', function(){
            $('.listing-hover').removeClass('listing-hover');
    });
    //$('.js-filter').submit(function(event) {
    //    event.preventDefault();
    //});
    $('.js-filter-btn').on('click', function(){
        var options = {};
        options.min_bedrooms = $('.js-filter-beds').val() || '';
        options.min_bathrooms = $('.js-filter-baths').val() || '';
        options.gender = $('.js-filter-gender').val() || '';
        options.max_price = $('.js-filter-price').val() || '';
        console.log(options);

        getData(processData, initializeCallback, options);
    });
});

