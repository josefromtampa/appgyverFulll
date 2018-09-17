
/*** APP Managers ***/
function Config() {

    return {
        appId: 'com.ibhs.pdi',
        //api: 'https://api-ibhspostdisaster.rhcloud.com/',
        //api: 'https://test-ibhspostdisaster.rhcloud.com/',
        api: 'https://pdi-ibhs.rhcloud.com/',
        //api: 'http://192.168.1.5:1337/'
    };

};


// view manager
function ViewManager(supersonic, config) {

    return {

        showLogin: function (animate, callback) {

            animate = animate !== undefined && animate !== null ? animate : true;

            //supersonic.ui.views
            //            .find("login")
            //            .then(function (login) {

            //                loginView = login;
            //                supersonic.ui.modal.show(login, { anmiate: animate });

            //                if (callback) {
            //                    callback(login);
            //                }// if
            //            });

            var modalView = new supersonic.ui.View("view-login#login");
            var options = {
                animate: animate
            };

            supersonic.ui.modal.show(modalView, options);

        }
    };
};

// state manager
function StateManager() {


    return {
        setLoggedIn: function (session) {

            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('session', JSON.stringify(session));
        },

        setLoggedOut: function () {

            localStorage.setItem('loggedIn', 'false');
            localStorage.setItem('session', '');

        },

        setViewState: function (state) {
            localStorage.setItem('viewState', state);
        },

        getViewState: function () {
            return localStorage.getItem('viewState');
        }
    };
};

// session manager
function SessionManager(supersonic) {

    var _local = {

        getSession: function () {

            try {

                var _session = null;
                var json = localStorage.getItem('session');

                if (json && json != 'undefined') {
                    // cache session
                    _session = JSON.parse(json);
                } else {
                    // session not found
                    return '';
                }// if-else

                return _session;
            } catch (e) {
                supersonic.logger.error('util.session.getSession() Exception - ' + e.message);
                return null;
            }//try-catch
        }
    };

    return {

        getToken: function () {

            var session = _local.getSession();

            return session ? session.access_token : null;
        },

        getUser: function () {
            var session = _local.getSession();

            return session ? session.user : null;
        }
    }

};

/*** UTIL Managers ***/
// message manager
function MessageManager(supersonic) {

    return {
        // broadcast an app event
        broadcastAppEvent: function (type, data) {
            supersonic.data.channel('appEvent').publish({
                type: type,
                data: data
            });
        },

        // listen for event broadcast events
        registerAppListener: function (callback) {
            supersonic.data
                    .channel('appEvent')
                    .subscribe(function (data) {

                        if (callback) {
                            callback(data.type, data.data);
                        }// if
                    });
        },

        // send generic message to a channel
        broadcastMessage: function (channel, message) {
            supersonic.data.channel(channel).publish({
                data: message
            });
        },

        // listen for a generic message
        registerMessageListener: function (channel, callback) {
            supersonic.data
                    .channel(channel)
                    .subscribe(function (message) {

                        if (callback) {
                            callback(message.data);
                        }// if
                    });
        },

        // class
        class: {

            Channel: function (channel, receiveEvent) {

                var _channel = channel;

                // set listener if there is a receive event
                if (receiveEvent) {
                    supersonic.data
                        .channel(_channel)
                        .subscribe(function (message) {
                            receiveEvent(message);
                        });
                }// if

                return {
                    send: function (data) {
                        supersonic.data.channel(_channel).publish(data);
                    }
                };


            }
        }
    };

};

// UI manager
function UIManager(supersonic, $interval) {

    return {
        hideNavigationBar: function () {

            if ($interval) {

                // set intervals to hide nav bar - need to hack because hide function not taking to affect due to some weird timing in supersonic for iOS
                $interval(function () {
                    supersonic.ui.navigationBar.hide({ animated: false });

                    supersonic.device.platform()
                      .then(function (platform) {
                          if (platform.name === 'Android') {
                              supersonic.app.statusBar.hide();
                          }// if
                      });
                }, 200, 10);
            } else {

                // TODO: non Angular implementaiton

            }// if-else
        },

        findViewAndOpen: function (viewName, params, altLocation, animation, duration, curve) {

            var animationOptions = {};

            if (duration) {
                animationOptions.duration = duration;
            }// if
            if (curve) {
                animationOptions.curve = curve;
            }

            // push group view to layer
            var customAnimation = supersonic.ui.animate(
                    animation || 'slideFromRight'
                    , animationOptions
                );
            return supersonic.ui.views.find(viewName).then(function (view) {

                var options = {
                    animation: customAnimation
                };

                if (params) {
                    options.params = params;
                }// if

                if (view.getLocation() == viewName) {

                    // create if not already existing
                    view = new supersonic.ui.View({
                        location: altLocation,
                        id: viewName
                    });

                    //supersonic.logger.info('starting new view ' + viewName + ' with ' + location);
                    return supersonic.ui.views.start(view)
                                .then(function (startedView) {

                                    // note: there's a wierd timing issue with newly started views and passing parameters, views are not getting the params
                                    return supersonic.ui.layers.push(startedView, options);
                                });
                } else {


                    return supersonic.ui.layers.push(view, options);
                }// if-else
            });
        },

    }
};

// Async task manager
function TaskManager($q, supersonic) {

    return {

        serial: function (tasks, notify, stopOnError) {

            try {

                var chain = null;

                // set default
                stopOnError = (stopOnError === undefined ? false : stopOnError);

                // iterate through all tasks
                for (var i = 0; i < tasks.length; i++) {

                    (function (idx) {
                        var task = tasks[idx];

                        // chain tasks together for sequential execution
                        if (i == 0) {
                            chain = task();
                        } else {

                            chain = chain.then(function (results) {

                                if (notify) {
                                    notify({ counter: idx, total: tasks.length, data: results });
                                }// if                       

                                // success - execute next
                                return task(results);

                            }, function (e, results) {

                                supersonic.logger.error('util.serial() Exception executing task - ' + e);

                                if (stopOnError) {
                                    // error so reject all tasks
                                    return $q.reject(e, results);
                                } else {
                                    // keep going
                                    return task(results);
                                }// if-else

                            });
                        }



                    })(i);

                }// for

                return chain.then(function (results) {

                    // catch last results for notify
                    if (notify) {
                        notify({ counter: tasks.length, data: results });
                    }// if     

                    return $q.when(results);
                });
            } catch (e) {
                supersonic.logger.error('util.task.serial() Exception executing serial tasks - ' + e.message);
                return $q.reject(e.message);
            }// try-catch

        }
    }
};

// file namanger
function FileManager($q, supersonic) {

    return {

        upload: function (options, source, destination) {

            var deferred = $q.defer();

            // upload image
            var ft = new FileTransfer();
            var options = options || {};

            if (!options.hasOwnProperty('fileKey')) {
                return $q.reject('Upload requires a "fileKey" options property');
            }// if

            ft.upload(source,
                encodeURI(destination)
                , function (response) {
                    //alert('upload response is ' + JSON.stringify(response));
                    deferred.resolve(JSON.parse(response.response));
                }
                , function (e) {
                    deferred.reject(e);
                }
                , options);

            return deferred.promise;
        },

        download: function (source, destination, options) {

            try {
                var deferred = $q.defer();

                var fileTransfer = new FileTransfer();
                var uri = encodeURI(source);

                fileTransfer.download(
                    uri,
                    destination,
                    function (entry) {
                        //alert('got file');
                        deferred.resolve(entry);
                    },
                    function (error) {
                        //alert('file error');
                        deferred.reject(error);
                    },
                    false,
                    options
                );

                return deferred.promise;

            } catch (e) {
                //alert('file error ' + e.toString());
                superonic.logger.error('FileManager.download() Exception - ' + e.toString());
                return $q.reject(e);
            }// try-catch
        }
    };
};

/***** INIT ****/
if (angular) {

    angular.module('common', [
      // Declare here all AngularJS dependencies that are shared by all modules.
      'supersonic'
    ]).constant('config', Config())
        .service('app', function ($interval, config) {

            /* App Specific Helpers */
            return {

                view: ViewManager(supersonic, config),

                state: StateManager(),

                session: SessionManager(supersonic)
            };

        }).service('util', function ($interval, $q) {

            /* Public Interface */
            return {

                ui: UIManager(supersonic, $interval),

                message: MessageManager(supersonic),

                task: TaskManager($q, supersonic),

                file: FileManager($q, supersonic)
            };

        });

} else {

    var config = Config();

    var global = {

        config: config,

        app: {

            view: ViewManager(supersonic, config),

            state: StateManager(),

            session: SessionManager(supersonic)
        },

        util: {

            ui: UIManager(supersonic),

            message: MessageManager(supersonic),

            task: TaskManager(),

            file: FileManager($q, supersonic)
        }


    };

}// if-else
