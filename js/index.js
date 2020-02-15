/*jslint browser: true*/
/*global mapboxgl*/

//-----------------------------------------------------------------------

mapboxgl.accessToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiJjajBoN3hzZGwwMDJsMnF0YW96Y2l3OGk2In0._5BdojVYvNuR6x4fQNYZrA';

//-----------------------------------------------------------------------

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/outdoors-v11', //streets-v11 outdoors-v11 satellite-v11 satellite-streets-v11
	center: [13.38523, 52.45171], // hackathon location
	minZoom: 10,
	maxZoom: 19,
	zoom: 17,
	pitch: 60,
	hash: true,
//	maxBounds: [[6.4, 51.22], [6.8, 51.46]]
});

//-----------------------------------------------------------------------

var rotateCameraOnIdle = false;

function rotateCamera(timestamp) {
	// clamp the rotation between 0 -360 degrees
	// Divide timestamp by 100 to slow rotation to ~10 degrees / sec
	map.rotateTo((timestamp / 100) % 360, { duration: 0 });

	if (rotateCameraOnIdle) {
		requestAnimationFrame(rotateCamera);
	}
}

function startRotateCamera(event) {
	if (rotateCameraOnIdle) {
		rotateCameraOnIdle = false;
	} else {
		rotateCameraOnIdle = true;
		rotateCamera(0);
	}
}

//-----------------------------------------------------------------------
/* Idea from Stack Overflow https://stackoverflow.com/a/51683226  */
class MapboxGLButtonControl {
	constructor({
		className = '',
		title = '',
		html = '',
		eventHandler = evtHndlr
	}) {
		this._className = className;
		this._title = title;
		this._html = html;
		this._eventHandler = eventHandler;
	}

	onAdd(map) {
		this._btn = document.createElement("button");
		this._btn.className = "mapboxgl-ctrl-icon" + " " + this._className;
		this._btn.type = "button";
		this._btn.title = this._title;
		this._btn.innerHTML = this._html;
		this._btn.onclick = this._eventHandler;

		this._container = document.createElement("div");
		this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
		this._container.appendChild(this._btn);

		return this._container;
	}

	onRemove() {
		this._container.parentNode.removeChild(this._container);
		this._map = undefined;
	}
}

//-----------------------------------------------------------------------

function addMapControls() {
	map.addControl(new mapboxgl.NavigationControl(), 'top-left');
	map.addControl(new mapboxgl.GeolocateControl({
		positionOptions: {
			enableHighAccuracy: true
		}
	}), 'top-left');

	map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
	map.addControl(new MapboxGLButtonControl({
		title: 'Automatisch drehen',
		html: '<i class="fas fa-sync-alt fa-lg"></i>',
		eventHandler: startRotateCamera
	}), 'top-right');
}

//-----------------------------------------------------------------------

map.on('load', function () {
	'use strict';

	addMapControls();
});

//-----------------------------------------------------------------------
