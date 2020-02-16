/*jslint browser: true*/
/*global mapboxgl*/

//-----------------------------------------------------------------------

mapboxgl.accessToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiJjajBoN3hzZGwwMDJsMnF0YW96Y2l3OGk2In0._5BdojVYvNuR6x4fQNYZrA';

//-----------------------------------------------------------------------

var mapCenter = [13.38523, 52.45171]; // hackathon location

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/dark-v10', //streets-v11 outdoors-v11 light-v10 dark-v10 satellite-v9 satellite-streets-v11
	center: mapCenter,
	minZoom: 10,
	maxZoom: 19,
	zoom: 17,
	pitch: 60,
	hash: true,
//	maxBounds: [[6.4, 51.22], [6.8, 51.46]]
});
var canvas = map.getCanvasContainer();

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
		removeLabels();

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
	map.addControl(new MapboxGLButtonControl({
		title: 'Einen Punkt einfügen',
		html: '<i class="far fa-dot-circle fa-lg"></i>',
		eventHandler: setObjectPoint
	}), 'top-right');
	map.addControl(new MapboxGLButtonControl({
		title: 'Eine Linie einfügen',
		html: '<i class="fas fa-vector-square fa-lg"></i>',
		eventHandler: setObjectLine
	}), 'top-right');
	map.addControl(new MapboxGLButtonControl({
		title: 'Ein Auto einfügen',
		html: '<i class="fas fa-car-side fa-lg"></i>',
		eventHandler: setObjectCar
	}), 'top-right');
}

//-----------------------------------------------------------------------

function removeLabels() {
	var layers = map.getStyle().layers;

	for (var i = 0; i < layers.length; i++) {
		if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
			// remove text labels
			map.removeLayer(layers[i].id);
		}
	}
}

//-----------------------------------------------------------------------

function add3dBuilding() {
	map.addLayer({
		'id': '3d-buildings',
		'source': 'composite',
		'source-layer': 'building',
		'filter': ['==', 'extrude', 'true'],
		'type': 'fill-extrusion',
		'minzoom': 15,
		'paint': {
			'fill-extrusion-color': '#ff0',

			// use an 'interpolate' expression to add a smooth transition effect to the
			// buildings as the user zooms in
			'fill-extrusion-height': [
				'interpolate',
				['linear'],
				['zoom'],
				15,
				0,
				15.05,
				['get', 'height']
			],
			'fill-extrusion-base': [
				'interpolate',
				['linear'],
				['zoom'],
				15,
				0,
				15.05,
				['get', 'min_height']
			],
			'fill-extrusion-opacity': 0.6
		}
	});
}

//-----------------------------------------------------------------------

var geojsonPoint = {
	'type': 'FeatureCollection',
	'features': [
		{
			'type': 'Feature',
			'geometry': {
				'type': 'Point',
				'coordinates': mapCenter
			}
		}
	]
};
var geojson = {
	'type': 'FeatureCollection',
	'features': []
};
var linestring = {
	'type': 'Feature',
	'geometry': {
		'type': 'LineString',
		'coordinates': []
	}
};
var carPolygon = {
	'type': 'FeatureCollection',
	'features': [
		{
			'type': 'Feature',
			'geometry': {
				'type': 'Polygon',
				'coordinates': [[]]
			},
			'properties': {
				'name': 'area1'
			}
		}
	]
};

function setObjectPoint() {
	map.addSource('point', {
		'type': 'geojson',
		'data': geojsonPoint
	});

	map.addLayer({
		'id': 'point',
		'type': 'circle',
		'source': 'point',
		'paint': {
			'circle-radius': 10,
			'circle-color': '#3887be'
		}
	});

	function onMove(e) {
		var coords = e.lngLat;

		canvas.style.cursor = 'grabbing';

		geojsonPoint.features[0].geometry.coordinates = [coords.lng, coords.lat];
		map.getSource('point').setData(geojsonPoint);
	}

	function onUp(e) {
		var coords = e.lngLat;

		console.log('Longitude: ' + coords.lng + '<br />Latitude: ' + coords.lat);
		canvas.style.cursor = '';

		map.off('mousemove', onMove);
		map.off('touchmove', onMove);
	}

	map.on('mouseenter', 'point', function() {
		map.setPaintProperty('point', 'circle-color', '#3bb2d0');
		canvas.style.cursor = 'move';
	});

	map.on('mouseleave', 'point', function() {
		map.setPaintProperty('point', 'circle-color', '#3887be');
		canvas.style.cursor = '';
	});

	map.on('mousedown', 'point', function(e) {
		e.preventDefault();

		canvas.style.cursor = 'grab';

		map.on('mousemove', onMove);
		map.once('mouseup', onUp);
	});

	map.on('touchstart', 'point', function(e) {
		if (e.points.length !== 1) return;

		e.preventDefault();

		map.on('touchmove', onMove);
		map.once('touchend', onUp);
	});
}

//-----------------------------------------------------------------------

function setObjectCar() {
	map.addSource('car', {
		'type': 'geojson',
		'data': carPolygon
	});

	map.addLayer({
		'id': 'car',
		'type': 'fill',
		'source': 'car',
		layout: {
//			'line-cap': 'round',
//			'line-join': 'round'
		},
		paint: {
			'fill-color': '#3887be',
//			'line-color': '#3887be',
//			'line-width': 2.5
		}
	});

	function onMove(e) {
		var coords = e.lngLat;

		canvas.style.cursor = 'grabbing';

		carPolygon.features[0].geometry.coordinates = [[
			[coords.lng, coords.lat],
			[coords.lng + .0, coords.lat + .0001],
			[coords.lng + .0001, coords.lat + .0001],
			[coords.lng + .0001, coords.lat + .0],
			[coords.lng, coords.lat]
			]];
		map.getSource('car').setData(carPolygon);
	}

	function onClick(e) {
		map.off('mousemove', onMove);
		map.off('click', onClick);
	}

	map.on('mousemove', onMove);
	map.on('click', onClick);
}

//-----------------------------------------------------------------------

function setObjectLine() {
	map.addSource('geojson', {
		'type': 'geojson',
		'data': geojson
	});

	map.addLayer({
		id: 'measure-points',
		type: 'circle',
		source: 'geojson',
		paint: {
			'circle-radius': 5,
			'circle-color': '#fff'
		},
		filter: ['in', '$type', 'Point']
	});
	map.addLayer({
		id: 'measure-lines',
		type: 'line',
		source: 'geojson',
		layout: {
			'line-cap': 'round',
			'line-join': 'round'
		},
		paint: {
			'line-color': '#fff',
			'line-width': 2.5
		},
		filter: ['in', '$type', 'LineString']
	});

	function onMove(e) {
		var features = map.queryRenderedFeatures(e.point, {
			layers: ['measure-points']
		});
		// UI indicator for clicking/hovering a point on the map
		canvas.style.cursor = features.length
			? 'pointer'
		: 'crosshair';
	};

	function onClick(e) {
		var features = map.queryRenderedFeatures(e.point, {
			layers: ['measure-points']
		});

		// Remove the linestring from the group
		// So we can redraw it based on the points collection
		if (geojson.features.length > 1) geojson.features.pop();

		// If a feature was clicked, remove it from the map
		if (features.length) {
			var id = features[0].properties.id;
			geojson.features = geojson.features.filter(function(point) {
				return point.properties.id !== id;
			});
		} else {
			var point = {
				'type': 'Feature',
				'geometry': {
					'type': 'Point',
					'coordinates': [e.lngLat.lng, e.lngLat.lat]
				},
				'properties': {
					'id': String(new Date().getTime())
				}
			};

			geojson.features.push(point);
		}

		if (geojson.features.length > 1) {
			linestring.geometry.coordinates = geojson.features.map(function(
				point
			) {
				return point.geometry.coordinates;
			});

			geojson.features.push(linestring);
		}

		map.getSource('geojson').setData(geojson);

		if (geojson.features.length > 4) {
			map.off('mousemove', onMove);
			map.off('click', onClick);

			canvas.style.cursor = '';
		}
	}

	map.on('mousemove', onMove);
	map.on('click', onClick);
}

//-----------------------------------------------------------------------

map.on('load', function () {
	'use strict';

	addMapControls();
	add3dBuilding();

});

//-----------------------------------------------------------------------
