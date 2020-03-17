/*
* Copyright (c) 2018 Elastos Foundation
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

let exec = cordova.exec;

type Opaque<T, K> = T & { __opaque__: K };
type Int = Opaque<number, 'Int'>;

const CARRIER_CB_NAMES = [
    "onConnection",
    "onReady",
    "onSelfInfoChanged",
    "onFriends",
    "onFriendConnection",
    "onFriendInfoChanged",
    "onFriendPresence",
    "onFriendRequest",
    "onFriendAdded",
    "onFriendRemoved",
    "onFriendMessage",
    "onFriendInviteRequest",
    "onSessionRequest",
    "onGroupInvite",
    "onConnectRequest",
];

const GROUP_CB_NAMES = [
    "onGroupConnected",
    "onGroupMessage",
    "onGroupTitle",
    "onPeerName",
    "onPeerListChanged",
];

const FILE_TRANSFER_CB_NAMES = [
    "onStateChanged",
    "onFileRequest",
    "onPullRequest",
    "onData",
    "onDataFinished",
    "onPending",
    "onResume",
    "onCancel",
];

const STREAM_CB_NAMES = [
    "onStateChanged",
    "onStreamData",
    "onChannelOpen",
    "onChannelOpened",
    "onChannelClose",
    "onChannelData",
    "onChannelPending",
    "onChannelResume",
];

const CARRIER = 1;
const SESSION = 2;
const STREAM = 3;
const FRIEND_INVITE = 4;
const GROUP = 5 ;
const FILE_TRANSFER = 6 ;

class StreamImpl implements CarrierPlugin.Stream {
    objId = null;
    carrierManager = null;

    id: Int = null;
    carrier: CarrierPlugin.Carrier = null;
    session: CarrierPlugin.Session = null;
    type: CarrierPlugin.StreamType = null;

    callbacks: CarrierPlugin.StreamCallbacks = {
        onStateChanged: null,
        onStreamData: null,
        onChannelOpen: null,
        onChannelOpened: null,
        onChannelClose: null,
        onChannelData: null,
        onChannelPending: null,
        onChannelResume: null,
    };

    on(name: string, callback: Function): Boolean {
        if (typeof callback != 'function') {
            return false;
        }
        for (var i = 0; i < STREAM_CB_NAMES.length; i++) {
            if (name == STREAM_CB_NAMES[i]) {
                this.callbacks[name] = callback;
                return true;
            }
        }
        return false;
    }

    process(onSuccess, onError, name, args) {
        var me = this;
        var _onSuccess = function (ret) {
            if (typeof ret === 'object') ret.stream = me;
            if (onSuccess) onSuccess(ret);
        };
        exec(_onSuccess, onError, 'CarrierPlugin', name, args);
    }

    getTransportInfo(onSuccess: (transportInfo: CarrierPlugin.TransportInfo) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "getTransportInfo", [this.objId]);
    }

    write(data: string, onSuccess: (bytesSent: Number) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "streamWrite", [this.objId, data]);
    }

    openChannel(cookie: string, onSuccess: (channelId: Number) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "openChannel", [this.objId, cookie]);
    }

    closeChannel(channel: Number, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "closeChannel", [this.objId, channel]);
    }

    writeChannel(channel: Number, data: string, onSuccess: (bytesSent: Number) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "writeChannel", [this.objId, channel, data]);
    }

    pendChannel(channel: Number, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "pendChannel", [this.objId, channel]);
    }
    resumeChannel(channel: Number, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "resumeChannel", [this.objId, channel]);
    }

    openPortForwarding(service: string, protocol: CarrierPlugin.PortForwardingProtocol, host: string, port: Number, onSuccess: (portForwardingId: Number) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "openPortForwarding", [this.objId, service, protocol, host, port]);
    }

    closePortForwarding(portForwarding: Number, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "closePortForwarding", [this.objId, portForwarding]);
    }
}

class SessionImpl implements CarrierPlugin.Session {
    objId = null;
    carrierManager = null;
    streams = [];

    peer = null;
    carrier = null;

    process(onSuccess, onError, name, args) {
        var me = this;
        exec((ret) => {
            if (typeof ret === 'object') ret.session = me;
            if (onSuccess)
                onSuccess(ret);
        }, onError, 'CarrierPlugin', name, args);
    }

    // /**
    //  * Get remote peer id.
    //  *
    //  * @param {Function} onSuccess  The function to call when success, the param is a string: The remote peer userid.
    //  * @param {Function} [onError]  The function to call when error, the param is a string. Or set to null.
    //  */
    // getPeer: function (onSuccess, onError) {
    //     this.process(onSuccess, onError, "getPeer", [this.objId]);
    // },

    close(onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "sessionClose", [this.objId]);
    }

    request(handler: CarrierPlugin.OnSessionRequestComplete, onSuccess: () => void, onError?: (err: string) => void) {
        var handlerId = 0;
        if (typeof handler == "function") {
            handlerId = this.carrierManager.addSessionRequestCompleteCB(handler, this);
        }
        this.process(onSuccess, onError, "sessionRequest", [this.objId, handlerId]);
    }

    replyRequest(status: Number, reason: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "sessionReplyRequest", [this.objId, status, reason]);
    }

    start(sdp: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "sessionStart", [this.objId, sdp]);
    }

    addStream(type: CarrierPlugin.StreamType, options: Number, callbacks: CarrierPlugin.StreamCallbacks, onSuccess: (stream: CarrierPlugin.Stream) => void, onError?: (err: string) => void) {
        var stream = new StreamImpl();
        var me = this;
        var _onSuccess = function (ret) {
            stream.type = type;
            stream.objId = ret.objId;
            stream.id = ret.id;
            stream.carrierManager = me.carrierManager;
            stream.carrier = me.carrier;
            stream.session = me;
            me.streams[stream.id] = stream;
            me.carrierManager.streams[stream.objId] = stream;
            if (onSuccess)
                onSuccess(stream);
        };

        if (callbacks) {
            for (var i = 0; i < STREAM_CB_NAMES.length; i++) {
                var name = STREAM_CB_NAMES[i];
                stream.callbacks[name] = callbacks[name];
            }
        }

        exec(_onSuccess, onError, 'CarrierPlugin', 'addStream', [this.objId, type, options]);
    }

    removeStream(stream: StreamImpl, onSuccess: (stream: CarrierPlugin.Stream) => void, onError?: (err: string) => void) {
        if (stream == this.streams[stream.id]) {
            var me = this;
            var _onSuccess = function (ret) {
                ret.session = me;
                me.streams[stream.id] = null;
                me.carrierManager.streams[stream.objId] = null;
                if (onSuccess)
                    onSuccess(ret);
            };
            exec(_onSuccess, onError, 'CarrierPlugin', "removeStream", [this.objId, stream.objId]);
        }
        else {
            onError("This stream doesn't belong to the session!");
        }
    }

    addService(service: string, protocol: CarrierPlugin.PortForwardingProtocol, host: string, port: Number, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "addService", [this.objId, service, protocol, host, port]);
    }

    removeService(service: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "removeService", [this.objId, service]);
    }
}


class CarrierImpl implements CarrierPlugin.Carrier {
    objId = null;
    carrierManager = null;
    groups = {};

    nodeId = null;
    userId = null;
    address = null;

    _nospam = null;
    _presence = null;

    callbacks = {
        onConnection: null,
        onReady: null,
        onSelfInfoChanged: null,
        onFriends: null,
        onFriendConnection: null,
        onFriendInfoChanged: null,
        onFriendPresence: null,
        onFriendRequest: null,
        onFriendAdded: null,
        onFriendRemoved: null,
        onFriendMessage: null,
        onFriendInviteRequest: null,
        onSessionRequest: null,
        onGroupInvite: null,
        onConnectRequest: null,
        onGroupConnected: null,
        onGroupMessage: null,
        onGroupTitle: null,
        onPeerName: null,
        onPeerListChanged: null
    }

    /** @property {number} nospam The nospam for Carrier address is used to eliminate spam friend. **/
    set nospam(value) {
        var me = this;
        var success = function(ret) {
            me._nospam = value;
        };
        this.process(success, null, "setNospam", [this.objId, value]);
    }

    get nospam() {
        return this._nospam;
    }

    /** @property {number} presence Presence status. **/
    set presence(value) {
        var me = this;
        var success = function(ret) {
            me._presence = value;
        };
        this.process(success, null, "setPresence", [this.objId, value]);
    }

    get presence() {
        return this._presence;
    }

    on(name, callback): Boolean {
        if (typeof callback != 'function') {
            return false;
        }
        for (var i = 0; i < CARRIER_CB_NAMES.length; i++) {
            if (name == CARRIER_CB_NAMES[i]) {
                this.callbacks[name] = callback;
                return true;
            }
        }
        return false;
    }

    process(onSuccess, onError, name, args) {
        var me = this;
        var _onSuccess = function (ret) {
            if (typeof ret === 'object') ret.carrier = me;
            if (onSuccess) onSuccess(ret);
        };
        exec(_onSuccess, onError, 'CarrierPlugin', name, args);
    }

    start(iterateInterval: Number, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "carrierStart", [this.objId, iterateInterval]);
    }

    getSelfInfo(onSuccess: (userInfo: CarrierPlugin.UserInfo) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "getSelfInfo", [this.objId]);
    }

    setSelfInfo(name: string, value: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "setSelfInfo", [this.objId, name, value]);
    }

    isReady(onSuccess: (ready: Boolean) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "isReady", [this.objId]);
    }

    getFriends(onSuccess: (friends: CarrierPlugin.FriendInfo[]) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "getFriends", [this.objId]);
    }

    getFriend(userId: string, onSuccess: (friend: CarrierPlugin.FriendInfo) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "getFriend", [this.objId, userId]);
    }

    labelFriend(userId: string, label: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "labelFriend", [this.objId, userId, label]);
    }

    isFriend(userId: string, onSuccess: (isFriend: Boolean) => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "isFriend", [this.objId, userId]);
    }

    addFriend(address: string, hello: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "addFriend", [this.objId, address, hello]);
    }

    acceptFriend(userId: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "acceptFriend", [this.objId, userId]);
    }

    removeFriend(userId: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "removeFriend", [this.objId, userId]);
    }

    sendFriendMessage(to: string, message: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "sendFriendMessage", [this.objId, to, message]);
    }

    inviteFriend(to: string, data: string, handler: CarrierPlugin.OnFriendInviteResponse, onSuccess: () => void, onError?: (err: string) => void) {
        var handlerId = 0;
           if (typeof handler == "function") {
               handlerId = this.carrierManager.addFriendInviteResponseCB(handler, this);
           }
           this.process(onSuccess, onError, "inviteFriend", [this.objId, to, data, handlerId]);
    }

    replyFriendInvite(to: string, status: Number, reason: string, data: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "replyFriendInvite", [this.objId, to, status, reason, data]);
    }

    newGroup(onSuccess: (group: CarrierPlugin.Group) => void, onError?: (err: string) => void) {
        var me = this;
        var _onSuccess = function(ret){
            var group = new GroupImpl();
            group.groupId = ret.groupId;
            group.carrier = me;
            me.carrierManager.groups[group.groupId] = group;
            me.groups[group.groupId] = group;

            if (onSuccess) onSuccess(group);
         };
        this.process(_onSuccess, onError, "createGroup", [this.objId]);
    }

    groupJoin(friendId: string, cookieCode: string, onSuccess: (group: CarrierPlugin.Group) => void, onError?: (err: string) => void) {
        var me = this;
        var _onSuccess = function(ret){
            var group = new GroupImpl();
            group.groupId = ret.groupId;
            group.carrier = me;
            me.carrierManager.groups[group.groupId] = group;
            me.groups[group.groupId] = group;

            if (onSuccess) onSuccess(group);
        };
        this.process(_onSuccess, onError, "joinGroup", [this.objId,friendId,cookieCode]);
    }

    groupLeave(group: CarrierPlugin.Group, onSuccess: (group: CarrierPlugin.Group) => void, onError?: (err: string) => void) {
        var me = this;
        var _onSuccess = function(ret){
            delete me.carrierManager.groups[group.groupId];
            delete me.groups[group.groupId];
            if (onSuccess)
                onSuccess(group);
        };
        this.process(_onSuccess, onError, "leaveGroup", [this.objId,group.groupId]);
    }

    getGroups(onSuccess: (groups: CarrierPlugin.Group[]) => void, onError?: (err: string) => void) {
        let groups = [];
        for (let groupID in this.groups)
            groups.push(this.groups[groupID]);
        if (onSuccess) onSuccess(groups);
    }

    newFileTransfer(to: string, fileTransferInfo: CarrierPlugin.FileTransferInfo, callbacks: any, onSuccess?: (fileTransfer: any) => void, onError?: (err: String) => void) {
        var me = this;
        var _onSuccess = function(ret){
            var fileTransfer = new FileTransferImpl();
            fileTransfer.fileTransferId = ret.fileTransferId;
            me.carrierManager.fileTransfers[fileTransfer.fileTransferId] = fileTransfer;

            if (typeof (callbacks) != "undefined" && callbacks != null) {
                for (var i = 0; i < FILE_TRANSFER_CB_NAMES.length; i++) {
                    var name = FILE_TRANSFER_CB_NAMES[i];
                    me.carrierManager.fileTransfers[fileTransfer.fileTransferId].callbacks[name] = callbacks[name];
                }
            }
            if (onSuccess) onSuccess(fileTransfer);
        };
        this.process(_onSuccess, onError, "newFileTransfer", [this.objId,to,fileTransferInfo]);
    }

    generateFileId(onSuccess: (fileId: Opaque<number, "Int">) => void) {
        var _onSuccess = function(ret){
            if (onSuccess) onSuccess(ret.fileId);
        };
        this.process(_onSuccess,null, "generateFileTransFileId", []);
    }

    newSession(to: string, onSuccess: (session: CarrierPlugin.Session) => void, onError?: (err: string) => void) {
        var me = this;
           var _onSuccess = function (ret) {
               var session = new SessionImpl();
               session.objId = ret.id;
               session.peer = ret.peer;
               session.carrier = me;
               session.carrierManager = me.carrierManager;
               if (onSuccess) onSuccess(session);
           };
           exec(_onSuccess, onError, 'CarrierPlugin', 'newSession', [this.objId, to]);
    }

    destroy(onSuccess?: () => void, onError?: (err: string) => void) {
        exec(onSuccess, onError, 'CarrierPlugin', 'destroy', [this.objId]);
    }
}

class GroupImpl implements CarrierPlugin.Group {
    groupId = null;
    carrier = null;

    process(onSuccess, onError, name, args) {
        var me = this;
        var _onSuccess = function (ret) {
           if (typeof ret === 'object') ret.group = me
           if (onSuccess) onSuccess(ret);
        };
        exec(_onSuccess, onError, 'CarrierPlugin', name, args);
    }

    invite(friendId: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "inviteGroup", [this.groupId,friendId]);
    }

    sendMessage(message: string, onSuccess: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "sendGroupMessage", [this.groupId,message]);
    }

    getTitle(onSuccess: (groupTitle: string) => void, onError?: (err: string) => void) {
        var _onSuccess = function(ret){
            var title = ret.groupTitle;
            if (onSuccess) onSuccess(title);
        };
        this.process(_onSuccess, onError, "getGroupTitle", [this.groupId]);
    }

    setTitle(groupTitle: string, onSuccess: (groupTitle: string) => void, onError?: (err: string) => void) {
        var _onSuccess = function(ret){
            var title = ret.groupTitle;
            if (onSuccess) onSuccess(title);
        };
        this.process(_onSuccess, onError, "setGroupTitle", [this.groupId,groupTitle]);
    }

    getPeers(onSuccess: (peers: any) => void, onError?: (err: string) => void) {
        var _onSuccess = function(ret){
            var peers = ret.peers;
            if (onSuccess) onSuccess(peers);
        };
        this.process(_onSuccess, onError, "getGroupPeers", [this.groupId]);
    }

    getPeer(peerId: string, onSuccess: (peer: any) => void, onError?: (err: string) => void) {
        var _onSuccess = function(ret){
            var peer = ret.peer;
            if (onSuccess) onSuccess(peer);
        };
        this.process(_onSuccess, onError, "getGroupPeer", [this.groupId,peerId]);
    }
}

class FileTransferImpl implements CarrierPlugin.FileTransfer {
    fileTransferId = null;

    callbacks = {
        onStateChanged: null,
        onFileRequest: null,
        onPullRequest: null,
        onData: null,
        onDataFinished: null,
        onPending: null,
        onResume: null,
        onCancel: null
    }

    process(onSuccess, onError, name, args) {
        var me = this;
        var _onSuccess = function (ret) {
            if (typeof ret === 'object') ret.fileTransfer = me;
            if (onSuccess)
                onSuccess(ret);
        }
        exec(_onSuccess, onError, 'CarrierPlugin', name, args);
    }

    close(onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "closeFileTrans", [this.fileTransferId]);
    }

    getFileId(filename: string, onSuccess?: (fileId: string) => void, onError?: (err: string) => void) {
        var _onSuccess = function (ret) {
            var fileId = ret.fileId;
            if (onSuccess) onSuccess(fileId);
         };
         this.process(_onSuccess, onError, "getFileTransFileId", [this.fileTransferId,filename]);
    }

    getFileName(fileId: string, onSuccess?: (filename: string) => void, onError?: (err: string) => void) {
        var _onSuccess = function (ret) {
            var filename = ret.filename;
            if (onSuccess)
                onSuccess(filename);
         };
         this.process(_onSuccess, onError, "getFileTransFileName", [this.fileTransferId,fileId]);
    }

    connect(onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "fileTransConnect", [this.fileTransferId]);
    }

    acceptConnect(onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "acceptFileTransConnect", [this.fileTransferId]);
    }

    addFile(fileInfo: CarrierPlugin.FileTransferInfo, onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "addFileTransFile", [this.fileTransferId,fileInfo]);
    }

    pullData(fileId: string, offset: number & { __opaque__: "Int"; }, onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "pullFileTransData", [this.fileTransferId,fileId,offset]);
    }

    writeData(fileId: string, data: string, onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "writeFileTransData", [this.fileTransferId,fileId,data]);
    }

    sendFinish(fileId: string, onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "sendFileTransFinish", [this.fileTransferId,fileId]);
    }

    cancelTransfer(fileId: string, status: Int, reason: string, onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "cancelFileTrans", [this.fileTransferId, fileId , status , reason]);
    }

    pendTransfer(fileId: string, onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "pendFileTrans", [this.fileTransferId , fileId]);
    }

    resumeTransfer(fileId: string, onSuccess?: () => void, onError?: (err: string) => void) {
        this.process(onSuccess, onError, "resumeFileTrans", [this.fileTransferId , fileId]);
    }
}

class CarrierManagerImpl implements CarrierPlugin.CarrierManager {
    carriers = [];
    streams = [];
    groups = {};
    fileTransfers = {};

    options: {
        udpEnabled: true,
        persistentLocation: ".data"
    }

    FriendInviteEvent = [];
    FriendInviteCount = 0;
    SRCEvent = [];
    SRCCount = 0;

    constructor() {
        Object.freeze(CarrierManagerImpl.prototype);
        Object.freeze(CarrierImpl.prototype);
        Object.freeze(SessionImpl.prototype);
        Object.freeze(StreamImpl.prototype);
        Object.freeze(GroupImpl.prototype);
        Object.freeze(FileTransferImpl.prototype);

        exec(function () { }, null, 'CarrierPlugin', 'initVal', []);

        this.setListener(CARRIER, (event) => {
            event.carrier = this.carriers[event.id];
            if (event.carrier) {
                //        event.id = null;
                if (event.carrier.callbacks[event.name]) {
                    event.carrier.callbacks[event.name](event);
                }
            }
            else {
                alert(event.name);
            }
        });

        this.setListener(STREAM, function(event) {
            event.stream = this.streams[event.id];
            event.id = null;
            if (event.stream && event.stream.callbacks[event.name]) {
                event.stream.callbacks[event.name](event);
            }
        });

        this.setListener(FRIEND_INVITE, (event) => {
            var id = event.id;
            event.id = null;
            if (this.FriendInviteEvent[id].callback) {
                event.carrier = this.FriendInviteEvent[id].carrier;
                this.FriendInviteEvent[id].callback(event);
            }
        });

        this.setListener(SESSION, (event) => {
            var id = event.id;
            event.id = null;
            if (this.SRCEvent[id].callback) {
                event.session = this.SRCEvent[id].session;
                this.SRCEvent[id].callback(event);
            }
        });

        this.setListener(GROUP, (event) => {
            var group = this.groups[event.groupId];
            if (group) {
                var carrier = group.carrier;
                if (carrier.callbacks[event.name]) {
                    carrier.callbacks[event.name](event);
                }
            }else {
                alert(event.name);
            }
        });

        this.setListener(FILE_TRANSFER, (event) => {
            var fileTransfer = this.fileTransfers[event.fileTransferId];
            if (fileTransfer) {
                if (fileTransfer.callbacks[event.name]) {
                    fileTransfer.callbacks[event.name](event);
                }
            } else {
                alert(event.name);
            }
        });
    }

    //FriendInviteResponseHandler
    addFriendInviteResponseCB(callback, carrier) {
        this.FriendInviteCount++;
        this.FriendInviteEvent[this.FriendInviteCount] = new Object;
        this.FriendInviteEvent[this.FriendInviteCount].callback = callback;
        this.FriendInviteEvent[this.FriendInviteCount].carrier = carrier
        return this.FriendInviteCount;
    }

    //SessionRequestCompleteHandler
    addSessionRequestCompleteCB(callback, session) {
        this.SRCCount++;
        this.SRCEvent[this.SRCCount] = new Object;
        this.SRCEvent[this.SRCCount].callback = callback;
        this.SRCEvent[this.SRCCount].session = session
        return this.SRCCount;
    }

    setListener(type, eventCallback) {
        exec(eventCallback, null, 'CarrierPlugin', 'setListener', [type]);
    }

    getVersion(onSuccess: (version: string) => void, onError?: (err: string) => void) {
        exec(onSuccess, onError, 'CarrierPlugin', 'getVersion', []);
    }

    isValidId(id: string, onSuccess: (isValid: Boolean) => void, onError?: (err: string) => void) {
        var _onSuccess = function (ret) {
            if (onSuccess) onSuccess(ret == "true" ? true : false);
        };

        exec(_onSuccess, onError, 'CarrierPlugin', 'isValidAddress', [id]);
    }

    isValidAddress(address: string, onSuccess: (isValid: Boolean) => void, onError?: (err: string) => void) {
        var _onSuccess = function (ret) {
            if (onSuccess) onSuccess(ret == "true" ? true : false);
        };

        exec(_onSuccess, onError, 'CarrierPlugin', 'isValidAddress', [address]);
    }

    getIdFromAddress(address: string, onSuccess: (userId: string) => void, onError?: (err: string) => void) {
        exec(onSuccess, onError, 'CarrierPlugin', 'getIdFromAddress', [address]);
    }

    createObject(callbacks: CarrierPlugin.CarrierCallbacks, options: any, onSuccess: (carrier: CarrierPlugin.Carrier) => void, onError?: (err: string) => void) {
        var carrier = new CarrierImpl();
        var me = this;
        var _onSuccess = function (ret) {
            carrier.objId = ret.id;
            carrier.nodeId = ret.nodeId;
            carrier.userId = ret.userId;
            carrier.address = ret.address;
            carrier._nospam = ret.nospam;
            carrier._presence = ret.presence;
            carrier.carrierManager = me;
            me.carriers[carrier.objId] = carrier;
            for (const groupId of ret.groups) {
                let group = new GroupImpl();
                group.groupId = groupId;
                group.carrier = carrier;
                me.groups[groupId] = group;
                carrier.groups[groupId] = group;
            }

            if (onSuccess)
                onSuccess(carrier);
        };
        if (typeof (options) == "undefined" || options == null) {
            options = this.options;
        }

        if (typeof (callbacks) != "undefined" && callbacks != null) {
            for (var i = 0; i < CARRIER_CB_NAMES.length; i++) {
                var name = CARRIER_CB_NAMES[i];
                carrier.callbacks[name] = callbacks[name];
            }

            for (i = 0; i < GROUP_CB_NAMES.length; i++) {
                name = GROUP_CB_NAMES[i];
                carrier.callbacks[name] = callbacks[name];
            }
        }

        var configstring = JSON.stringify(options);
        exec(_onSuccess, onError, 'CarrierPlugin', 'createObject', ["im", configstring]);
    }
}

const carrierManager = new CarrierManagerImpl();
export = carrierManager;
