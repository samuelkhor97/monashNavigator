"use strict";
// Name: Khor Peak Siew, Randy Chin, Gowin
// Team: 212
// Last modified: 12/5/2018


class Path {
    constructor() {
        // private attributes:
        this._places = "";
        this._coordinates = [];
    }

    // Initialise the path Object with given pathPDO
    // @param {object} pathObject The path object containg title and locations
    initialiseFromPathPDO(pathObject) {
        // Initialise the instance via the mutator methods from the PDO object.
        this.places = pathObject.title;
        this.coordinates = pathObject.locations;
    }

    // Compute total distance between the initial and ending points of the path instance
    // @param {Number} totalDistance The total distance between the initial and ending points
    totalDistance() {
        // Convert degrees to radians
        Math.radians = function(degrees) {
            return degrees * Math.PI / 180;
        };

        let totalDistance = 0;

        for (let i = 0; i < this.coordinates.length - 1; i++) {
            // Applying Haversine formula
            // Source is taken from http://www.movable-type.co.uk/scripts/latlong.html
            const R = 6371e3; // earth's radius in metres
            // Converting latitude of the initial point to radians
            let lat1 = Math.radians(this.coordinates[i].lat);
            // Converting latitude of the final point to radians   
            let lat2 = Math.radians(this.coordinates[i + 1].lat);
            // Difference in latitude between the two points
            let latDifference = lat2 - lat1;
            // Converting difference in longitude between the two points to radians
            let lngDifference = Math.radians(this.coordinates[i + 1].lng - this.coordinates[i].lng);

            let a = Math.sin(latDifference / 2) * Math.sin(latDifference / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(lngDifference / 2) * Math.sin(lngDifference / 2);

            let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            let d = R * c;
            totalDistance += d;
        }

        return totalDistance.toFixed(3);
    }

    // Return number of turning point along the path
    numberOfTurns() {
        return this.coordinates.length - 2;
    }

    // Getters
    get places() {
        return this._places;
    }

    get coordinates() {
        return this._coordinates;
    }

    // Setters
    set places(places) {
        this._places = places;
    }

    set coordinates(coordinates) {
        this._coordinates = coordinates;
    }

}

class PathList {
    constructor() {
        // private attribute:
        this._pathLists = [];
    }

    initialiseFromPathListPDO(routesObject) {
        // Code to intialise the pathList array
        this._pathLists = [];
        for (let i = 0; i < routesObject.length; i++) {
            let path = new Path();
            // Initialise the path using the passed in routesObject
            path.initialiseFromPathPDO(routesObject[i]);
            // Push the path into the path list
            this._pathLists.push(path);
        }
    }

    // Getter
    get pathLists() {
        return this._pathLists;
    }
}

// A constant storage key to store the path list in localStorage
const STORAGE_KEY = "walkingRoutes";