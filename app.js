var processedData;

/**
 * Gets the data from the U-Swap housing API.
 * URL: 'http://umn.u-swap.org/api/v1/housing'
 * IMPORTANT: We use a 'POST' method because of the way the API is set up.
 *
 * @param callback: The function that we call after: processData()
 * @param initialize: The function that configures the map: initializeCallback() (called -after- callback)
 */
function getData(callback, initialize) {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'dummyData.json',
        success: function(data, textstatus) {
            console.log(data);
            // Process the data
            callback(data);
            // Create the map
            google.maps.event.addDomListener(window, 'load', initialize);
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
    geoJsonObject = {
        "type": "FeatureCollection",
        "features": []
    };

    var i;

    for (i=0; i < data.results.length; i++) {
        var result = data.results[i];

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
                    "name": result["list"].split(" at ")[0],
                    "number": i,
                    "buildid": result["buildid"],
                    "price": result["price"],
                    "description": result["body"],
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
                            // Gets the building name, assuming "Cordelia at Brentwood" etc
                            "name": result["list"].split(" at ")[1],
                            "number": i,
                            "buildid": result["buildid"],
                            "image": result["images"][0].thumb,
                            "sublease": false,
                            "url": result["url"],
                            "floor_plans": [{
                                "name": result["list"].split(" at ")[0],
                                "number": i,
                                "buildid": result["buildid"],
                                "price": result["price"],
                                "description": result["body"],
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
                            "name": "Sublease",
                            "number": i,
                            "price": result["price"],
                            "description": result["body"],
                            "baths": result["baths"],
                            "beds": result["beds"],
                            "image": result["images"][0].thumb,
                            "sublease": true,
                            "url": result["url"],
                            "floor_plans": []
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

    // Displays results in a list next to the map
    displayListings(processedData.features);
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
    console.log("processed data inside initialize: " + processedData);
    map.data.addGeoJson(processedData);

    /**
     * Set style decides whether the pin on the map should be green or red for each feature based on if it's a sublease
     * Loop through features in map.data -- the "features" property of GeoJSON, aka each listing in our housing results
     */

    map.data.setStyle(function(feature) {
        var placeName = feature.getProperty('name');
        if (feature.getProperty('sublease')) {
            return {
                icon: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png",
                visible: true,
                clickable: true,
                title: placeName
            };
        } else {
            return {
                icon: "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png",
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

// Returns true or false based on the presence of "aid" property -- "aid" is a number that will be null on subleases and not null on promotional properties
function isSublease(aid) {
    if (aid == null) {
        return true;
    }else {
        return false;
    }
}

// Returns "Sublease" for the name if the property is a sublease; otherwise returns the name itself -- we do this because sublease names can get really long
function getName(aid, list) {
    if (aid == null) {
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
    var $container = $('<div class="accordion-group">');
    var $image = $('<img class="listing-image" src="' + listing.image + '">');
    var $title = $('<h3 class="listing-sublease-title">Sublease</h3>');
    var $linkWrapper = $('<a class="accordion-toggle" data-parent="#js-listings" data-toggle="collapse" href="#js-listing-' + index + '">');
    var $wrapper = $('<header class="accordion-heading clearfix">');
    $linkWrapper.append($image);
    $linkWrapper.append($title);
    $wrapper.append($linkWrapper);
    var $details = $('<div>');
    $details.append('<h4 class="listing-price">$' + listing.price + '+</h4>');
    $details.append('<p class="bed-bath-sub field">' + listing.beds + " bedrooms | " + listing.baths + ' baths</div>');
    $wrapper.append($details);
    $container.append($wrapper);
    return $container;
}

function displayPromo(listing, index) {
    var $container = $('<div class="accordion-group affiliate">');
    var $wrapper = $('<div class="accordion-heading clearfix">');

    var $header = $('<div class="clearfix listing-info">');
    var $div = $('<div class="clearfix">');

    var $title = $('<h3 class="listing-promo-title">' + listing.name + '</h3>');
    var $price = $('<h3 class="listing-price">$' + listing.price + '+</h4>');
    var $floors = $('<div class="listing-promo-floors"><p>Click to view ' + listing.floor_plans.length + ' floor plans</p></div>');

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
        $listing.append('<div class="pull-left"><h4>' + listings[i].name + '</h4><p>' + listings[i].beds + ' beds | ' + listings[i].baths + ' baths</p></div>');
        $listing.append('<div class="pull-right"><h4>$' + listings[i].price + '+</h4>' + '<button class="btn btn-info">View details</button></div>');
        $container.append($listing);
    }
    return $container;
}


getData(processData, initializeCallback);