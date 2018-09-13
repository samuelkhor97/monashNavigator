// Coded by: Khor Peak Siew
// Team: 212
// Last modified: 18/5/2018


// Initialise the map with given latLng coordinate
// @param {Object} {lat, lng} The latLng of the coordinates to initialise the map
// @param {Object} google.maps.Map(...) A new google map object
function initialiseMap({
    lat,
    lng
}) {
    return new google.maps.Map(document.getElementById('map'), {
        center: {
            lat,
            lng
        },
        zoom: 20
    });
}

// Initialise the marker on map with given datas
// @param {Object} map The map object for the marker to be displayed on
// @param {Object} coordinates The latLng coordinates for the marker
// @param {Object} label The label on the marker
// @param {Object} icon The configuration for the marker icon 
function initialiseMarker({
    map,
    coordinates,
    label,
    icon = null
}) {
    return new google.maps.Marker({
        map,
        coordinates,
        label,
        icon
    });
}

// Add circle overlay and bind to marker
// @param {Object} map The map for which the circle is displayed on
// @param {Number} radius The radius of circle shown on map
// @param {String} fillColor The color that fills up the accuracy circle
function initialiseAccuracyCircle({
    map,
    radius,
    fillColor
}) {
    return new google.maps.Circle({
        map,
        radius,
        fillColor
    });
}

// Get proper error message based on the code.
// @param {Number} code The error code for the geolocation access
// @param {String} Three different strings that tell users about the error message
function positionErrorMessage(code) {
    switch (code) {
        case 1:
            return "Permission denied.";
        case 2:
            return "Position unavailable, failed to retrieve location.";
        case 3:
            return "Timeout reached.";
        default:
            return null;
    };
}

// Return true if his/her location is close enough(< accuracy) to the waypoint
// @param {Object} latLngA, latLngB The latLng instances of user and waypoint
// @param {Number} accuracy The accuracy for geolocation in metres
// @param {boolean} true/false The boolean condition whetehr user has reached the waypoint
function reached(latLngA, latLngB, accuracy) {
    if (google.maps.geometry.spherical.computeDistanceBetween(latLngA, latLngB) < accuracy) {
        return true;
    } else {
        return false;
    }
}

// Compute distance in between two latLng coordinates
// @param {Number} latLngA, latLngB The latLng coordinates of two points on map
// @param {Number} distanceBetween The distance in between the two points in metres
function computeDistanceInBetween(latLngA, latLngB) {
    let latLngFirst = new google.maps.LatLng(latLngA.lat, latLngA.lng);
    let latLngLast = new google.maps.LatLng(latLngB.lat, latLngB.lng);

    let distanceBetween = google.maps.geometry.spherical.computeDistanceBetween(latLngFirst, latLngLast);

    return distanceBetween;
}

// Inform user to calibrate phone compass if needed
function compassNeedsCalibration() {
    displayMessage("Compass needs calibration.  Move your phone in a figure-eight pattern.", 5000);
}

// Convert seconds into 'hour(s) minute(s) second(s)' format
// @param {Number} d The time duration in seconds
// @param {String} hDisplay + mDisplay + sDisplay The converted time duration 
function secondsToHms(d) {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor(d % 3600 / 60);
    let s = Math.floor(d % 3600 % 60);

    let hDisplay = h > 0 ? h + (h == 1 ? " hour " : " hours ") : "";
    let mDisplay = m > 0 ? m + (m == 1 ? " minute " : " minutes ") : "";
    let sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
}


// Map Initialisation callback.  Will be called when Map API loads.
function initMap() {
    // initial position centered at Monash University Malaysia 
    const initialPosition = {
        lat: 3.06486,
        lng: 101.60098
    };
    // Initialise the map object
    const map = initialiseMap(initialPosition);

    // The setting for the user's current location marker icon
    const markerIcon = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor: "blue",
        fillOpacity: 100,
        strokeWeight: 1,
        scale: 8
    };

    // The setting for the 'Next Waypoint' marker label
    const waypointLabel = {
        color: '##D4AC0D',
        fontWeight: 'bold',
        fontSize: '24px',
        text: 'Next Waypoint'
    };

    // Initialise the marker for user's current location
    const marker = initialiseMarker({
        map,
        position: initialPosition,
        label: "",
        icon: markerIcon
    });

    // Initialise the accuracy circle of user's geolocation
    const accuracyCircle = initialiseAccuracyCircle({
        map,
        fillColor: "#87CEFA"
    });

    let whichPath = null;
    let movementHistory = [];

    // Retrieving the user's path selection from the local storage
    if (localStorage !== null) {
        whichPath = parseInt(JSON.parse(localStorage.getItem("whichPath")));
    }

    // Retrieving the path in path list from local storage
    let path = JSON.parse(localStorage.getItem(STORAGE_KEY))[whichPath];
    let pathLocations = path.locations;
    let waypointCounter = 0;

    // Initialise the marker for each 'Next Waypoint'
    let nextWaypoint = pathLocations[waypointCounter];
    let waypointMarker = initialiseMarker({
        map,
        position: nextWaypoint,
        label: waypointLabel
    });

    let previousTime = Date.now();
    let totalDistanceTravelled = 0;
    let timeWhenUserMove = null;

    // Get user's current location and compute all kinds of data based on the returned values
    if (navigator.geolocation) {
        let id = navigator.geolocation.watchPosition(
            // onSuccess: Set the marker and pan the map to user's current position,
            // together with computations of needed info
            position => {
                // Getting user's current latLng coordinate
                let positionLat = position.coords.latitude;
                let positionLng = position.coords.longitude;
                let userPosition = {
                    lat: positionLat,
                    lng: positionLng
                };

                // Getting the DOM elements
                let info = document.getElementById("info");
                let directionElement = document.getElementById("direction");

                // Getting the accuracy for current geolocation
                let accuracy = position.coords.accuracy;

                // Getting user's and next waypoint's latLng instances
                let userPositionInstance = new google.maps.LatLng(userPosition.lat, userPosition.lng);
                let nextWaypointInstance = new google.maps.LatLng(nextWaypoint.lat, nextWaypoint.lng);

                // Initializing user heading and destination heading
                let userHeading = null;
                let heading = google.maps.geometry.spherical.computeHeading(
                    userPositionInstance,
                    nextWaypointInstance
                );
                // Converting the -180<x<180 degree to 0<x<360 degree
                if (heading < 0) {
                    heading = 360 + heading;
                }

                // Initializing the path line in green colour
                let pathLine = new google.maps.Polyline({
                    path: pathLocations,
                    geodesic: true,
                    strokeColor: '#00FF00',
                    strokeOpacity: 1.0,
                    strokeWeight: 2
                });

                // Computing the user's heading from and rotate the user's marker icon
                // according to the heading 
                // @param {Event} e The event containing alpha,beta and gamma values, in which
                // alpha is used to determine the user's heading
                function compassHeading(e) {
                    // Apple's devices and Mozilla built-in property to determine device orientation
                    if (e.webkitCompassHeading !== undefined) {
                        userHeading = Number(e.webkitCompassHeading);
                        let icon = marker.getIcon();
                        icon.rotation = userHeading;
                        marker.setIcon(icon);
                        // Other browsers' method of heading computation
                    } else {
                        userHeading = 360 - e.alpha;
                        let icon = marker.getIcon();
                        icon.rotation = userHeading;
                        marker.setIcon(icon);
                    }

                    let direction = "straight";
                    let waypointHeading;
                    // Computing waypointHeading that guides user using difference between 
                    // destination heading and user heading
                    if (heading >= userHeading) {
                        waypointHeading = heading - userHeading;
                    } else {
                        waypointHeading = 360 - (userHeading - heading);
                    }

                    // Setting the the user's direction corresponding to ranges of waypointHeading 
                    if ((waypointHeading >= 0 && waypointHeading <= 10) ||
                        (waypointHeading > 350 && waypointHeading <= 360)) {
                        direction = "Straight";
                        document.getElementById("directionImage").src = "./images/straight.svg";

                    } else if (waypointHeading > 10 && waypointHeading <= 45) {
                        direction = "Slight Right";
                        document.getElementById("directionImage").src = "./images/slight_right.svg";

                    } else if (waypointHeading > 45 && waypointHeading <= 100) {
                        direction = "Right";
                        document.getElementById("directionImage").src = "./images/right.svg";

                    } else if (waypointHeading > 100 && waypointHeading <= 260) {
                        direction = "U-turn";
                        document.getElementById("directionImage").src = "./images/uturn.svg";

                    } else if (waypointHeading > 260 && waypointHeading <= 315) {
                        direction = "Left";
                        document.getElementById("directionImage").src = "./images/left.svg";

                    } else if (waypointHeading > 315 && waypointHeading <= 350) {
                        direction = "Slight Left";
                        document.getElementById("directionImage").src = "./images/slight_left.svg";

                    }
                    directionElement.innerHTML = "Direction: " + direction;
                }

                // Compute the total distance travelled by user 
                // @param {Array} coordinates An array containing the user's movement history
                // stored as latLng coordinates
                function computeTotalDistanceTravelled(coordinates) {
                    let len = coordinates.length;
                    let lastCoord = coordinates[len - 1];
                    let previousCoord = coordinates[len - 2];

                    let latLngFirst = new google.maps.LatLng(lastCoord.lat, lastCoord.lng);
                    let latLngLast = new google.maps.LatLng(previousCoord.lat, previousCoord.lng);

                    let distanceBetween = google.maps.geometry.spherical.computeDistanceBetween(latLngFirst, latLngLast);
                    totalDistanceTravelled += distanceBetween;
                }

                // Compute the instantaneous average speed of user
                // @param {Number} totalDistanceTravelled The total distance travelled in metres
                // @param {Number} time The time elapsed since user first moved
                // @param {Number} (totalDistanceTravelled/ time).toFixed(3) The average speed to three decimal
                function averageSpeed(totalDistanceTravelled, time) {
                    return (totalDistanceTravelled / time).toFixed(2);
                }

                // Drawing the path lines
                pathLine.setMap(map);

                // drawing the accuracy circle around user's marker
                accuracyCircle.setRadius(accuracy);
                accuracyCircle.bindTo('center', marker, 'position');

                // Will only start to navigate when the accuracy of geolocation is less than 20m deviation
                if (accuracy > 20) {
                    // Set user's marker position on map	
                    marker.setPosition(userPosition);
                    // Fill the accuracy circle with red color for indication
                    accuracyCircle.setOptions({
                        fillColor: '#ff9999',
                        strokeColor: '#cc0000'
                    });
                    waypointMarker.setPosition(nextWaypoint);

                    info.innerHTML = "GPS accuracy is inappropriate. Please wait for a few seconds before the GPS gains accuracy.";
                } else {
                    if (timeWhenUserMove === null) {
                        timeWhenUserMove = Date.now();
                    }
                    // Fill the accuracy circle with blue to indicate "navigating"
                    accuracyCircle.setOptions({
                        fillColor: '#87CEFA',
                        strokeColor: '#0066ff'
                    });
                    // Set user's marker position on map	
                    marker.setPosition(userPosition);
                    // Set next waypoint's marker on map
                    waypointMarker.setPosition(nextWaypoint);

                    // Store the LatLng of user's movement history
                    if (Date.now() - previousTime >= 1000) {
                        previousTime = Date.now();
                        movementHistory.push(userPosition);
                        // Update constantly the user's total travelled distance
                        if (movementHistory.length >= 2) {
                            computeTotalDistanceTravelled(movementHistory);
                        }
                    }

                    // Display the distance to next waypoint
                    let distanceToNextWaypoint = computeDistanceInBetween(userPosition, nextWaypoint);

                    // Display the total distance remaining to final destination
                    let remainingDistance = 0;
                    for (let i = waypointCounter; i < pathLocations.length - 1; i++) {
                        let latLngA = pathLocations[i];
                        let latLngB = pathLocations[i + 1];

                        remainingDistance += computeDistanceInBetween(latLngA, latLngB);
                    }

                    remainingDistance += computeDistanceInBetween(pathLocations[waypointCounter], userPosition);

                    info.innerHTML = "<table style=\"width:100%\"><tr style=\"color: white;\"><th>Average Speed:</th><th>Total Distance Travelled:</th></tr>" +
                        "<tr><td>0 m/s</td><td>0 m</td></tr>" +
                        "<tr style=\"color: white;\"><th>Distance to Next Waypoint:</th><th>Total Distance Remaining: </th></tr>" +
                        "<tr><td>" + distanceToNextWaypoint.toFixed(2) + " m" + "</td><td>" + remainingDistance.toFixed(2) + " m" + "</td></tr>" +
                        "<tr style=\"color: white;\"><th colspan=\"2\">Estimated Time of Arriving:</th></tr>" +
                        "<tr><td colspan=\"2\">Infinity</td></tr>" +
                        "</table>";

                    // Display the user's info: averageSpeed & distance to next Waypoint & total distance to final destination
                    if (movementHistory.length >= 2) {
                        // Determine the time elapsed since user first move in seconds
                        let timeElapsed = (Date.now() - timeWhenUserMove) / 1000;
                        // Displaying the remaining time to reach final destination
                        let timeRemaining = secondsToHms(remainingDistance / averageSpeed(totalDistanceTravelled, timeElapsed));
                        
                        info.innerHTML = "<table style=\"width:100%\"><tr style=\"color: white;\"><th>Average Speed:</th><th>Total Distance Travelled:</th></tr>" +
                            "<tr><td>" + averageSpeed(totalDistanceTravelled, timeElapsed) + " m/s</td><td>" + totalDistanceTravelled.toFixed(2) + " m</td></tr>" +
                            "<tr style=\"color: white;\"><th>Distance to Next Waypoint:</th><th>Total Distance Remaining: </th></tr>" +
                            "<tr><td>" + distanceToNextWaypoint.toFixed(2) + " m" + "</td><td>" + remainingDistance.toFixed(2) + " m" + "</td></tr>" +
                            "<tr style=\"color: white;\"><th colspan=\"2\">Estimated Time of Arriving:</th></tr>" +
                            "<tr><td colspan=\"2\">" + timeRemaining + "</td></tr>" +
                            "</table>";
                    }


                    // Notify user if the destination is reached
                    // Update the next waypoint when user has reached current waypoint
                    if (reached(userPositionInstance, nextWaypointInstance, accuracy)) {
                        if (waypointCounter === pathLocations.length - 1) {
                            displayMessage("You've reached your destination!", 5000);
                            info.innerHTML = "Destination reached. Go back to Main Page for other navigations.";
                            // Remove the 'Next Waypoint' marker from map
                            waypointMarker.setMap(null);
                            // Stop the execution of watchPosition
                            navigator.geolocation.clearWatch(id);
                        } else {
                            waypointCounter += 1;
                            nextWaypoint = pathLocations[waypointCounter];
                            // Set waypoint's marker position
                            waypointMarker.setPosition(nextWaypoint);
                        }
                    }

                    // Set user's marker heading constantly, expressed in degrees
                    if ('ondeviceorientationabsolute' in window) {

                        window.addEventListener('deviceorientationabsolute', compassHeading);
                        window.addEventListener('compassneedscalibration', compassNeedsCalibration);
                    } else if ('ondeviceorientation' in window) {

                        window.addEventListener('deviceorientation', compassHeading);
                        window.addEventListener('compassneedscalibration', compassNeedsCalibration);
                    } else {
                        // Notify user if device orientation is not supported
                        displayMessage("Heading not supported.", 3000);
                    }
                }

                // Center map to user's position.
                map.panTo(userPosition);

                // Center map to user's position when clicked, in case the map is pan to
                // somewhere else in the first place
                google.maps.event.addDomListener(document.getElementById('currentLocation'), 'click', function() {
                    map.panTo(userPosition);
                });
            },
            // onError: Notify user about the error code and message
            err => {
                // Display the error message
                displayMessage(`Error (${err.code}): ${positionErrorMessage(err.code)}`, 3000);
            },
            // PositionOptions
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );

        // Always make the map centered even when screen changes size
        google.maps.event.addDomListener(window, "resize", function() {
            let center = map.getCenter();
            google.maps.event.trigger(map, "resize");
            map.setCenter(center);
        });

    } else {
        displayMessage('Geolocation is not supported by your browser.', 4000);
    }
}