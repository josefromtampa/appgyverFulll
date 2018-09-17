/*
    API service for inbound/outbound data
*/
angular
  .module('data-api')
  .service('datacontext', function ($timeout, $q, $http, supersonic, config, util, app) {

      /* Private */
      var _helpers = {
         
          request: function(options, auth, handleSessionExpired){

              var deferred = $q.defer();

              try {

                  handleSessionExpired = handleSessionExpired === undefined ? true:  handleSessionExpired;

                  var token = app.session.getToken();
                  
                  if (auth && token) {
                      options = options || {};
                      options.headers = options.headers || {};
                      options.headers.Authorization = 'Bearer ' + token;
                  }// if

                  // execute request with request optiosn
                  $http(options)
                      .success(function (data, status, headers, config) {
                          deferred.resolve(data);
                      })
                      .error(function (data, status, headers, config) {

                          if (status == 403) {

                              if (handleSessionExpired && app.state.getViewState() != 'session_expired') {

                                  app.state.setViewState('session_expired');
                                  util.message.broadcastAppEvent('session_expired', options);

                                  deferred.reject('Session timeout');

                              } else {
                                  deferred.reject('Access Denied');
                              }// if-else

                          } else {

                              supersonic.logger.error('Request failed for ' + options.url + ' - ' + JSON.stringify(data));
                              supersonic.logger.error('status is ' + JSON.stringify(status));
                              deferred.reject('Request failed - ' + JSON.stringify(data));


                          }// if-else
                      });

              } catch (e) {

                  supersonic.logger.error('data.helper.request() Exception - ' + e.message);
                  deferred.reject(e.message);

              }// try-catch


              return deferred.promise;

          }

          

      };

      var _auth = {

          login: function (username, password) {

              var options = {
                  url: config.api + 'auth/login',
                  method: 'POST',
                  data: {
                      username: username,
                      password: password
                  }
              };
              
              return _helpers.request(options, false, false)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));
                            
                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._auth.login() Errored - ' + e);
                            return $q.reject('Login failed');
                        });

          },

          logout: function () {
              

              var token = app.session.getToken();

              if (token) {

                  var options = {
                      url: config.api + 'auth/logout',
                      method: 'PUT'
                  };

                  return _helpers.request(options, true, false)
                            .then(function (results) {

                                //supsersonic.logger.info(JSON.stringify(results));

                                if (results.success) {
                                    return $q.when(results);
                                } else {
                                    return $q.reject(results.message);
                                }// if-else
                            }, function (e) {
                                supersonic.logger.error('data._auth.logout() Errored - ' + e);
                                return $q.reject('Logout failed');
                            });
              } else {
                  return $q.when({ success: true });
              }// if-else
          }
      };

      var _forms = {

          getTemplates: function () {

              // TODO: add paging functionality
              // TODO: check if there's service
              //        - if service then get latest list
              //        - if no service then get list from cache

              var options = {
                  url: config.api + 'form/templates',
                  method: 'GET'
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));

                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._forms.getTemplates() Errored - ' + e);
                            return $q.reject('Get templates failed');
                        });
          },

          getTemplate: function (id) {

              var options = {
                  url: config.api + 'form/templates/' + id,
                  method: 'GET'
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));

                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._forms.getTemplate() Errored - ' + e);
                            return $q.reject('Unable to retrieve template');
                        });
          },

          getTemplateCards: function (id) {
              var options = {
                  url: config.api + 'form/templates/cards/' + id,
                  method: 'GET'
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));

                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._forms.getTemplateCards() Errored - ' + e);
                            return $q.reject('Failed to retrieve template cards');
                        });
          },

          getList: function () {

              // TODO: add paging functionality
              // TODO: check if there's service
              //        - if service then get latest list
              //        - if no service then get list from cache

              var options = {
                  url: config.api + 'form/list/',
                  method: 'GET'
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));

                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._forms.getList() Errored - ' + e);
                            return $q.reject('Unable to retrieve forms');
                        });
          },

          getForm: function (id) {

              var options = {
                  url: config.api + 'form/' + id,
                  method: 'GET'
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));

                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._forms.getForm() Errored - ' + e);
                            return $q.reject('Unable to retrieve form');
                        });
          },

          save: function (form) {

              var options = {
                  url: config.api + 'form/',
                  method: 'POST',
                  data: {
                      form: form
                  }
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));
                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._forms.save() Errored - ' + e);
                            return $q.reject('Unable to save user form');
                        });
          },
          
          delete: function (id) {

              var options = {
                  url: config.api + 'form/' + id,
                  method: 'DELETE'
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));

                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._fomrs.delete() Errored - ' + e);
                            return $q.reject('Unable to delete form');
                        });
          },

          saveCard: function (userFormId, card) {

              var options = {
                  url: config.api + 'form/' + userFormId + '/card/',
                  method: 'POST',
                  data: {
                      card: card
                  }
              };
              
              return _helpers.request(options, true)
                        .then(function (results) {
                            
                            //supsersonic.logger.info(JSON.stringify(results));
                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._forms.saveCard() Errored - ' + e);
                            return $q.reject('Unable to save user form card');
                        });
          },
          saveProgress: function (userFormId, progress) {

              var options = {
                  url: config.api + 'form/' + userFormId + '/progress/',
                  method: 'POST',
                  data: {
                      progress: progress
                  }
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));
                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._forms.saveProgress() Errored - ' + e);
                            return $q.reject('Unable to save user form progress');
                        });
          },

          saveGPS: function (userFormId, gps) {

              var options = {
                  url: config.api + 'form/' + userFormId + '/gps/',
                  method: 'POST',
                  data: {
                      gps: gps
                  }
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));
                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            alert('data._forms.saveGPS() Errored - ' + e);
                            return $q.reject('Unable to save user form gps');
                        });
          },


          update: function (id, fields) {

              var options = {
                  url: config.api + 'form/' + id,
                  method: 'PUT',
                  data: {
                      fields: fields
                  }
              };

              return _helpers.request(options, true)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));
                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._forms.update() Errored - ' + e);
                            return $q.reject('Unable to update user form');
                        });
          }

      };

      var _image = {

          getRemotePath: function (destination) {
              var token = app.session.getToken();
              
              if (token) {
                  return config.api + 'image/' + token + (destination.indexOf('/') !== -1 ? '/' : '') + destination;
              }// if

              return '';
          },

          save: function (name, sourceURL, destination) {

              try {
                  var token = app.session.getToken();

                  if (destination.indexOf('/') < 0) {
                      destination = '/' + destination;
                  }// if
                  

                  if (token){
                      //var deferred = $q.defer();
                      var url = _image.getRemotePath(destination);

                      return util.file.upload({
                          name: name,
                          fileKey: 'image',
                          mimeType: 'image/jpeg'
                      }, sourceURL, url)
                        .then(function (results) {

                            return $q.when(results);
                        });

                  } else {
                      return $q.reject('Session expired');
                  }// if-else
              } catch (e) {
                  supersonic.logger.error('data._image.save() Exception - ' + e.toString());
                  return $q.reject('Unable to save image');
              }

          },

          download: function(path, destination){

              var url = config.api + 'image/' + app.session.getToken() + '/' + path;




          },

          getUrl: function (path) {

              return config.api + 'image/' + app.session.getToken() + path;
             
          }

      };

      var _log = {

          logEvent: function (type, data) {

              var options = {
                  url: config.api + 'log/event',
                  method: 'POST',
                  data: {
                      type: type,
                      value: data
                  }
              };

              return _helpers.request(options, true, false)
                        .then(function (results) {

                            //supsersonic.logger.info(JSON.stringify(results));

                            if (results.success) {
                                return $q.when(results);
                            } else {
                                return $q.reject(results.message);
                            }// if-else
                        }, function (e) {
                            supersonic.logger.error('data._log.logEvent() Errored - ' + e);
                            return $q.reject('Unable to log event');
                        });
          }

      };


      /* Public */
      return {

          auth: _auth,

          forms: _forms,

          image: _image,

          log: _log

      };


  });