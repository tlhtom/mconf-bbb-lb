// LoadBalancer module
// Responsible for balancing the request.

var BigBlueButton = require('../lib/bigbluebutton')
  , Logger = require('../lib/logger')
  , Server = require('../models/server')
  , Utils = require('../lib/utils')
  , config = require('../config')
  , request = require('request')
  , util = require('util')
  , url = require('url');

var LoadBalancer = exports;

// Selects the adequate BigBlueButton server for a new meeting
// to be created
LoadBalancer.selectServer = function(){
  var id = 0
    , count = -1
    , newCount = 0
    , s = null
    , selected
    , servers;

  Logger.debug('selecting a server for a new meeting');
  Logger.debug('inspect: ' + util.inspect(Server, {depth: 3, colors: true}));

	servers = Server.allSync();
  Logger.debug('inspect: ' + util.inspect(servers, {depth: 3, colors: true}));

  selected = servers[Math.floor((Math.random()*servers.length )+0)]; 
  Logger.debug('selecting : ' +selected.name );

//	for (id in servers) {
//		s = servers[id];
//		newCount = s.getMeetingCountSync();
//		Logger.debug('inspect: ' + util.inspect(s, {depth: 3, colors: true}));
//
//	}

//  // for now we select the server with the lowest number of users connected
//  servers = Server.allSync();
//  selected = servers[0];
//  for (id in servers) {
//    s = servers[id];
//    newCount = s.getMeetingCountSync();
//
//    if (newCount != -1) {
//      Logger.log('server ' + s.name + ' has ' + newCount + ' meetings');
//      if (newCount < count || count == -1) {
//        selected = s;
//        count = newCount;
//      }
//    } else {
//      Logger.log('server ' + s.name + ' is disabled');
//    }
//  }
//
//  selected.incMeetingCountSync();
//  Logger.log('server selected: ' + selected.name + ' with ' + count + ' meetings');
//  Logger.log('server selected has now ' + (count + 1) + ' meetings');
  return selected;
}

// Returns the default server, used when we don't know in which server
// the meeting is in (usually resulting in an error message)
LoadBalancer.defaultServer = function(){
  var server = Server.getSync(config.nagios.defaultServer);
  if (server != undefined) {
    return server;
  } else {
    // if we don't find the default server, use the first one
    return Server.firstSync();
  }
}

// Handles a request 'req' to the BigBlueButton 'server'.
// If 'useProxy', the request will be 'proxied', otherwise it will respond with
// a redirect to the BBB server.
// Also, if 'useProxy', 'beforeSend' will be called when we receive a response from BBB
// and before sending it to the user. If not 'useProxy', 'beforeSend' is called
// before returning the redirect to the user.
LoadBalancer.handle = function(req, res, server, useProxy, beforeSend){
  var newUrl;
  Logger.debug('handling the request to the server ' + server.url);

  newUrl = BigBlueButton.formatBBBUrl(req.url, server);

  // if not specified, use the default in the config
  if (useProxy == null) { useProxy = config.lb.proxy; }
  if (useProxy) {
    LoadBalancer.proxy(res, newUrl, beforeSend);
  } else {
    LoadBalancer.redirect(res, newUrl, beforeSend);
  }
}

// Redirects a request to 'destination'
LoadBalancer.redirect = function(res, destination, beforeSend){
  Logger.info('full redirect api call to ' + destination);
  if (beforeSend != null) {
    beforeSend(false, null);
  }
  res.redirect(destination);
}

// Proxies a request to 'destination'
LoadBalancer.proxy = function(res, destination, beforeSend){
  var value, name, opt;
  Logger.info('proxying api call to ' + destination);

  opt = { url: destination, timeout: config.lb.requestTimeout }
  request(opt, function(error, response, body) {
    if (error) {
      Logger.error('error proxying the request: ' + error);
    } else {
      Logger.error('got the response from BBB, sending it to the user.');

      // copy the headers from BBB and send it back to the user
      Utils.copyHeaders(response, res);
      if (beforeSend != null) {
        beforeSend(true, body);
      }
      res.send(body);
    }
  });
}
