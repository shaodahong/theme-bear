'use strict';;
(function (window, angular) {
    var gkToken,
        gkApiHost,
        gkDomain,
        gkConfigInfo,
        gkLan;
    angular.module('Yunku', ['ngCookies', 'ngAnimate', 'ui.router', 'ui.bootstrap.datetimepicker', 'gettext', 'LocalStorageModule', 'ui.utils', 'ui.bootstrap', 'ngSanitize', 'gkDragDrop', 'angularSpinner', 'Yunku.Common', 'Yunku.Public', 'Yunku.Home', 'Yunku.Chat', 'Yunku.File', 'Yunku.Contact', 'Yunku.Setting', 'Yunku.Queue', 'Yunku.Note', 'Yunku.Socket', 'treeControl', 'ui.select', 'ngDialog', 'angular-growl', 'angular-md5'])
        .run(['GKFileBrowser', 'GKSendWindowMsg', 'GKMixpanel', 'GKModal', 'getLanguage', 'getApiHost', 'getToken', 'GKChatList', 'expiredAlertService', 'GKMountList', '$state', 'GKConfig', 'GKI18n', '$rootScope', 'GKFile', 'GKFileOpt', 'growl', '$timeout', 'gettextCatalog', 'GKWindowCom',
            function (GKFileBrowser, GKSendWindowMsg, GKMixpanel, GKModal, getLanguage, getApiHost, getToken, GKChatList, expiredAlertService, GKMountList, $state, GKConfig, GKI18n, $rootScope, GKFile, GKFileOpt, growl, $timeout, gettextCatalog, GKWindowCom) {
                GK.Log.log('Yunku:App:--------run--------');


                if (gkToken) {
                    getToken.set(gkToken);
                }
                if (gkApiHost) {
                    getApiHost.set(gkApiHost);
                }

                var lang;
                if (GK.isClientOS()) {
                    getLanguage.set(gkLan['type']);
                    lang = GKI18n.setLocal();
                    moment.locale(lang ? lang : 'zh-cn');
                } else {
                    lang = GKI18n.setLocal();
                    moment.locale(lang ? lang : 'zh-cn');
                }


                ZeroClipboard && ZeroClipboard.config({
                    swfPath: "bower_components/zeroclipboard/dist/ZeroClipboard.swf"
                });

                //笔记编辑窗口关闭
                $rootScope.$on('NoteEditorClosed', function ($event, data) {
                    GK.Log.log('NoteEditorClosed:received:data', data);
                    GKFile.requestFileInfo({
                        mount_id: data.mount_id,
                        fullpath: data.fullpath
                    }).then(function (fileModel) {
                        if (fileModel.isLocked() && fileModel.lock_member_id == $rootScope.PAGE_CONFIG.user.member_id) {
                            GKFileOpt.unlock({
                                mount_id: data.mount_id,
                                webpath: data.fullpath
                            }).then(function () {
                                GKSendWindowMsg({
                                    event: 'NoteEditorClosed'
                                })
                                $rootScope.$broadcast('editFileSuccess', 'unlock', data.mount_id, data.fullpath)
                            });
                        }
                    });
                    GK.invoke('gEditorChange', {
                        status: 0
                    })
                });

                $rootScope.$on('OpenFileFinish', function ($event, openData) {
                    GK.Log.log('OpenFileFinish:received:openData', openData);
                    if (openData.error) {
                        $rootScope.$broadcast('showError', openData.message);
                        return;
                    }
                    if (openData.webpath.indexOf('gknote') === -1) {
                        return;
                    }
                    GKFileOpt.lock({
                        webpath: openData.webpath,
                        mount_id: openData.mount_id
                    }).then(function () {
                        $rootScope.$broadcast('RefreshFileListWithSelected', [openData.webpath]);
                        GKFileOpt.openNoteDialog(openData.mount_id, openData.webpath, openData);
                    }, function (error) {
                        $rootScope.$broadcast('showError', error.message);
                    });
                })

                $rootScope.$on('LinkStatus', function ($event, param) {
                    $rootScope.PAGE_CONFIG.networkConnected = param.link;
                });

                //错误提示popup
                $rootScope.$on('showError', function ($event, errorMsg, scope) {
                    GK.Log.log('showError:Received:errorMsg:scope', errorMsg, scope);
                    $timeout(function () {
                        growl.addErrorMessage(gettextCatalog.getString(errorMsg, scope));
                    });
                });

                $rootScope.$on('showMessage', function ($event, message, scope) {
                    GK.Log.log('showMessage:Received:message:scope', message, scope);
                    $timeout(function () {
                        growl.addSuccessMessage(gettextCatalog.getString(message, scope));
                    });
                });

                jQuery.ajaxSetup({
                    dataType: 'json',
                    timeout: 30000
                });

                $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
                    GK.Log.error('$stateChangeError:arguments', arguments);
                    $rootScope.$broadcast('showError', error.message ? error.message : error.toString());
                });

                //接收其他窗口传递的消息
                $rootScope.$on('gReceiveMessage', function (event, message) {
                    GK.Log.log('gReceiveMessage:Received:message', message);
                    //广播更新头像
                    $timeout(function () {
                        $rootScope.$broadcast(message.event, message.data);
                    });
                });

                $rootScope.$on('updateUserInfo', function (event, data) {
                    GK.Log.log('updateUserInfo:Received:data', data);
                    angular.extend($rootScope.PAGE_CONFIG.user, data);
                });

                GKWindowCom.message(function (event) {
                    var data = event.data;
                    if (!data) {
                        return;
                    }
                    if (data.type == 'gotoFile') {
                        GK.invoke('gSetForegroundWindow')
                        $rootScope.$broadcast('OpenMountPath', data);
                    }
                });

                $rootScope.PAGE_CONFIG = {};
                // GK.getConfigInfo(function (getConfigInfo) {
                GKConfig.config = gkConfigInfo;
                angular.extend($rootScope.PAGE_CONFIG, GKConfig);
                // });
                GK.Log.log('$rootScope.PAGE_CONFIG', $rootScope.PAGE_CONFIG);

                if (GK.isWindowsClient()) {
                    $rootScope.PAGE_CONFIG.style = true;
                }
                $rootScope.PAGE_CONFIG.client = GK.isWindowsClient();
                GK.getUser(function (user) {
                    $rootScope.PAGE_CONFIG.user = user;
                    GKMixpanel('user', user);
                });
                GK.getUIPath(function (uiPath) {
                    $rootScope.PAGE_CONFIG.uiPath = uiPath;
                });
                $rootScope.PAGE_CONFIG.siteDomain = gkDomain;
                GK.getNetworkStatus(function (network) {
                    $rootScope.PAGE_CONFIG.networkConnected = Number(network);
                });

                _.templateSettings = {
                    interpolate: /\{\{(.+?)\}\}/g
                };

                //特殊隐藏左侧列表
                if (window.location.search) {
                    var urlQuery = window.location.search.slice(1).split('=');
                    var diffSide = urlQuery[1].split('-');
                    var query = {};
                    if (urlQuery) query[urlQuery[0]] = diffSide;
                    if (query.hide_sidebar) {
                        if (parseInt(query.hide_sidebar[0])) {
                            $rootScope.PAGE_CONFIG.hideSidebarOne = true;
                        }
                        if (parseInt(query.hide_sidebar[1])) {
                            $rootScope.PAGE_CONFIG.hideSidebarTwo = true;
                        }
                    }
                }

                if (GK.isClientOS()) {
                    GK.invoke('gGetWindowSetting', '', function (res) {
                        if (res.setting === 'newWindow') {
                            $rootScope.PAGE_CONFIG.hideSidebarOne = true;
                            $rootScope.PAGE_CONFIG.newWindow = true;
                        }
                        $rootScope.PAGE_CONFIG.windowSetting = res.setting;
                    })
                }


                //路由切换判断企业是否过期
                $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                    if ($state.includes('index.home.file') || $state.includes('index.home.chat')) {
                        var entId;
                        if ($state.includes('index.home.file') && toParams.mountid) {
                            var mount = GKMountList.getByMountId(toParams.mountid);
                            if (mount && mount.isEntMount()) {
                                entId = mount.ent_id;
                            }
                        } else {
                            if (toParams.id) {
                                var chatEntId = GKChatList.getById(toParams.id).ent_id;
                                if (chatEntId && chatEntId > 0) {
                                    entId = chatEntId;
                                }
                            }
                        }
                        if (entId) {
                            expiredAlertService(entId);
                        }
                    }
                });


                //监听托盘设置
                $rootScope.$on('ShowUserInfoDialog', function () {
                    GK.invoke('gGetWindowSetting', '', function (res) {
                        if (res.setting === 'regist') {
                            var url = 'file:///' + $rootScope.PAGE_CONFIG.uiPath + '/index.html#' + '/setting/software';
                        } else {
                            var url = 'file:///' + $rootScope.PAGE_CONFIG.uiPath + '/index.html#' + '/setting/account';
                        }

                        var data = {
                            url: url,
                            type: "sole",
                            width: 800,
                            resize: 0,
                            height: 560,
                            name: '设置',
                            info: 'setting'
                        };
                        GK.invoke('gMain', data);
                    })


                });

                var logout = false;
                $rootScope.$on('LogoutNotice', function ($event, data) {
                    if (logout || $rootScope.PAGE_CONFIG.windowSetting === 'newWindow') return;
                    logout = true;
                    GKModal.logOff().result.then(function () {
                        logout = false;
                    }, function () {
                        logout = false;
                    });
                })

                var quitFlag = false;
                //监听托盘退出
                $rootScope.$on('QuitNotice', function ($event, data) {
                    if (quitFlag || $rootScope.PAGE_CONFIG.windowSetting === 'newWindow') return;
                    quitFlag = true;

                    GK.invoke('gGetWindowSetting', '', function (res) {
                        if (res.setting === 'regist') {
                            GKModal.confirm(data.message, '', {
                                classes: 'logout'
                            }).result.then(function () {
                                GK.quit();
                                quitFlag = false;
                            }, function () {
                                quitFlag = false;
                            });
                        } else {
                            GKModal.confirm(data.message).result.then(function () {
                                GK.quit();
                                quitFlag = false;
                            }, function () {
                                quitFlag = false;
                            });
                        }


                    })
                });

                $rootScope.$on('PostMessage', function ($event, data) {
                    var name = $rootScope.PAGE_CONFIG.windowSetting ? $rootScope.PAGE_CONFIG.windowSetting : 'main';
                    GK.Log.log('PostMessage:data:name', data, name);

                    var mount;
                    var params = data.params || null;
                    if (name !== data.name) {
                        switch (data.event) {
                            case 'setLib':
                                mount = params && GKMountList.getMountById(params.mount_id);
                                mount && mount.update({
                                    name: params.name,
                                    logo: params.logo
                                });
                                break;
                            case 'createLib':
                                params && GKMountList.add(params);
                                break;
                            default:
                                GKFileBrowser.refreahData();
                                break;
                        }
                    }
                })

            }
        ])
        .config(['usSpinnerConfigProvider', function (usSpinnerConfigProvider) {
            usSpinnerConfigProvider.setDefaults({
                lines: 11,
                length: 8,
                width: 2,
                radius: 9
            });
            usSpinnerConfigProvider.setTheme('smallWhite', {
                color: '#fff',
                scale: 0.75,
                radius: 6,
                width: 1,
                lines: 11,
                length: 4
            });
            usSpinnerConfigProvider.setTheme('smallBlack', {
                radius: 3,
                scale: 0.05,
                width: 1,
                lines: 10,
                length: 3
            });
        }])
        .config(['$sceProvider', function ($sceProvider) {
            $sceProvider.enabled(false);
        }])
        .config(['uibDatepickerPopupConfig', function (uibDatepickerPopupConfig) {
            uibDatepickerPopupConfig.appendToBody = true;
            uibDatepickerPopupConfig.showButtonBar = false;
        }])
        .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
            $httpProvider.defaults.transformRequest.unshift(function (data, getHeader) {
                if (getHeader('Content-Type') === 'application/x-www-form-urlencoded;charset=utf-8') {
                    return angular.isObject(data) && String(data) !== '[object File]' ? $.param(data) : data;
                }
                return data;
            });
            $httpProvider.interceptors.push('gkApiInterceptor');
        }])
        .config(['ngDialogProvider', function (ngDialogProvider) {
            ngDialogProvider.setDefaults({
                className: 'gk-dialog',
                closeByDocument: false,
                closeByEscape: true,
            });
        }])
        .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

            $urlRouterProvider.otherwise('/home/file');

            //路由
            $stateProvider
                //主页面
                .state('index', {
                    url: '/',
                    templateUrl: 'views/index.html',
                    resolve: {
                        initData: ['gkChatAction', 'GKChatList', 'GKConfig', 'GKMountList', 'GKEntList', '$q', '$rootScope', function (gkChatAction, GKChatList, GKConfig, GKMountList, GKEntList, $q, $rootScope) {
                            var isDataLoaded = true,
                                defer = $q.defer();
                            if (!GK.isWebFengCloud()) {
                                GK.invoke('gGetNeedloading', {}, function (re) {
                                    isDataLoaded = re == 0 ? true : false;
                                    if (isDataLoaded) {
                                        getInitData();
                                    } else {
                                        $rootScope.$on('LoadFinish', function () {
                                            getInitData();
                                        });
                                    }
                                });
                            } else {
                                if (isDataLoaded) {
                                    getInitData();
                                } else {
                                    $rootScope.$on('LoadFinish', function () {
                                        getInitData();
                                    });
                                }
                            }


                            var asyncData = [
                                GKMountList.list(),
                                GKEntList.list()
                            ];

                            function getInitData() {
                                $q.all(asyncData).then(function (res) {
                                    GK.Log.log('getInitData:mounts:ents', res)
                                    defer.resolve({
                                        mounts: res[0],
                                        ents: res[1],
                                    });
                                });
                            }

                            return defer.promise;
                        }]
                    }
                })
                .state('progress', {
                    url: '/progress?current_file&options',
                    templateUrl: 'views/progress.html',
                    controller: 'progressCtrl'
                })
                .state('index.home', {
                    url: '^/home',
                    templateUrl: 'views/home.html',
                    controller: 'HomeCtrl',
                    resolve: {
                        socketServer: ['$rootScope', '$q', 'gkChatAction', 'chatInit', 'GKChatList', 'getChatServers', 'gkChatSocketListener', 'GKSocket', 'initData', function ($rootScope, $q, gkChatAction, chatInit, GKChatList, getChatServers, gkChatSocketListener, GKSocket, initData) {
                            return getChatServers.get().then(function (res) {
                                GK.Log.log('getChatServers', getChatServers.server);
                                if (GK.isWebFengCloud()) {
                                    GKChatList.items = GKChatList.formatDialogs(gkChatAction('getdialogs')().list);
                                    GK.Log.log('getChatServers:items', GKChatList.items, gkChatAction('getdialogs')().list);
                                    return GKSocket.initSocket().then(function () {
                                        GKSocket.watchNetworkChange();
                                    });
                                } else {
                                    return gkChatAction('getdialogs')().then(function (dialogs) {
                                        GK.Log.log('getChatServers:items', dialogs);
                                        GKChatList.items = GKChatList.formatDialogs(dialogs.list);
                                        GK.Log.log('getChatServers:items', GKChatList.items, dialogs);
                                        return GKSocket.initSocket().then(function () {
                                            GKSocket.watchNetworkChange();
                                        });
                                    });
                                }

                            }).catch(function (rej) {
                                GK.Log.log('socketServer:error', rej);
                                rej ? $rootScope.$broadcast('showError', rej) : $rootScope.$broadcast('showError', '连接服务器失败');
                            })
                        }]
                    }
                })
                .state('index.home.rewrite', {
                    url: '/rewrite?href&params',
                    controller: ['$state', function ($state) {
                        var $stateParams = $state.params;
                        var href = $stateParams.href || 'index';
                        var params = $stateParams.params ? JSON.parse($stateParams.params) : undefined;
                        $state.go(href, params);
                    }]
                })
                //预览
                .state('index.preview', {
                    url: '^/preview?current_file&options',
                    templateUrl: 'views/preview.html',
                    controller: 'PreviewCtrl'
                })
                //设置
                .state('setting', {
                    url: '/setting',
                    templateUrl: 'views/setting/setting.html',
                    controller: 'settingCtrl',
                    resolve: {
                        gkSettingInit: ['GKMountList', function (GKMountList) {
                            return GKMountList.list();
                        }],
                        entList: ['getToken', 'gkEnt', function (getToken, gkEnt) {
                            return getToken.token && gkEnt.getEnt()
                                .then(function (res) {
                                    return res.list;
                                })
                                .catch(function () {
                                    return []
                                });
                        }],
                        userInfo: ['GKAccountApi', '$rootScope', '$q', function (GKAccountApi, $rootScope, $q) {
                            var deferred = $q.defer();
                            if (GK.isWebFengCloud()) {
                                GKAccountApi.getUser()
                                    .then(function (res) {
                                        deferred.resolve(res.data);
                                    })
                                    .catch(function () {
                                        deferred.resolve();
                                    })
                            } else {
                                GK.invoke('gUserInfo', {}, function (res) {
                                    deferred.resolve(res);
                                })
                            }
                            return deferred.promise.then(function (res) {
                                return $rootScope.PAGE_CONFIG.user = res;
                            });
                        }],
                        clientInfos: ['$q', function ($q) {
                            var deferred = $q.defer();
                            if (GK.isWebFengCloud()) {
                                deferred.resolve({})
                            } else {
                                GK.invoke('gGetClientInfo', {}, function (clientInfo) {
                                    deferred.resolve(clientInfo)
                                });
                            }
                            return deferred.promise;
                        }]
                    }
                })
                //账号设置
                .state('setting.account', {
                    url: '/account',
                    templateUrl: 'views/setting/account.html',
                    controller: 'settingAccountCtrl'
                })
                //软件设置
                .state('setting.software', {
                    url: '/software',
                    templateUrl: 'views/setting/software.html',
                    controller: 'softwareSettingCtrl'
                })
                //企业设置
                .state('setting.ent', {
                    url: '/ent?ent_id&ent_name&ent_super_admin',
                    templateUrl: 'views/setting/ent.html',
                    controller: 'entSettingCtrl'
                })
                //同步及备份设置
                .state('setting.sync_backup', {
                    url: '/sync_backup',
                    templateUrl: 'views/setting/sync_backup.html',
                    controller: 'syncBackUpSettingCtrl'
                })
                //传输队列
                .state('queue', {
                    url: '/queue',
                    templateUrl: 'views/queue/queue.html',
                    controller: 'queueCtrl'
                })
                //上传队列
                .state('queue.content', {
                    url: '/:tab',
                    templateUrl: 'views/queue/transfer.html',
                    controller: 'queueListCtrl'
                })
                .state('index.test', {
                    url: '/test',
                    templateUrl: 'views/test.html',
                    controller: 'TestCtrl'
                })
        }])
        .config(['growlProvider', function (growlProvider) {
            growlProvider.globalTimeToLive(3000);
        }])
        .controller('headerCtrl', ['$scope', 'AppPreference', function ($scope, AppPreference) {
            //判断是否是新东方客户端
            $scope.appPreference = AppPreference;
        }])
        .config(['localStorageServiceProvider', function (localStorageServiceProvider) {
            localStorageServiceProvider
                .setPrefix('Yunku');
        }])
        .controller('buttonCtrl', ['getToken', '$timeout', '$rootScope', '$scope', function (getToken, $timeout, $rootScope, $scope) {
            //窗口操作
            $scope.isSelect = getToken.token ? true : false;
            var hideMax = ['setting', 'queue', 'progress', 'regist'];

            if (GK.isWindowsClient()) {
                GK.invoke('gGetWindowSetting', '', function (res) {
                    if (hideMax.indexOf(res.setting) >= 0) {
                        $scope.loginIn = true;
                    }
                })
            }
            $scope.windowBtn = {
                windowMin: function () {
                    GK.invoke('gSetMinWindow');
                },
                windowMax: function (flag) {
                    if (flag) {
                        //窗口最大化
                        GK.invoke('gSetMaxWindow');
                        $scope.isSelect = !$scope.isSelect;
                        $timeout(function () {
                            $rootScope.PAGE_CONFIG.style = false;
                        })
                    } else {
                        //窗口还原
                        GK.invoke('gRestoreWindow');
                        $scope.isSelect = !$scope.isSelect;
                        $timeout(function () {
                            $rootScope.PAGE_CONFIG.style = true;
                        })
                    }
                },
                windowClose: function () {
                    //窗口关闭
                    gkClient.gCloseWindow();
                }
            };

            //窗口拖动还原
            $rootScope.$on('gWindowRestore', function () {
                GK.Log.log('gWindowRestore-窗口拖动还原');
                $scope.isSelect = true;
                $timeout(function () {
                    $rootScope.PAGE_CONFIG.style = true;
                })
            });
            //窗口最大化
            $rootScope.$on('gWindowMaximize', function () {
                $scope.isSelect = false;
                $timeout(function () {
                    $rootScope.PAGE_CONFIG.style = false;
                })
            });
        }])
        .controller('progressCtrl', ['GKFileOpt', '$interval', '$stateParams', '$scope', function (GKFileOpt, $interval, $stateParams, $scope) {
            var options = $stateParams.options ? JSON.parse(decodeURIComponent($stateParams.options)) : null;
            $scope.options = options;
            $scope.value = 0;
            //任务ID
            var index = undefined,
                flag = false;
            GK.invoke('gGetDownloadInfo', options, function (res) {
                index = res.index;
                if (!res.error && res.pos == 100) {
                    if (flag) return;
                    flag = true;
                    $interval.cancel(timer);
                    GKFileOpt.open({
                        mount_id: options.mount_id,
                        webpath: options.webpath,
                        opentype: options.opentype
                    });
                    gkClient.gClose();
                }
                $scope.value = parseInt(res.pos);
                $scope.$apply();
            });


            var timer = $interval(function () {
                GK.invoke('gGetDownloadInfo', options, function (res) {
                    if (!res.error && res.pos == 100) {
                        if (flag) return;
                        flag = true;
                        $interval.cancel(timer);
                        GKFileOpt.open({
                            mount_id: options.mount_id,
                            webpath: options.webpath,
                            opentype: options.opentype
                        });
                        gkClient.gClose();
                    }
                    $scope.value = parseInt(res.pos);
                    $scope.$apply();
                })
            }, 10);

            $scope.close = function () {
                timer && $interval.cancel(timer);
                index && GK.invoke('gDeleteDownload', {
                    list: [{
                        index: index
                    }]
                });
                gkClient.gClose();
            }
        }])
        //外链白名单设置
        .config(['$compileProvider', function ($compileProvider) {
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript|file):/);
        }]);


    angular.element(document).ready(function () {

        GK.getToken(function (res) {
            GK.getApiHost(function (apiHost) {
                GK.getSiteDomain(function (domain) {
                    GK.getConfigInfo(function (getConfigInfo) {
                        gkToken = res;
                        gkApiHost = apiHost;
                        gkDomain = domain;
                        gkConfigInfo = getConfigInfo;
                        try {
                            if (gkConfigInfo && JSON.stringify(gkConfigInfo) !== '{}') {
                                var client_setting = typeof gkConfigInfo['client_setting'] === 'string' ? JSON.parse(gkConfigInfo['client_setting']) : gkConfigInfo['client_setting'];
                                var ui = client_setting['ui'] && typeof client_setting['ui'] === 'string' ? JSON.parse(client_setting['ui']) : client_setting['ui'];

                                !Number(ui.disable_analytic) && mixpanel && mixpanel.init(parseInt(GK.getWebContext('isEnvProduct', true)) ? 'baa9bb70df93ead03f8f642ca2d70c3d' : '4d03a7980dd25cd6b39710b39c1def2b');
                            } else {
                                mixpanel && mixpanel.init(parseInt(GK.getWebContext('isEnvProduct', true)) ? 'baa9bb70df93ead03f8f642ca2d70c3d' : '4d03a7980dd25cd6b39710b39c1def2b');
                            }

                        } catch (e) {
                            GK.Log.log('mixpanel:init:error', e);
                        }

                        if (GK.isClientOS()) {
                            GK.invoke('gGetLanguage', {}, function (lan) {
                                gkLan = lan;
                                GK.Log.log('document', 'ready');
                                angular.bootstrap(document, ['Yunku']);
                                GK.Log.log('angular', 'bootstraped');
                            });
                        } else {
                            GK.Log.log('document', 'ready');
                            angular.bootstrap(document, ['Yunku']);
                            GK.Log.log('angular', 'bootstraped');
                        }
                    })
                })
            })
        });


        (function () {

            //客户端回调的自定义方法
            var eventCallback = function (name, param) {
                if (!name) {
                    return;
                }
                var rootScope, JSONparam;
                try {
                    rootScope = angular.element(document).injector().get('$rootScope');
                    if (param) {
                        JSONparam = typeof param === 'string' ? JSON.parse(param) : param;
                    }
                    GK.Log.log('gkClientCallback:broadcasting:' + name, JSONparam);
                    rootScope && rootScope.$broadcast(name, JSONparam);
                } catch (e) {
                    GK.Log.log('gkClientCallback:error:' + name, e);
                }
            };

            var events = [
                'LoginResult',
                'ShowAction',
                'AddOrgObject', //新增库
                'RemoveOrgObject', //删除库
                'EditOrgObject', //更改库
                'LinkStatus', //网络状态变化
                'UpdateFileInfo', //文件信息更新
                'UpdateFileList', //更新文件列表
                'gLastUpdateDateline', //库更新列表的最后更新时间
                'OpenMountPath', //打开某个文件路径
                'SetDropFiles', //拖拽的文件
                'TransferState', //传输队列状态变化
                'LoadFinish', //客户端数据加载完成
                'UpdateScreenshot', //截屏图片下载成功
                'OpenFileFinish', //文件打开时下载完成
                'gUpdateShortcuts', //置顶更新
                'gHaveShortcuts', //有截屏数据
                'UpgradeClient', //客户端更新的消息,
                'AddEntObject', //新增企业
                'RemoveEntObject', //删除企业
                'EditEntObject', //修改企业
                'ShowLockScreenDialog', //打开锁屏对话框
                'gReceiveMessage', //设置通知
                'gCloseWindow', //窗口关闭事件
                'gWindowRestore', //窗口还原事件
                'gWindowMaximize', //窗口全屏事件,
                'gChangeDownload', //下载进度通知
                'gChangeUpload', //上传进度通知
                'ShowUserInfoDialog', //显示个人设置页面
                'QuitNotice', //退出
                'StartLogin', //第三方登录
                'gCompareNotifyReset', //notify重连
                'PostMessage', //监听其他窗口发送的内容
                'LogoutNotice', //注销
            ];

            $.each(events, function (key, eventName) {
                $(document).off(eventName);
                $(document).on(eventName, function (jqEvent) {
                    GK.Log.log('eventName:' + eventName);
                    var event = jqEvent.originalEvent;
                    GK.Log.log('CustomEventFired:' + event.type, event.detail);
                    if (eventName === 'TransferState') {
                        localStorage.setItem('TransferState', event.detail.state);
                    }
                    eventCallback(event.type, event.detail);
                });

            });

            /**
             * 网站的回调
             * @param name
             * @param params
             */
            var gkSiteCallback = function (name, params) {
                eventCallback(name, params);
            };

            var gkFrameCallback = function (name, params) {
                if (typeof name !== 'string') {
                    name = String(name);
                }
                var rootScope = angular.element(document).injector().get('$rootScope');
                if (!rootScope) return;
                if (arguments.length > 2) {
                    rootScope.$broadcast.apply(rootScope, arguments);
                } else {
                    rootScope.$broadcast(name, params);
                }
            };

            window.gkSiteCallback = gkSiteCallback;
            //上传完成后刷新文件列表
            window.gkSiteCallback.UpdateFileList = function () {
                eventCallback('UpdateFileList');
            };

            window.gkFrameCallback = gkFrameCallback;

        })();

        //模拟调试方法，避免IE报错
        var method;
        var noop = function () {};
        var methods = [
            'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
            'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
            'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
            'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
        ];
        var length = methods.length;
        var console = (window.console = window.console || {});

        while (length--) {
            method = methods[length];

            // Only stub undefined methods.
            if (!console[method]) {
                console[method] = noop;
            }
        }

    });

})(window, window.angular)