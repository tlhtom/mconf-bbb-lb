var Logger = require('./lib/logger')
  , Meeting = require('./models/meeting')
  , Server = require('./models/server')
  , Utils = require('./lib/utils')
  , bbb = require('./lib/bigbluebutton')
  , config = require('./config')
  , sha1 = require('sha1')
  , url = require('url')
  , http = require('http')
  , xml2js = require('xml2js');


	function makeRequest (method, qstring) {
    var rand = Math.floor(Math.random() * 10000000000) // BBB 0.7 needs it
    var r = config.bbb.apiPath + '/' + method;
		r = r + '?random=' + rand;
		r = r +  '&' + qstring;

		var server = {
			"url":"http://localhost",
			"salt":"a3c3d82f3540e09f2231cb389f56f804"
		}

		var newUrl = bbb.formatBBBUrl(r, server);

		callback = function(response) {
			var str = '';

			console.log("getting callback response");
			//another chunk of data has been recieved, so append it to `str`
			response.on('data', function (chunk) {
				str += chunk;
			});

			//the whole response has been recieved, so we just print it out here
			response.on('end', function () {
				console.log(str);
			});
		}

		console.log("requesting:\n " + newUrl);
		http.request(newUrl, callback).end();
	}

// first check if the local config file exists
var fs = require('fs');
try {
  fs.statSync('./config_local.js');
} catch (e) {
  console.log('ERROR: You don\'t have a config_local.js file. Aborting.');
  console.log('       Create it with "cp config_local.js.example config_local.js"');
  process.exit(1);
}

Meeting.fromJsonSync('.data.json');
Meeting.allSync();
bbb.repopulateMeetings();

var id = Math.floor(Math.random() * 10000000000);
var name = Math.floor(Math.random() * 10000000000);

makeRequest ('getMeetings','');
makeRequest ('create', 'name=' + name + '&meetingID=' + id + '&attendeePW=asd&moderatorPW=dsa&');
makeRequest ('create', 'name=' + name + '&meetingID=' + id+1 + '&attendeePW=asd&moderatorPW=dsa&');
makeRequest ('getMeetingInfo', 'meetingID=' + id + '&password=dsa');
makeRequest ('isMeetingRunning', 'meetingID=' +id +'&');
makeRequest ('join', 'meetingID=' +id +'&fullName=tom&password=asd');
makeRequest ('getRecordings', 'meetingID=' +id +'&');
makeRequest ('getRecordings', 'meetingID=' +id +'&');
//makeRequest ('end', 'meetingID=' +id +'&password=dsa&');
//makeRequest ('end', 'meetingID=' +id+1 +'&password=dsa&');

makeRequest ('getMeetings','');
