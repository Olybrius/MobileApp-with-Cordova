document.addEventListener('deviceready', onDeviceReady, false);
var app = ons.bootstrap();
var db;

var devfest_service = {

	loadData: function() {
		$.getJSON('https://devfest2015.gdgnantes.com/assets/prog.json', function(data) {
			var strValue = JSON.stringify(data);
			localStorage.setItem("DEV_FEST_PROG", strValue);
		});
	},

	getData: function(callback) {
		var strValue = localStorage.getItem("DEV_FEST_PROG");
		callback(JSON.parse(strValue));
	}

}

devfest_service.loadData();

$(document).on('pageinit', "#sessionsPage", function() {
    devfest_service.getData(function(data) {
        for (var category in data.categories) {
           $("#sessionList").append("<ons-list-header>" + data.categories[category] + "</ons-list-header>");
            data.sessions.forEach(function(session) {
                if (session.type === category) {
                	var favorisString = "";
                    if(window.localStorage.getItem(session.id+"-fav") == "true"){
                      favorisString = "<i class='ion-android-star' style='font-size:20px;'></i>" ;
                    }
                    $("#sessionList").append("<ons-list-item modifier='chevron' class='item-line' id='session_" + session.id + "'>" + "<span>" + favorisString + "</span>" + session.title + "</ons-list-item>");
                    $("#session_" + session.id).on('click', function(event) {
                    	app.navi.pushPage('views/session_details.html', {session : session});
                    });
                }
            });
            ons.compile(document.getElementById('sessionList'));
        }
    });
});

$(document).on('pageinit', '#sessionPageDetails', function( event ) {

	var session = app.navi.getCurrentPage().options.session;
	var favoris = window.localStorage.getItem(session.id+"-fav");
	
    if (favoris != null) {
      if(favoris == "true")
        $("#favCheckBox").prop('checked', favoris);
    }

    $("#favCheckBox").change(function() {
        window.localStorage.setItem(session.id+"-fav", $("#favCheckBox").prop("checked"));
    });

	$("#star1").on('click', function (event) {
        window.localStorage.setItem(session.id+"-star", "1");
	});

	$("#star2").on('click', function (event) {
	    window.localStorage.setItem(session.id+"-star", "2");
	});

	$("#star3").on('click', function (event) {
	    window.localStorage.setItem(session.id+"-star", "3");
	});

	$("#star4").on('click', function (event) {
	    window.localStorage.setItem(session.id+"-star", "4");
	});

	$("#star5").on('click', function (event) {
	    window.localStorage.setItem(session.id+"-star", "5");
	});

	getStar(session.id);
	$('#sessionTitle').text(session.title);
	$('#sessionSalle').text("Salle : " + session.confRoom);
	session.speakers.forEach(function(speakers) {
		$("#sessionSpeakers").append("<h2>" + "@" + speakers + "</h2>");
	});
	$('#sessionDesc').html(session.desc);
	 $("#buttonNote").on('click', function(event) {
	 	app.navi.pushPage('views/note.html', {session : session});
    });
});

$(document).on('pageinit', "#speakersPage", function() {
    devfest_service.getData(function(data) {
    	    var speakersSorted = data.speakers.sort(function(a, b){
		       return a.firstname > b.firstname?1:-1;
		    });
	            speakersSorted.forEach(function(speaker) {
	           	var about = speaker.about;
	            if (about.length > 120)
	                about = about.substring(0, 120) + "...";
	           	var speakerString = 
	            "<ons-list-item modifier='chevron' class='list-item-container' id='speakers_" + speaker.id + "'>" + 
	            "  <div class='list-item-left'>" + 
	            "    <img src='data/images/" + speaker.image + "' class='avator'>" +
	            "  </div>" +
	            "  <div class='list-item-right'>" +
	            "    <div class='list-item-content'>" +
	            "      <div class='name'>" + speaker.firstname + " " + speaker.lastname + 
	            "        <span class='lucent'>@ " + speaker.id + "</span>" +
	            "      </div>" +
	            "      <span class='desc'>" + about + "</span>" +
	            "    </div>" +
	            "  </div>" +
	            "</ons-list-item>"; 

		    $("#speakerList").append(speakerString);
		    $("#speakers_" + speaker.id).on('click', function(event) {
	            app.navi.pushPage('views/speaker_details.html', {speaker : speaker});
	        });
	    });
           ons.compile(document.getElementById("speakerList")); 
    });
});

$(document).on('pageinit', '#speakerPageDetails', function( event ) {

	var speaker = app.navi.getCurrentPage().options.speaker;

	findContact(speaker.id, function(contact) {
		$("#checkBox").prop('checked', true)
	});

	$("#profileImage").attr('src', "data/images/" + speaker.image);
	$("#profile-name").text(speaker.firstname + " " + speaker.lastname);
	$("#profile-id").text("@" + speaker.id);
	$("#profile-desc").html(speaker.about);
	speaker.socials.forEach(function (social) {
	    var social_item = "<a href='" + social.link + "'><span class='fa fa-" + social.class + " social-link'></span></a> "
	    $("#profile-social").append(social_item);
    });


    $(document).on('change', '#checkBox', function( event ) {

    	if($("#checkBox").prop('checked')){   		
    		createContact(speaker);
    	}
    	else{
    		removeContact(speaker.id);
    	}

    });

});

$(document).on('pageinit', '#sessionPageNote', function( event ) {

	var session = app.navi.getCurrentPage().options.session;

	$('#sessionNoteTitle').text(session.title);

	selectNotes(session.id);

	selectMedias(session.id);

	$(document).on('click', '#saveNote', function( event ) {
		insertNote(session.id, $('#noteText').val());
    });

	$(document).on('click', '#existingPicture', function( event ) {
		getExistingPicture(session.id);
    });

    $(document).on('click', '#takePicture', function( event ) {
		getPicture(session.id);
    });

     $(document).on('click', '#takeSound', function( event ) {
		takeAudio(session.id);
    });

    $(document).on('click', '#takeVideo', function( event ) {
		takeVideo(session.id);
    });
});

function shareOrDelete (buttonIndex, id, src) {
    if(buttonIndex == 1){
    	db.executeSql("DELETE FROM MEDIAS WHERE id = " + id + "");
    	$('#' + id).remove();
    }
    else if(buttonIndex == 2){
    	window.FilePath.resolveNativePath(src, function(localFileUri){
    		var path = "file://"+localFileUri;
    		window.plugins.socialsharing.share($('#noteText').val(), $('#sessionNoteTitle').text(), path);
    	})   	
    }
};

function shareSheet(id, src) {
    var options = {
        'androidTheme': window.plugins.actionsheet.ANDROID_THEMES.THEME_HOLO_LIGHT, // default is THEME_TRADITIONAL
        'title': 'Que faire avec l\'image ?',
        'buttonLabels': ['Supprimer', 'Partager'],
        'androidEnableCancelButton' : true, // default false
        'winphoneEnableCancelButton' : true, // default false
        'addCancelButtonWithLabel': 'Annuler',
        'position': [20, 40] // for iPad pass in the [x, y] position of the popover
    };
    window.plugins.actionsheet.show(options, function (btnIndex){
    	shareOrDelete(btnIndex, id, src);
    });
};

function createMedia(id, src, elem, type){
	if(type == "img"){
		$(elem).append('<img id="' + id + '" src="' + src +'" style="width:100%;"/>');
	}
	else if(type == "video"){
		$(elem).append('<video id="' + id + '" width="100%" controls><source src="' + src +'"></video>');
	}
	else if(type == "audio"){
		$(elem).append('<audio id="' + id + '" controls> <source src="' + src +'"/></audio>');
	}

	$(document).on('click', '#' + id , function( event ) {
		shareSheet(id, src);
    });
}

function takeAudio(sessionId){
	navigator.device.capture.captureAudio(function(mediaFiles){
		mediaFiles.forEach(function(file){
			insertMedias(sessionId, file.fullPath, "audio", function(id){
				createMedia(id, file.fullPath, "#notes_picture_list", "audio" );
			});
		});		
	});
}

function takeVideo(sessionId){
	navigator.device.capture.captureVideo(function(mediaFiles){
		mediaFiles.forEach(function(file){
			insertMedias(sessionId, file.fullPath, "video", function(id){
				createMedia(id, file.fullPath, "#notes_picture_list", "video" );
			});
		});	
	});
}

function getPicture(sessionId){
	navigator.camera.getPicture(onSuccess, onFail, { 
	    destinationType: Camera.DestinationType.FILE_URI,
	    targetWidth: 500,
	    targetHeight: 500
	});

	function onSuccess(imageURI) {
	   	insertMedias(sessionId, imageURI, "img", function(id){
	   		createMedia(id, imageURI, "#notes_picture_list", "img");
	   	} );
	}

	function onFail(message) {
	    alert('Failed because: ' + message);
	}

}

function getExistingPicture(sessionId){
	navigator.camera.getPicture(onSuccess, onFail, {
    destinationType: Camera.DestinationType.NATIVE_URI,
    sourceType: Camera.PictureSourceType.PHOTOLIBRARY });

	function onSuccess(imageURI) {	   	
	   	insertMedias(sessionId, imageURI, "img", function(id){
	   		createMedia(id, imageURI, "#notes_picture_list", "img");
	   	});
	}

	function onFail(message) {
	    alert('Failed because: ' + message);
	}
}


function onDeviceReady(){

	db = window.sqlitePlugin.openDatabase({name: "app.conference"});
	db.executeSql('DROP TABLE IF EXISTS NOTES');
	db.executeSql('DROP TABLE IF EXISTS MEDIAS')
    db.executeSql('CREATE TABLE IF NOT EXISTS NOTES (sessionId text primary key, comment text)');
    db.executeSql('CREATE TABLE IF NOT EXISTS MEDIAS (id integer primary key, sessionId text, uri text, type text)');
}

function selectMedias(sessionId){
	db.executeSql('SELECT * FROM MEDIAS WHERE sessionId=?', [sessionId], function (res) {
				var i, item;
				for (i = 0; i < res.rows.length; i++) {
					item = res.rows.item(i);
					createMedia(item.id, item.uri, "#notes_picture_list", item.type );
				}
			}, function(e) {
		     	console.error("ERROR: " + e.message);
		    });
}

function insertMedias(sessionId, uri, type, successCallback){
	db.executeSql("INSERT OR REPLACE INTO MEDIAS (sessionId, uri, type) VALUES (?, ?, ?)", [sessionId, uri, type], function (res) {
				successCallback(res.insertId);
		    });
}

function selectNotes(sessionId){
	db.executeSql('SELECT * FROM NOTES WHERE sessionId=?', [sessionId], function(res) {
            if (res.rows.length > 0) {
                $('#noteText').text(res.rows.item(0).comment);
            }
        });
}

function insertNote(sessionId, note){	
	db.executeSql("INSERT OR REPLACE INTO NOTES (sessionId, comment) VALUES (?, ?)", [sessionId, note]);
}

function findContact(speakerId, callback){
	function onSuccess(contacts) {
	    if(contacts.length > 0){
	    	callback(contacts[0]);
	    }
	};

	function onError(contactError) {
	    alert("Error = " + contactError.code);
	};
	var monContact = navigator.contacts.create();
	var optionsRecherche = new ContactFindOptions();
	optionsRecherche.filter = speakerId;
	optionsRecherche.desiredFields = [navigator.contacts.fieldType.id];
	var champsRecherche = [navigator.contacts.fieldType.nickname];
	navigator.contacts.find(champsRecherche, onSuccess, onError, optionsRecherche);
}

function createContact(speaker){
	function onSuccess(contact) {
    alert("Create Success");
	};

	function onError(contactError) {
	    alert("Error = " + contactError.code);
	};
	var monContact = navigator.contacts.create();
	var pictures = [];
		 var field = new ContactField();
             field.value = speaker.image;
             field.pref = false;
            pictures.push(field);
	monContact.photos = pictures;
	monContact.nickname = speaker.id;
    monContact.name = speaker.lastname;
    monContact.displayName = speaker.firstname + " " + speaker.lastname;
    monContact.note = speaker.desc;
    var urls = [];
        speaker.socials.forEach(function(social){
            var field = new ContactField();
            field.type = social.class;
            field.value = social.link;
            field.pref = false;
            urls.push(field);
		});
    monContact.urls = urls;
    monContact.note = speaker.about;
    var organizations = [];
        var organization = new ContactOrganization();
        organization.type = "organization";
        organization.name = speaker.company;
        organization.pref = "false";
		organizations.push(organization);
    monContact.organizations = organizations;
	monContact.save(onSuccess, onError);
}

function removeContact(speakerId){
	function onSuccess(contact) {
    alert("Remove Success");
	};

	function onError(contactError) {
	    alert("Error = " + contactError.code);
	};

	findContact(speakerId, function(contact){
		contact.remove(onSuccess, onError);
	});
}


$(document).on('pageinit', '#techniquesPage', function( event ) {

	var states = {};
	states[Connection.UNKNOWN]  = 'Unknown connection';
	states[Connection.ETHERNET] = 'Ethernet connection';
	states[Connection.WIFI]     = 'WiFi connection';
	states[Connection.CELL_2G]  = 'Cell 2G connection';
	states[Connection.CELL_3G]  = 'Cell 3G connection';
	states[Connection.CELL_4G]  = 'Cell 4G connection';
	states[Connection.CELL]     = 'Cell generic connection';
	states[Connection.NONE]     = 'No network connection';

	connection = function() {
	var networkState = navigator.connection.type;
		return states[networkState];
    }

	var specString = 
	"<li  class='list__item'>" + "<span style='font-weight:bold'> Available : </span>" + device.available + "</li>" +
	"<li class='list__item'>" + "<span style='font-weight:bold'> Platform : </span>" + device.platform + "</li>" +
	"<li class='list__item'>" + "<span style='font-weight:bold'> Version : </span>" + device.version + "</li>" +
	"<li class='list__item'>" + "<span style='font-weight:bold'> Uuid : </span>" + device.uuid + "</li>" +
	"<li class='list__item'>" + "<span style='font-weight:bold'> Cordova : </span>" + device.cordova + "</li>" +
	"<li class='list__item'>" + "<span style='font-weight:bold'> Model : </span>" + device.model + "</li>" +
	"<li class='list__item'>" + "<span style='font-weight:bold'> Manufacturer : </span>" + device.manufacturer + "</li>" +
	"<li class='list__item'>" + "<span style='font-weight:bold'> Connexion : </span>" + connection() + "</li>" +
	"</ul>";
	
	$("#specList").append(specString);

});

$(document).on('pageinit', '', function( event ) {
	
	$('a').on('click', function(event){
	cordova.InAppBrowser.open($(this).prop("href"), '_blank', 'location=yes');
	event.preventDefault();
	});

});

function getStar(sessionId){
	var star = window.localStorage.getItem(sessionId+"-star");

    if (star != null) {
        $("#star" + star).prop('checked', true);
    }
}

$(document).on('pageinit', '#agendaPage', function( event ) {
	var session = app.navi.getCurrentPage().options.session;
	devfest_service.getData(function(data) {
    	    for(var hour in data.hours) {
    	    	data.sessions.forEach(function(session) {
					if(hour == session.hour) {

						var agendaString =
						"<ons-list-item modifier=\"chevron\" class=\"plan\" onclick=\"app.navi.pushPage('views/sessionDetail.html', {id: \'" + session.id + "\'})\">" +
						"<ons-row><ons-col width=\"80px\" class=\"plan-left\">" +
						"<div class=\"plan-date\">"+ getHour(data.hours[hour]) + "</div>" +
						"<div class=\"plan-duration\">" + getDuration(data.hours[hour]) + "</div>" +
						"</ons-col><ons-col width=\"6px\" class=\"plan-center\" ng-style=\"{backgroundColor:a % 3 == 1 ? '#3399ff' : '#ccc'}\">" +
						"</ons-col><ons-col class=\"plan-right\">" +
						"<div class=\"plan-name\">"+ session.title + "</div>" +
						"<div class=\"plan-info\"><div ng-hide=\"a % 4 == 0\"><ons-icon icon=\"fa-user\"></ons-icon>" + getSpeaker(session)+ "</div>" +
						"<div ng-hide=\"a % 3 == 0\"><ons-icon icon=\"fa-map-marker\"></ons-icon>" + session.confRoom + "</div>" + 
						"</div></ons-col></ons-row></ons-list-item>";
		                
		               $("#agendaList").append(agendaString);
		            }
        		});
    		};
    	ons.compile(document.getElementById("agendaList"));
	});
});

function getHour(hour) {
    return hour.hourStart + ":" + hour.minStart;
};
function getDuration(hour) {
    var start = parseInt(hour.hourStart) * 60 + parseInt(hour.minStart);
    var end = parseInt(hour.hourEnd) * 60 + parseInt(hour.minEnd);
    var duration = end - start;
    var min;
    if(duration%60 == 0){
    	min = "00"
    }
    else{
    	min = duration%60;
    }
    return Math.floor(duration/60) + "h" + min;
}
function getSpeaker(session) {
    if(session.speakers !== undefined){
        return "@" + session.speakers[0];
    }
    else {
        return "";
    }
}