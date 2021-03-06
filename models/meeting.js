var fs = require('fs')
  , Logger = require('../lib/logger')
  , Server = require('./server');

var db = {};

var Meeting = exports = module.exports = function Meeting(id, server, password) {
  this.id = id;
  this.server = server;

  // we only need this for the mobile client
  // see routes/mobile.sendGetMeetingInfoToAll()
  this.password = password;
};

Meeting.prototype.saveSync = function(){
  db[this.id] = this;
  return db[this.id];
};

Meeting.prototype.destroySync = function(){
  return exports.destroySync(this.id);
};

Meeting.countSync = function(){
  return Object.keys(db).length;
};

Meeting.getSync = function(id){
  return db[id];
};

Meeting.allSync = function(){
  var arr = Object.keys(db).reduce(function(arr, id){
    arr.push(db[id]);
    return arr;
  }, []);
  return arr;
};


Meeting.destroySync = function(id){
  if (db[id]) {
    delete db[id];
    return true;
  } else {
    return false;
  }
};

Meeting.clearSync = function(){
  for (var id in db) {
    item = db[id];
    delete item;
  }
  db = {};
};

// Loads a json into the local database
// For DEVELOPMENT only
Meeting.fromJsonSync = function(path){
	Logger.debug('trying to load data from ' + path);
  try {
    var fileContents = fs.readFileSync(path, 'utf8');
    var json = JSON.parse(fileContents);
    for(var idx in json){
			Logger.debug('	got var idx ==  ' + idx);
      var s = new Server(json[idx].id, json[idx].server.url, json[idx].server.salt);
      var m = new Meeting(json[idx].id, s);
      s.saveSync();
      m.saveSync();
    }

    Logger.debug('loaded data from ' + path);
    Logger.debug('meetings loaded: ' + JSON.stringify(db));
  } catch (e) { }
}
