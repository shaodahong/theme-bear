;(function (window, Util) {
    'use strict';
    var getUserAgent = function () {
        return navigator.userAgent.split(';')
    };

    var getClientOS = function () {
        return (getUserAgent()[2] || '').toLowerCase();
    };

    function getName() {
        this.a = 11;
        this.b = '你好';
    }

    var abc = new getName();
    var a = {
        a: 1,
        b: 2,
        c: '你好中国'
    }

    var time = new Date();

    var arr = new Array();

    module.exports = GK;

    for (var i = 0; i < arr.length; i++) {
        
    }

    var GK = {
        /**
         * @description 请求客户端接口
         * @param {string} name  接口名称
         * @param {object} param 请求参数
         * @param {fn} callback 回调函数
         */
        invoke: function (name, param, other, callback) {
            if (typeof gkClient === 'undefined') {
                throw new Error('Can not find gkClient');
            }
            if (typeof gkClient[name] !== 'function') {
                throw new Error('Can not find interface ' + name);
            }

            var args = [], needJSONEncode = true;
            if (typeof param !== 'undefined') {
                if (['gSetClipboardDataHtml', 'gSetClipboardData', 'gDialogAction'].indexOf(name) >= 0) {
                    needJSONEncode = false;
                }
                args.push(needJSONEncode ? JSON.stringify(param) : param);
            }
            var invokeArgs = Array.prototype.slice.apply(arguments);
            if (name !== 'gDialogAction') {
                GK.Log.log(name + ':params', invokeArgs);
            }

            switch (invokeArgs.length) {
                case 3:
                    if (typeof other === 'function') {
                        args.push(function (re) {
                            re = re && typeof re === 'string' ? JSON.parse(re) : re;
                            GK.Log.log(name + ':callback', re);
                            other(re);
                        });
                    } else {
                        args.push(typeof other === 'string' ? other : JSON.stringify(other));
                    }
                    break;
                case 4:
                    args.push(typeof other === 'string' ? other : JSON.stringify(other));
                    args.push(function (re) {
                        re = re && typeof re === 'string' ? JSON.parse(re) : re;
                        callback(re);
                    });
                    break;
            }


            //mac版不能使用apply方法
            if (!this.isMacClient()) {
                gkClient[name].apply(this, args);
            } else {
                switch (args.length) {
                    case 0:
                        gkClient[name]();
                        break;
                    case 1:
                        gkClient[name](args[0]);
                        break;
                    case 2:
                        gkClient[name](args[0], args[1]);
                        break;
                    case 3:
                        gkClient[name](args[0], args[1], args[2]);
                        break;
                }
            }
        },
        getApiAuthorization: function (params, callback) {
            var _self = this;
            if (!this.isFuncAvaiable('gGetApiAuthorization')) {
                _self.isFunc(callback) && callback('');
                return;
            }
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    params[key] = String(params[key]);
                }
            }
            ;
            this.invoke('gGetApiAuthorization', params, function (re) {
                _self.isFunc(callback) && callback(re.sign);
            });
        },
        dispatchEvent: function (eventType, eventName, param, callback, log) {
            if (typeof gkClient === 'undefined') {
                throw new Error('Can not find gkClient');
            }
            if (typeof gkClient[eventType] !== 'function') {
                throw new Error('Can not find event interface ' + eventType);
            }
            var args = Array.prototype.slice.call(arguments, 1, 4);
            if (typeof param !== 'undefined') {
                args.splice(1, 1, JSON.stringify(param));
            }
            if (typeof callback === 'function') {
                args.splice(2, 1, function (re) {
                    GK.Log.log(eventType + ':' + eventName + ':callback:return', re);
                    re = !re ? '' : typeof re === 'object' ? re : JSON.parse(re);
                    callback(re);
                });
            }
            var re;
            //mac版不能使用apply方法
            GK.Log.log(eventType + ':' + eventName + ':param', args);
            if (!GK.isMacClient()) {
                re = gkClient[eventType].apply(this, args);
            } else {
                switch (args.length) {
                    case 0:
                        re = gkClient[eventType]();
                        break;
                    case 1:
                        re = gkClient[eventType](args[0]);
                        break;
                    case 2:
                        re = gkClient[eventType](args[0], args[1]);
                        break;
                    case 3:
                        re = gkClient[eventType](args[0], args[1], args[2]);
                        break;
                }
            }
            GK.Log.log(eventType + ':' + eventName + ':return', re);
            re = !re ? '' : re.indexOf('{') >= 0 && re.indexOf('}') >= 0 ? JSON.parse(re) : re;
            return re;
        },
        openDialog: function (params, callback) {
            var _self = this;
            this.invoke('gGetUIPath', {}, function (res) {
                angular.extend(params, {
                    url: 'file:///' + res.uiPath + '/index.html#' + params.url
                });
                _self.invoke('gMain', params, callback);
            });
        },
        /**
         * 是否是windows客户端
         * @returns {boolean}
         */
        isWindowsClient: function () {
            return getClientOS() === 'windows';
        },
        /**
         * 是否是Mac客户端
         * @returns {boolean}
         */
        isMacClient: function () {
            return getClientOS() === 'mac';
        },
        getClientOS: getClientOS,
        /**
         * 是否是windows或者mac客户端
         * @returns {*|boolean}
         */
        isClientOS: function () {
            return this.isWindowsClient() || this.isMacClient();
        },
        _handleException: function (e) {
            throw new Error(e.name + ":" + e.message);
        },
        isMacOS: function () {
            return navigator.userAgent.toLowerCase().indexOf('mac') >= 0;
        },
        /**
         * 是否是web版
         * @returns {boolean}
         */
        isWebFengCloud: function () {
            return !this.isGKSyncClient();
        },
        /**
         * 检测的接口是否在客户端可用
         * @param func
         * @returns {boolean}
         */
        isFuncAvaiable: function (func) {
            return typeof gkClient !== 'undefined' && typeof gkClient[func] !== 'undefined';
        },
        /**
         * 获取软件的版本
         * @returns {string}
         */
        getClientVersion: function () {
            return (getUserAgent()[1] || '').toLowerCase();
        },
        /**
         * 是否同步客户端
         * @returns {boolean}
         */
        isGKSyncClient: function () {
            var sync = getUserAgent()[0] || '';
            return sync.toLowerCase() == 'gk_sync';
        },
        /**
         * 获取配置文件的版本号
         * @returns {*}
         */
        getConfigVersion: function (callback) {
            var _self = this;
            this.getConfigInfo(function (configInfo) {
                if (!configInfo || !configInfo.property || !$.isNumeric(configInfo.property.version)) {
                    _self.isFunc(callback) && callback(0);
                    return;
                }
                _self.isFunc(callback) && callback(parseInt(configInfo.property.version));
            });

        },
        /**
         * 获取配置的属性
         * @returns {*}
         */
        getConfigProperty: function (callback) {
            var _self = this;
            this.getConfigInfo(function (configInfo) {
                if (!configInfo || !configInfo.property) {
                    _self.isFunc(callback) && callback(null);
                    return;
                }
                _self.isFunc(callback) && callback(configInfo.property);
            });

        },
        /**
         * 获取web版相关信息
         * @param key
         * @param isTop
         * @returns {*}
         */
        getWebContext: function (key, isTop) {
            if (!WEB_CONSTANT) return;
            if (!isTop) {
                if (key && key.length > 0) {
                    return WEB_CONSTANT[key];
                } else {
                    return WEB_CONSTANT;
                }
            } else {
                var webConstant = {};
                try {
                    webConstant = window.WEB_CONSTANT ? window.WEB_CONSTANT : window.parent.WEB_CONSTANT ? window.parent.WEB_CONSTANT : window.top.WEB_CONSTANT;
                } catch (e) {
                    webConstant = {};
                }

                if (key && key.length > 0) {
                    return webConstant[key];
                } else {
                    return webConstant;
                }
            }
        },
        /**
         * 设置web版相关信息
         * @param key
         * @param value
         * @param isTop
         */
        setWebContext: function (key, value, isTop) {
            if (!key) return;
            if (!isTop) {
                WEB_CONSTANT[key] = value;
            } else {
                var webConstant = {};
                try {
                    webConstant = window.WEB_CONSTANT ? window.WEB_CONSTANT : window.parent.WEB_CONSTANT ? window.parent.WEB_CONSTANT : window.top.WEB_CONSTANT;
                } catch (e) {
                    webConstant = {};
                }
                webConstant[key] = value;
            }
        },
        /**
         * 获取网站域名
         * @returns {*}
         */
        getSiteDomain: function (callback) {
            var _self = this;
            if (!this.isFuncAvaiable('gSiteDomain')) {
                if (this.isWebFengCloud()) {
                    this.isFunc(callback) && callback(location.protocol + '//' + this.getWebContext('siteDomain', true));
                } else {
                    this.isFunc(callback) && callback(location.protocol + '//www.gokuai.com');
                }
                return;
            }
            this.invoke('gSiteDomain', {}, function (re) {
                _self.isFunc(callback) && callback(re.domain);
            });
        },
        /**
         * 获取配置信息
         * @returns {*}
         */
        getConfigInfo: function (callback) {
            var _self = this;
            if (!this.isFuncAvaiable('gConfigInfo')) {
                if (this.isWebFengCloud()) {
                    var source = this.getWebContext('source', true);
                    if (source) {
                        var setting = this.getWebContext('source_setting', true);
                        if (!setting) setting = {};
                        setting.source = source;
                        setting.title = '';
                        if (setting['site_name']) {
                            setting.title = setting['site_name'];
                        } else if (setting['client_setting']) {
                            var clientSetting = JSON.parse(setting['client_setting']);
                            setting.title = clientSetting['site_name'] || '';
                        }
                        _self.isFunc(callback) && callback(setting);
                        return;
                    }
                    _self.isFunc(callback) && callback(null);
                    return;
                }
                _self.isFunc(callback) && callback(null);
                return;
            }
            this.invoke('gConfigInfo', {}, function (info) {
                _self.isFunc(callback) && callback(!info || info == '{}' ? null : info);
            });

        },
        getLanguageKey: function (key) {
            var languageObj = ['zh_cn', 'en_US', 'zh_tw'];
            return languageObj[key - 1];
        },
        getUrl: function (params, callback) {
            var _self = this;
            if (!this.isFuncAvaiable('gGetUrl')) {
                this.isFunc(callback) && callback(params.url);
                return;
            }
            this.invoke('gGetUrl', params, function (url) {
                var url = url.weburl;
                _self.invoke('gGetLanguage', {}, function (clientLanType) {
                    var language = _self.getLanguageKey(clientLanType.type);
                    if (url.indexOf('?') >= 0) {
                        url += '&hl=' + language;
                    } else {
                        url += '?hl=' + language;
                    }
                    _self.isFunc(callback) && callback(url);
                });
            });
        },
        openUrl: function (url) {
            try {
                if (!this.isFuncAvaiable('gOpenUrl')) {
                    window.open(url, '_blank');
                } else {
                    this.invoke('gOpenUrl', {
                        url: url
                    });
                }
            } catch (e) {
                this._handleException(e);
            }
        },
        quit: function () {
            try {
                if (!this.isFuncAvaiable('gQuit')) {
                    this.logOff();
                } else {
                    this.invoke('gQuit')
                }
            } catch (e) {
                this._handleException(e);
            }
        },
        logOff: function (param) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gLogoff')) {
                    if (this.isWebFengCloud()) {
                        this.getConfigInfo(function (info) {
                            var configInfo = info;
                            if (configInfo && configInfo['source'] == 'shonline') {
                                _self.getSiteDomain(function (domain) {
                                    window.top.location = domain + '/account/logout';
                                });
                            } else {
                                window.top.location = '/logout';
                            }
                        });

                    }
                } else {
                    if (!param) {
                        this.invoke('gLogoff');
                    } else {
                        this.invoke('gLogoff', param);
                    }
                }

            } catch (e) {
                this._handleException(e);
            }
        },
        getUser: function (callback) {
            var _self = this;
            if (!this.isFuncAvaiable('gUserInfo')) {
                if (this.isWebFengCloud()) {
                    this.isFunc(callback) && callback(this.getWebContext('user', true));
                } else {
                    this.isFunc(callback) && callback({});
                }
                return;
            } else {
                this.invoke('gUserInfo', {}, function (gUserInfo) {
                    _self.isFunc(callback) && callback(gUserInfo);
                });
            }

        },
        getUIPath: function (callback) {
            var _self = this;
            if (!this.isFuncAvaiable('gGetUIPath')) {
                _self.isFunc(callback) && callback('');
                return;
            }
            this.invoke('gGetUIPath', {}, function (gGetUIPath) {
                _self.isFunc(callback) && callback(gGetUIPath.uiPath);
            });
        },
        getNetworkStatus: function (callback) {
            var _self = this;
            if (!this.isFuncAvaiable('gGetNetworkStatus')) {
                _self.isFunc(callback) && callback(1);
                return;
            }
            this.invoke('gGetNetworkStatus', {}, function (network) {
                _self.isFunc(callback) && callback(network);
            });
        },
        selectPath: function (params, callback) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gSelectPathDlg')) {
                    _self.isFunc(callback) && callback('');
                    return;
                }
                var req;
                if (typeof params === 'undefined') {
                    req = {};
                } else {
                    req = params;
                }
                this.invoke('gSelectPathDlg', req, function (res) {
                    _self.isFunc(callback) && callback(res);
                });
            } catch (e) {
                this._handleException(e);
            }
        },
        addFileDialog: function (param, callback) {
            var _self = this;
            try {
                if (this.isWebFengCloud()) {
                    GK.getSiteDomain(function (domain) {
                        var options = {
                            url: '/mount/upload',
                            params: {
                                stopCallback: 'gkSiteCallback.UpdateFileList',
                                redirectURL: domain + '/index/upload_cb?',
                                uploadParams: encodeURIComponent(JSON.stringify({
                                    member_id: _self.getWebContext('user', true).member_id,
                                    path: param.fullpath,
                                    mount_id: param.mount_id,
                                    filefield: 'file'
                                })),
                                fullpath: param.fullpath,
                                mount_id: param.mount_id,
                                from: "web_fengcloud"
                            }
                        };
                        var opts = $.extend(true, {}, $.fn.gkUpload.defaults, options);
                        var params = $.param(opts.params);
                        var url = opts.url + '?' + params;
                        $.fn.gkUpload.open(url, opts.width, opts.height, opts.name);
                    });
                } else {
                    this.invoke('gAddFileDlg', param, function (re) {
                        _self.isFunc(callback) && callback(re)
                    });
                }

            } catch (e) {
                this._handleException(e);
            }
        },
        open: function (params, callback) {
            try {
                if (!this.isFuncAvaiable('gOpen')) {
                    var url = '/down?mount_id=' + params.mountid + '&file=' + encodeURIComponent(params.webpath);
                    if (params.hid) {
                        url += '&hid=' + params.hid;
                    }
                    if (this.isWebFengCloud()) {
                        var ext = Util.String.getExt(Util.String.baseName(params.webpath));
                        if (ext == 'gknote') {
                            var queryString = jQuery.param({
                                'fullpath': params.webpath,
                                'mount_id': params.mount_id
                            });
                            if (params.win) {
                                params.win.location = '/web/note?' + queryString;
                            } else {
                                window.open('/web/note?' + queryString);
                            }
                        } else {
                            var iframe = $('<iframe src="' + url + '" style="display:none" />').appendTo($('body'));
                            setTimeout(function () {
                                iframe.remove();
                            }, 10000);
                        }
                    }
                } else {
                    if (!params.opentype) {
                        params.opentype = 'open';
                    }
                    this.invoke('gOpen', params, function (res) {
                        callback && callback(res)
                    });
                }

            } catch (e) {
                this._handleException(e);
            }
        },
        copy: function (params, callback) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gCopy')) {
                    if (this.isWebFengCloud()) {
                        var fullpaths = [];
                        $.each(params.list, function (i, v) {
                            fullpaths.push(v.webpath);
                        });
                        this.getApiHost(function (getApiHost) {
                            jQuery.ajax({
                                type: 'POST',
                                url: getApiHost + '/1/file/copy',
                                dataType: 'json',
                                data: {
                                    mount_id: params.frommountid,
                                    fullpaths: fullpaths.join('|'),
                                    target_mount_id: params.targetmountid,
                                    target_fullpath: params.target
                                },
                                success: function (data) {
                                    _self.isFunc(callback) && callback(data);
                                },
                                error: function (request, textStatus, errorThrown) {
                                    var error = _self.getAjaxError(request, textStatus, errorThrown);
                                    _self.isFunc(callback) && callback({
                                        error: 1,
                                        message: error.msg
                                    });
                                }
                            });
                        });

                    }
                } else {
                    this.invoke('gCopy', params, function (re) {
                        _self.isFunc(callback) && callback(re);
                    });
                }
            } catch (e) {
                this._handleException(e);
            }
        },
        getApiHost: function (callback) {
            var _self = this;
            if (this.isWebFengCloud()) {
                _self.isFunc(callback) && callback('/fengcloud');
            } else {
                this.invoke('gApiHost', {}, function (re) {
                    _self.isFunc(callback) && callback(re.host);
                });
            }
        },
        move: function (params, callback) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gMove')) {
                    var fullpaths = [];
                    $.each(params.list, function (i, v) {
                        fullpaths.push(v.webpath);
                    });
                    this.getApiHost(function (getApiHost) {
                        jQuery.ajax({
                            type: 'POST',
                            url: getApiHost + '/1/file/move',
                            dataType: 'json',
                            data: {
                                mount_id: params.frommountid,
                                fullpaths: fullpaths.join('|'),
                                target_mount_id: params.targetmountid,
                                target_fullpath: params.target
                            },
                            success: function (data) {
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });
                            }
                        });
                    });
                } else {
                    this.invoke('gMove', params, function (re) {
                        _self.isFunc(callback) && callback(re);
                    });
                }

            } catch (e) {
                this._handleException(e);
            }
        },
        isFunc: function (func) {
            return typeof func === 'function';
        },
        getAjaxError: function (request, textStatus, errorThrown) {
            var error = {
                code: 0,
                msg: '出错了'
            };
            if (request.responseText) {
                var result = JSON.parse(request.responseText);
                jQuery.extend(error, {
                    code: result.error_code,
                    msg: result.error_msg || request.responseText
                })
            } else {
                error.code = request.status;
                if (textStatus === 'timeout') {
                    error.msg = '网络连接超时';
                } else {
                    switch (request.status) {
                        case 0:
                        case 404:
                            error.msg = '网络未连接或当前网络不支持HTTPS安全连接，请在“设置”中关闭HTTPS安全连接后重试';
                            break;
                        case 401:
                            error.msg = '网络连接超时或当前网络不支持HTTPS安全连接，请在“设置”中关闭HTTPS安全连接后重试';
                            break;
                        case 501:
                        case 502:
                            error.msg = '服务器繁忙, 请稍候重试';
                            break;
                        case 503:
                        case 504:
                            error.msg = '因您的操作太过频繁, 操作已被取消';
                            break;
                        default:
                            error.msg = request.statusText;
                            break;
                    }
                }
            }
            return error;
        },
        getToken: function (callback) {
            var _self = this;
            if (this.isWebFengCloud()) {
                _self.isFunc(callback) && callback(this.getWebContext('user', true).token);
                return;
            }

            this.invoke('gGetToken', {}, function (re) {
                _self.isFunc(callback) && callback(re.token);
            });
        },
        /**
         * 获取文件信息
         * @param params
         * @returns {*}
         */
        getFileInfo: function (fileObj, callback) {
            var _self = this;
            try {
                if (this.isWebFengCloud()) {
                    fileObj.mount_id = fileObj.mount_id;
                    fileObj.fullpath = fileObj.path || fileObj.webpath;
                    this.isFunc(callback) && callback(fileObj)
                    return;
                } else {
                    if (!this.isFuncAvaiable('gGetFileInfo')) {
                        this.isFunc(callback) && callback({})
                        return;
                    }
                    var params = {};
                    if (!fileObj.hash && !fileObj.uuidhash) {
                        params = {
                            mount_id: Number(fileObj.mount_id),
                            webpath: fileObj.webpath
                        }
                    } else {
                        params = {
                            mount_id: Number(fileObj.mountid),
                            uuidhash: fileObj.hash || fileObj.uuidhash
                        }
                    }
                    this.invoke('gGetFileInfo', params, function (fileObject) {
                        if (fileObject && (fileObject.filehash || fileObject.hash)) {
                            jQuery.extend(fileObject, {
                                mount_id: params.mountid
                            });
                        }
                        _self.isFunc(callback) && callback(fileObject)
                    });

                }
            } catch (e) {
                this._handleException(e);
            }

        },
        recover: function (params, callback) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gRecover')) {
                    if (this.isWebFengCloud()) {
                        var fullpaths = [];
                        $.each(params.list, function (i, v) {
                            fullpaths.push(v.webpath);
                        });
                        this.getApiHost(function (getApiHost) {
                            jQuery.ajax({
                                type: 'POST',
                                url: getApiHost + '/1/file/recover',
                                dataType: 'json',
                                data: {
                                    mount_id: params.mount_id,
                                    fullpaths: fullpaths.join('|')
                                },
                                success: function (data) {
                                    _self.isFunc(callback) && callback(data);
                                },
                                error: function (request, textStatus, errorThrown) {
                                    var error = _self.getAjaxError(request, textStatus, errorThrown);
                                    _self.isFunc(callback) && callback({
                                        error: 1,
                                        message: error.msg
                                    });
                                }
                            });
                        });

                    } else {
                        return;
                    }
                } else {
                    this.invoke('gRecover', params, function (re) {
                        _self.isFunc(callback) && callback(re);
                    });
                }

            } catch (e) {
                this._handleException(e);
            }
        },
        notice: function (params, callback) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gNotice')) {
                    if (this.isWebFengCloud()) {
                        _self.getApiHost(function (host) {
                            switch (params.type) {
                                case 'getOrg':
                                    jQuery.ajax({
                                        type: 'GET',
                                        url: host + '/1/account/mount',
                                        dataType: 'json',
                                        data: {
                                            org_id: params.org_id
                                        },
                                        success: function (data) {
                                            if (data && data.list && data.list[0]) {
                                                if (typeof WEB_CONSTANT !== 'undefined') {
                                                    if (typeof WEB_CONSTANT.mount === 'undefined') {
                                                        WEB_CONSTANT.mount = {list: []};
                                                    }
                                                    if (!$.isArray(WEB_CONSTANT.mount.list)) {
                                                        WEB_CONSTANT.mount.list = [];
                                                    }
                                                    WEB_CONSTANT.mount.list.push(data.list[0]);
                                                }
                                                _self.isFunc(callback) && callback(data.list[0]);
                                            }
                                        },
                                        error: function (request, textStatus, errorThrown) {
                                            var error = _self.getAjaxError(request, textStatus, errorThrown);
                                            _self.isFunc(callback) && callback({
                                                error: 1,
                                                message: error.msg
                                            });
                                        }
                                    });
                                    break;
                                default :
                                    _self.isFunc(callback) && callback({});
                                    break;
                            }
                        })

                    }
                } else {
                    this.invoke('gNotice', params, function (re) {
                        _self.isFunc(callback) && callback(re);
                    });
                }
            } catch (e) {
                this._handleException(e);
            }
        },
        createFolder: function (params, callback) {
            var _self = this;
            try {
                if (this.isWebFengCloud()) {
                    var param = {
                        mount_id: params.mount_id,
                        fullpath: params.webpath,
                        exist_throw: 1
                    };
                    this.getApiHost(function (getApiHost) {
                        var requestUrl = getApiHost + '/2/file/create_folder';
                        if (params.dir == 0) {
                            requestUrl = getApiHost + '/2/file/create_file';
                            jQuery.extend(param, {
                                filehash: params.filehash,
                                filesize: params.filesize
                            });
                        }
                        jQuery.ajax({
                            type: 'POST',
                            url: requestUrl,
                            dataType: 'json',
                            data: param,
                            success: function (data) {
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });
                            }
                        });
                    });

                } else {
                    this.invoke('gNewFile', params, function (re) {
                        _self.isFunc(callback) && callback(re);
                    });
                }

            } catch (e) {
                this._handleException(e);
            }
        },
        toggleLock: function (params, callback) {
            try {
                var _self = this;
                if (!this.isFuncAvaiable('gLock')) {
                    if (this.isWebFengCloud()) {
                        _self.getApiHost(function (getApiHost) {
                            jQuery.ajax({
                                type: 'POST',
                                url: getApiHost + '/1/file/lock',
                                dataType: 'json',
                                data: {
                                    mount_id: params.mount_id,
                                    fullpath: params.webpath,
                                    lock: params.status ? 'lock' : 'unlock'
                                },
                                success: function (data) {
                                    _self.isFunc(callback) && callback(data);
                                },
                                error: function (request, textStatus, errorThrown) {
                                    var error = _self.getAjaxError(request, textStatus, errorThrown);
                                    _self.isFunc(callback) && callback({
                                        error: 1,
                                        message: error.msg
                                    });
                                }
                            });
                        });

                    } else {
                        return;
                    }
                } else {
                    this.invoke('gLock', params, function (re) {
                        _self.isFunc(callback) && callback(re);
                    });
                }

            } catch (e) {
                this._handleException(e);
            }
        },
        saveToLocal: function (params, callback) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gSaveToLocal')) {
                    var list = params.list;
                    if (list.length == 1 && (!list[0].dir || list[0].dir == 0)) {
                        var _url = '/down?mount_id=' + list[0].mount_id + '&hash=' + encodeURIComponent(list[0].hash);
                        if (params.hid) {
                            _url += '&hid=' + params.hid;
                        }
                        location.href = _url;
                    } else {
                        var dir = 0;
                        if (list.length == 1 && list[0].dir == 1) {
                            dir = 1;
                        }
                        var mount_id = 0, fullpaths = [];
                        $.each(list, function (i, v) {
                            if (!mount_id) mount_id = v.mount_id;
                            if (v.mount_id == mount_id) {
                                fullpaths.push(v.dir == 1 ? v.webpath + '/' : v.webpath);
                            }
                        });
                        jQuery.ajax({
                            type: 'POST',
                            url: '/mount/zip_list',
                            dataType: 'json',
                            data: {
                                mount_id: mount_id,
                                fullpaths: fullpaths,
                                dir: dir
                            },
                            success: function (data) {
                                var action = data.server + '/' + data.filename;
                                var form = $('<form style="display:none;" method="post" action="' + action + '">'
                                    + '<input type="hidden" name="list" value="' + encodeURIComponent(data.list) + '" >'
                                    + '</form>');
                                $('body').append(form);
                                form.submit();
                                form.remove();
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });

                            }
                        });
                    }
                } else {
                    this.invoke('gSaveToLocal', params, function (re) {
                        _self.isFunc(callback) && callback(re);
                    });
                }

            } catch (e) {
                this._handleException(e);
            }
        },
        del: function (params, callback) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gDelete')) {
                    var fullpaths = [];
                    $.each(params.list, function (i, v) {
                        fullpaths.push(v.webpath);
                    });
                    this.getApiHost(function (getApiHost) {
                        jQuery.ajax({
                            type: 'POST',
                            url: getApiHost + '/1/file/del',
                            dataType: 'json',
                            data: {
                                mount_id: params.mount_id,
                                fullpaths: fullpaths.join('|')
                            },
                            success: function (data) {
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });
                            }
                        });
                    });

                } else {
                    this.invoke('gDelete', params, function (re) {
                        _self.isFunc(callback) && callback(re);
                    });
                }

            } catch (e) {
                this._handleException(e);
            }
        },
        rename: function (params, callback) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gRename')) {
                    this.getApiHost(function (getApiHost) {
                        jQuery.ajax({
                            type: 'POST',
                            url: getApiHost + '/1/file/rename',
                            dataType: 'json',
                            data: {
                                mount_id: params.mount_id,
                                fullpath: params.oldpath,
                                newname: Util.String.baseName(params.newpath)
                            },
                            success: function (data) {
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });
                            }
                        });
                    });

                } else {
                    this.invoke('gRename', params, function (re) {
                        _self.isFunc(callback) && callback(re);
                    });
                }
            } catch (e) {
                this._handleException(e);
            }
        },
        getRestHost: function (callback) {
            var _self = this;
            try {
                if (!this.isFuncAvaiable('gRestHost')) {
                    _self.isFunc(callback) && callback('');
                    return;
                }
                this.invoke('gRestHost', {}, function (re) {
                    _self.isFunc(callback) && callback(re);
                })
            } catch (e) {
                this._handleException(e);
            }
        },
        getFileTpls: function (param, callback) {
            var _self = this;
            if (!this.isFuncAvaiable('gFileTemplate')) {
                if (this.isWebFengCloud()) {
                    var tpls = this.getWebContext('tpls', true);
                    if (!tpls || !tpls[param.ent_id]) {
                        _self.isFunc(callback) && callback({
                            'temps': []
                        });
                        return;
                    }
                    _self.isFunc(callback) && callback({
                        'temps': tpls[param.ent_id]
                    });
                }
            } else {
                this.invoke('gFileTemplate', param, function (re) {
                    _self.isFunc(callback) && callback(re);
                });
            }
        },
        createCollectionFolder: function (params, callback) {
            var _self = this;
            this.getToken(function (token) {
                $.extend(params, {
                    token: token
                });
                _self.getApiAuthorization(params, function (sign) {
                    params.sign = sign;
                    _self.getApiHost(function (getApiHost) {
                        jQuery.ajax({
                            type: 'POST',
                            url: getApiHost + '/1/collection/create_folder',
                            dataType: 'json',
                            data: params,
                            success: function (data) {
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });
                            }

                        });
                    });

                });
            });
        },
        dateline_modify_set: function (params, callback) {
            var _self = this;
            this.getToken(function (token) {
                $.extend(params, {
                    token: token
                });
                _self.getApiAuthorization(params, function (sign) {
                    params.sign = sign;
                    _self.getApiHost(function (getApiHost) {
                        jQuery.ajax({
                            type: 'POST',
                            url: getApiHost + '/1/collection/set_file',
                            dataType: 'json',
                            data: params,
                            success: function (data) {
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });
                            }

                        });
                    });

                });
            });
        },
        dateline_modify_get: function (params, callback) {
            var _self = this;
            this.getToken(function (token) {
                $.extend(params, {
                    token: token
                });
                _self.getApiAuthorization(params, function (sign) {
                    params.sign = sign;
                    _self.getApiHost(function (getApiHost) {
                        jQuery.ajax({
                            type: 'GET',
                            url: getApiHost + '/1/collection/get_file_setting',
                            dataType: 'json',
                            data: params,
                            success: function (data) {
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });
                            }
                        });
                    });

                });
            });
        },
        createPublicFolder: function (params, callback) {
            var _self = this;
            this.getToken(function (token) {
                $.extend(params, {
                    token: token
                });
                _self.getApiAuthorization(params, function (sign) {
                    params.sign = sign;
                    _self.getApiHost(function (getApiHost) {
                        jQuery.ajax({
                            type: 'POST',
                            url: getApiHost + '/1/collection/create_folder',
                            dataType: 'json',
                            data: params,
                            success: function (data) {
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });
                            }
                        });
                    });
                })
            });
        },
        revert: function (params, callback) {
            var _self = this;
            if (!this.isFuncAvaiable('gRevert')) {
                if (this.isWebFengCloud()) {
                    this.getApiHost(function (getApiHost) {
                        jQuery.ajax({
                            type: 'POST',
                            url: getApiHost + '/2/file/revert',
                            dataType: 'json',
                            data: {
                                mount_id: params.mount_id,
                                fullpath: params.fullpath ? params.fullpath : params.webpath,
                                hid: params.hid
                            },
                            success: function (data) {
                                _self.isFunc(callback) && callback(data);
                            },
                            error: function (request, textStatus, errorThrown) {
                                var error = _self.getAjaxError(request, textStatus, errorThrown);
                                _self.isFunc(callback) && callback({
                                    error: 1,
                                    message: error.msg
                                });
                            }
                        });
                    });
                } else {
                    return;
                }
            } else {
                this.invoke('gRevert', params, function (re) {
                    _self.isFunc(callback) && callback(re);
                });
            }
        }
    };

    //打印日志
    GK.Log = {
        _log: function (name, color, info) {

            var getLogTime = function () {
                return Util.Date.format(new Date(), 'yyyy-MM-dd hh:mm:ss:S');
            };

            var getPageName = function () {
                if (window.location) {
                    return Util.String.baseName(window.location.pathname);
                }
                return null;
            };

            if (window.localStorage && window.localStorage.getItem('enableGKLog') == 1) {
                var args = Array.prototype.slice.call(arguments, 0);
                args[0] = '%c [' + getLogTime() + '][' + args[0] + ']';
                if (typeof(console) !== 'undefined' && typeof(console.log) === 'function') {
                    console.log.apply(console, args);
                }
            }
            if (window.localStorage && (!window.localStorage.getItem('disableGKWriteLog') || window.localStorage.getItem('disableGKWriteLog') == 0)) {
                try {
                    args.splice(0, 2);
                    if (typeof gkClient !== 'undefined') {
                        gkClient.gLog('[UI:' + window.appVersion + ']' + '[' + getPageName() + '][' + name + ']' + (args.length ? JSON.stringify(args) : ''));
                    }
                } catch (e) {

                }
            }
        },
        log: function () {
            if (!arguments.length) {
                return;
            }
            var args = Array.prototype.slice.call(arguments, 0);
            args.splice(1, 0, 'background:blue;color:white');
            this._log.apply(this, args);
        },
        error: function () {
            if (!arguments.length) {
                return;
            }
            var args = Array.prototype.slice.call(arguments, 0);
            args.splice(1, 0, 'background:red;color:white');
            this._log.apply(this, args);
        },
        warn: function () {
            if (!arguments.length) {
                return;
            }
            var args = Array.prototype.slice.call(arguments, 0);
            args.splice(1, 0, 'background:yellow;color:white');
            this._log.apply(this, args);
        }
    };

    window.GK = GK;

})(window, window.Util)
