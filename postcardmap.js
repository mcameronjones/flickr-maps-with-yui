	/** Magic incantations copied from some YUI example **/
	YUI().use("node",

	function(Y) {

		/** Your Flickr API key **/
		var flickr_api_key = "b971e36bcf24816a498bc172855d5abc";

		/** Global array to hold all your photo metadata **/
		var photos = new Array();

		/** Global variable for the Google Map **/
		var map;

		/**
			Initializes the application and gets things started. Load should be called on page ready.
			It creates the Google Map in the div with id=map. The map is centered near 0,0 (20,-2)
			and zoomed out pretty far so it looks like world atlas map. Obviously, if your photoset
			is geo-located in a particular region, you can change the center and zoom.

			This function also initalizes the photo fetching procedure. The general process is to fetch
			the photoset, then iteratively fetch the geo-location data for each photo in the set. As the
			geodata for each photo is retrieved, the photos are placed on the map.

			Overview of function dependencies:
			-	load calls Y.Get which invokes loadPhotoSet
			-	loadPhotoSet calls Y.Get which invokes loadPhotoGeo (once per photo)
			-	loadPhotoGeo calls mapPhoto
			-	mapPhoto calls getPhotoURL

			@method load
		**/
		var load = function() {
			// Initialize Google Map
			if (GBrowserIsCompatible()) {
				map = new GMap2(document.getElementById("map"));
				map.addControl(new GLargeMapControl());
				map.addControl(new GOverviewMapControl());
				map.enableDoubleClickZoom();
				map.setCenter(new GLatLng(20, -2), 2);
			}

			// Fetch photoset from Flickr
			// Change photoset id or callback function below
			var photoset_id = "72157607401290658";
			var callback = "loadPhotoSet";

			var photoset_url = "http://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key="+flickr_api_key+"&photoset_id="+photoset_id+"&format=json&jsoncallback="+callback

			Y.Get.script(photoset_url, {
				timeout: 20000,
				context: Y
			});
		}


		/**
			loadPhotoSet is called when the photoset result is retrieved. This function iterates
			through each photo description in the photoset, stores the description in the global
			photos array, and queries the Flickr API for each photo in order to get the Geo-location
			data.

			The API query URLs are constructed and stored in an array which is passed to Y.Get.
			Y.Get is awesome and manages multiple requests, fetching each serially, saving us the
			hassle of iterating through multiple urls to fetch.

			@method loadPhotoSet
			@param	results	Flickr JSON response returned from a call to the getPhotos query.
		**/
		loadPhotoSet = function(results) {

			var photoset = results.photoset;

			var baseurl = "http://api.flickr.com/services/rest/?method=flickr.photos.geo.getLocation&api_key="+flickr_api_key+"&format=json&jsoncallback=loadPhotoGeo&photo_id=";

			// will hold all of our API requests
			var geoURLs = new Array();

			if(photoset) {
				for (var i=0; i < photoset.photo.length; i++) {
					var id = photoset.photo[i].id;
					photos[id] = photoset.photo[i];
					geoURLs.push(baseurl + id);
				}
			}

			Y.Get.script(geoURLs, {
				timeout: 20000,
				context: Y
			});

		};

		/**
			loadPhotoGeo is called when the geolocation data is retrieved. It is called once for
			each photo in the photoset. loadPhotoGeo extracts the latitude and longitude for the
			photo and puts it in the photo object stored in the global photos array.
			It then calles mapPhoto, passing the photo object as a parameter.

			@method loadPhotoGeo
			@param	results	Flickr JSON response returned from a call to the getLocation query
		**/
		loadPhotoGeo = function(results) {
			var pgeo = results.photo;

			if (pgeo) {
				var photo = photos[pgeo.id];
				photo.latitude = pgeo.location.latitude;
				photo.longitude = pgeo.location.longitude;
				mapPhoto(photo);
			}
		}

		/**
			mapPhoto places a thumbnail of the photo at the appropriate latitude and longitude on
			the map, and creates an infowindow (popup window) which displays a larger version of
			the photo when the thumbnail is clicked.

			@method mapPhoto
			@param	photo	The photo object to map. It is the object returned from the Flickr API's JSON response
		**/
		mapPhoto = function(photo) {
			var icon = new GIcon();
			icon.image = getPhotoURL(photo, 't');
			icon.iconSize = new GSize(25, 25);
			icon.iconAnchor = new GPoint(0, 0);
			icon.infoWindowAnchor = new GPoint(25, 0);

			var title = photo.title;

			var point = new GLatLng(photo.latitude, photo.longitude);
			var marker = new GMarker( point, {title:title, icon:icon, draggable:false} );

			var html = "<h2>" + photo.title + "</h2>";
			html += "<div style='height:250px;width:250px;'><center><img style='margin:auto auto;' src='" + getPhotoURL(photo, 'm') + "' /></center></div>";

			GEvent.addListener(marker, "click", function() {
				marker.openInfoWindowHtml(html);
			});

			map.addOverlay(marker);

		};

		/**
			getPhotoURL generates the base URL for the photo using Flickr's equation
			http://farm{farm-id}.static.flickr.com/{server-id}/{id}_{secret}_[mstb].jpg

			@method getPhotoURL
			@param	photo	The photo object. It is the object returned from the Flickr API's JSON response
			@param	size	The size of the desired photo. Options are: m, s, t, b
		**/
		getPhotoURL = function(photo, size) {
			var url = "http://farm";
			url += photo.farm + ".static.flickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + "_" + size + ".jpg";
			return url;
		};

		Y.on("domready", load);

	});
