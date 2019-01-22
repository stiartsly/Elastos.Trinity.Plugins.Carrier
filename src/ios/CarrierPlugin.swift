
import Foundation
import ElastosCarrier

typealias Carrier = ElastosCarrier.Carrier
typealias Session = ElastosCarrier.CarrierSession

@objc(CarrierPlugin)
class CarrierPlugin : CDVPlugin {

    //        let test = Test()

    let OK = 0;
    var CARRIER = 1;
    var SESSION = 2;
    var STREAM = 3;
    var FRIEND_INVITE = 4;

    var mCarrierDict = [Int: PluginCarrierHandler]()
    var mSessionDict = [Int: Session]()
    var mStreamDict = [Int: PluginStreamHandler]()

    var carrierCallbackId: String = ""
    var sessionCallbackId: String = ""
    var streamCallbackId: String = ""
    var FIRCallbackId: String = ""

    var count: Int = 1;

    //    override init() {
    //        super.init();
    //    }

    func initVal(_ command: CDVInvokedUrlCommand) {

    }

    func success(_ command: CDVInvokedUrlCommand, retAsString: String) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK,
                                     messageAs: retAsString);

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    func success(_ command: CDVInvokedUrlCommand, retAsDict: NSDictionary) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK,
                                     messageAs: retAsDict as! [AnyHashable : Any]);

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    func error(_ command: CDVInvokedUrlCommand, retAsString: String) {
        let result = CDVPluginResult(status: CDVCommandStatus_ERROR,
                                     messageAs: retAsString);

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    func test(_ command: CDVInvokedUrlCommand) {

    }

    func getVersion(_ command: CDVInvokedUrlCommand) {
        let version = ElastosCarrier.Carrier.getVersion()
        self.success(command, retAsString: version);
    }

    func getIdFromAddress(_ command: CDVInvokedUrlCommand) {
        let address = command.arguments[0] as? String ?? ""
        if (!address.isEmpty) {
            let usrId = ElastosCarrier.Carrier.getIdFromAddress(address);
            self.success(command, retAsString: usrId!);
        }
        else {
            self.error(command, retAsString: "Expected one non-empty let argument.");
        }
    }

    func isValidAddress(_ command: CDVInvokedUrlCommand) {
        let address = command.arguments[0] as? String ?? ""
        if (!address.isEmpty) {
            let ret = Carrier.isValidAddress(address);
            self.success(command, retAsString: String(ret));
        }
        else {
            self.error(command, retAsString: "Expected one non-empty let argument.");
        }
    }

    func isValidId(_ command: CDVInvokedUrlCommand) {
        let userId = command.arguments[0] as? String ?? ""
        if (!userId.isEmpty) {
            let ret = ElastosCarrier.Carrier.isValidId(userId);
            self.success(command, retAsString: String(ret));
        }
        else {
            self.error(command, retAsString: "Expected one non-empty let argument.");
        }
    }

    func setListener(_ command: CDVInvokedUrlCommand) {
        let type = command.arguments[0] as? Int ?? 0

        switch (type) {
        case CARRIER:
            carrierCallbackId = command.callbackId;
        case SESSION:
            sessionCallbackId = command.callbackId;
        case STREAM:
            streamCallbackId = command.callbackId;
        case FRIEND_INVITE:
            FIRCallbackId = command.callbackId;
        default:
            self.error(command, retAsString: "Expected one non-empty let argument.");
        }


        //         Don't return any result now
        let result = CDVPluginResult(status: CDVCommandStatus_NO_RESULT);
        result?.setKeepCallbackAs(true);
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    func createObject(_ command: CDVInvokedUrlCommand) {
        let dir = command.arguments[0] as? String ?? ""
        let config = command.arguments[1] as? String ?? ""

        let carrierHandler = PluginCarrierHandler.createInstance(dir, config, carrierCallbackId, self.commandDelegate);

        count += 1;
        carrierHandler.mCode = count;
        mCarrierDict[count] = carrierHandler;

        do {
            let selfInfo: UserInfo = try carrierHandler.mCarrier.getSelfUserInfo();
            let ret: NSDictionary = [
                "id": carrierHandler.mCode,
                "nodeId" : carrierHandler.mCarrier.getNodeId(),
                "userId" : selfInfo.userId ?? "",
                "address": carrierHandler.mCarrier.getAddress(),
                "nospam" : try carrierHandler.mCarrier.getSelfNospam(),
                "presence" : try carrierHandler.mCarrier.getSelfPresence().rawValue,
                ]

            self.success(command, retAsDict: ret);
        }
        catch {
        }
    }

    func carrierStart(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let iterateleterval = command.arguments[1] as? Int ?? 0

        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                try carrierHandler.mCarrier.start(iterateInterval: iterateleterval);
            }
            catch {
            }
            self.success(command, retAsString: "ok");
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func getSelfInfo(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                let selfInfo: UserInfo = try carrierHandler.mCarrier.getSelfUserInfo();
                let ret: NSDictionary = carrierHandler.getUserInfoDict(selfInfo);
                self.success(command, retAsDict: ret);
            }
            catch {
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func setSelfInfo(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let name = command.arguments[1] as? String ?? ""
        let value = command.arguments[2] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                let selfInfo: UserInfo = try carrierHandler.mCarrier.getSelfUserInfo();

                switch (name) {
                case "name":
                    selfInfo.name = value;
                case "description":
                    selfInfo.briefDescription = value;
                case "gender":
                    selfInfo.gender = value;
                case "phone":
                    selfInfo.phone = value;
                case "email":
                    selfInfo.email = value;
                case "region":
                    selfInfo.region = value;
                case "hasAvatar":
                    selfInfo.hasAvatar = (value == "ture");
                default:
                    self.error(command, retAsString: "error");
                    return;
                }

                try carrierHandler.mCarrier.setSelfUserInfo(selfInfo);

                let ret: NSDictionary = [
                    "name": name,
                    "value": value,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func getNospam(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                let ret: NSDictionary = [
                    "nospam": try carrierHandler.mCarrier.getSelfNospam(),
                    ]

                self.success(command, retAsDict: ret);
            }
            catch {
                // self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func setNospam(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let nospam = command.arguments[1] as? UInt32 ?? 0

        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                try carrierHandler.mCarrier.setSelfNospam(nospam);
                let ret: NSDictionary = [
                    "nospam": nospam,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                //            self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func getPresence(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                let presence = try carrierHandler.mCarrier.getSelfPresence().rawValue
                let ret: NSDictionary = [
                    "presence": presence,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                //            self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func setPresence(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let presence = command.arguments[1] as? Int ?? 0

        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                try carrierHandler.mCarrier.setSelfPresence(CarrierPresenceStatus(rawValue: presence)!);
                let ret: NSDictionary = [
                    "presence": presence,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                // self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func isReady(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            let ret: NSDictionary = [
                "isReady": carrierHandler.mCarrier.isReady(),
                ]
            self.success(command, retAsDict: ret);
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func getFriends(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                let friends: [FriendInfo] = try carrierHandler.mCarrier.getFriends();
                let ret: NSDictionary = [
                    "friends": carrierHandler.getFriendsInfoDict(friends),
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func getFriend(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let userId = command.arguments[1] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                let info: FriendInfo = try carrierHandler.mCarrier.getFriendInfo(userId);
                let ret: NSDictionary = carrierHandler.getFriendInfoDict(info);
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func labelFriend(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let userId = command.arguments[1] as? String ?? ""
        let label = command.arguments[2] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                try carrierHandler.mCarrier.setFriendLabel(forFriend: userId, newLabel: label);
                let ret: NSDictionary = [
                    "userId": userId,
                    "label": label,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func isFriend(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let userId = command.arguments[1] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            let ret: NSDictionary = [
                "userId": userId,
                "isFriend": carrierHandler.mCarrier.isFriend(with: userId),
                ]
            self.success(command, retAsDict: ret);
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func acceptFriend(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let userId = command.arguments[1] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                try carrierHandler.mCarrier.acceptFriend(with: userId);
                let ret: NSDictionary = [
                    "userId": userId,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func addFriend(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let address = command.arguments[1] as? String ?? ""
        let hello = command.arguments[2] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                try carrierHandler.mCarrier.addFriend(with: address, withGreeting: hello);
                let ret: NSDictionary = [
                    "address": address,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func removeFriend(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let userId = command.arguments[1] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                try carrierHandler.mCarrier.removeFriend(userId);
                let ret: NSDictionary = [
                    "userId": userId,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func sendFriendMessage(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let to = command.arguments[1] as? String ?? ""
        let message = command.arguments[2] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                try carrierHandler.mCarrier.sendFriendMessage(to: to, withMessage: message);
                self.success(command, retAsString: "success!");
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func inviteFriend(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let to = command.arguments[1] as? String ?? ""
        let data = command.arguments[2] as? String ?? ""
        let handlerId = command.arguments[3] as? Int ?? 0
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                let handler = FIRHandler(handlerId, FIRCallbackId, self.commandDelegate);
                try carrierHandler.mCarrier.sendInviteFriendRequest(to: to, withData: data, delegate: handler);
                let ret: NSDictionary = [
                    "to": to,
                    "data": data,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func replyFriendInvite(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let to = command.arguments[1] as? String ?? ""
        let status = command.arguments[2] as? Int ?? 0
        let reason = command.arguments[3] as? String ?? ""
        let data = command.arguments[4] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                try carrierHandler.mCarrier.replyFriendInviteRequest(to: to, withStatus: status, reason: reason, data: data);
                let ret: NSDictionary = [
                    "to": to,
                    "status": status,
                    "reason": reason,
                    "data": data,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func destroy(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            carrierHandler.mCarrier.kill();
            let ret: NSDictionary = [:];                 ]
            self.success(command, retAsDict: ret);
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func newSession(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let to = command.arguments[1] as? String ?? ""
        if let carrierHandler: PluginCarrierHandler = mCarrierDict[id] {
            do {
                let session: Session = try carrierHandler.mSessionManager.newSession(to: to);

                count += 1;
                mSessionDict[count] = session;
                let ret: NSDictionary = [
                    "id": count,
                    "peer": session.getPeer(),
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func sessionClose(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        if let session: Session = mSessionDict[id] {
            session.close();
            self.success(command, retAsString: "success!");
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func getPeer(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        if let session: Session = mSessionDict[id] {
            let peer = session.getPeer();
            let ret: NSDictionary = [
                "peer": peer,
                ]
            self.success(command, retAsDict: ret);
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func sessionRequest(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let handlerId = command.arguments[1] as? Int ?? 0
        if let session: Session = mSessionDict[id] {
            do {
                let handler = SRCHandler(handlerId, sessionCallbackId, self.commandDelegate);
                try session.sendInviteRequest(delegate: handler);
                self.success(command, retAsString: "success!");
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func sessionReplyRequest(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let status = command.arguments[1] as? Int ?? 0
        let reason = command.arguments[2] as? String ?? ""

        if let session: Session = mSessionDict[id] {
            do {
                try session.replyInviteRequest(with: status, reason: reason);
                let ret: NSDictionary = [
                    "status": status,
                    "reason": reason,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func sessionStart(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let sdp = command.arguments[1] as? String ?? ""
        //
        if let session: Session = mSessionDict[id] {
            do {
                try session.start(remoteSdp: sdp);
                let ret: NSDictionary = [
                    "sdp": sdp,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func addStream(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let type = command.arguments[1] as? Int ?? 0
        let options = command.arguments[2] as? Int ?? 0

        if let session: Session = mSessionDict[id] {
            let streamHandler = PluginStreamHandler.createInstance(session, type, options, streamCallbackId, self.commandDelegate);

            count += 1;
            streamHandler.mCode = count;
            mStreamDict[count] = streamHandler;
            let ret: NSDictionary = [
                "objId": streamHandler.mCode,
                "id": streamHandler.mStream.getStreamId(),
                "type": type,
                "options": options,
                "transportInfo": streamHandler.getTransportInfoDict(),
                ]
            self.success(command, retAsDict: ret);
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func removeStream(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let streamId = command.arguments[1] as? Int ?? 0

        if let session: Session = mSessionDict[id], let streamHandler: PluginStreamHandler = mStreamDict[streamId] {
            do {
                try session.removeStream(stream: streamHandler.mStream);
                self.success(command, retAsString: "success!");
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func addService(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let service = command.arguments[1] as? String ?? ""
        let _protocol = command.arguments[2] as? Int ?? 0
        let host = command.arguments[3] as? String ?? ""
        let port = command.arguments[4] as? String ?? ""

        if let session: Session = mSessionDict[id] {
            do {
                try session.addService(serviceName: service, protocol: PortForwardingProtocol(rawValue: _protocol)!, host: host, port: port);
                let ret: NSDictionary = [
                    "service": service,
                    "protocol": _protocol,
                    "host": host,
                    "port": port,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func removeService(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let service = command.arguments[1] as? String ?? ""

        if let session: Session = mSessionDict[id] {
            session.removeService(serviceName: service);
            let ret: NSDictionary = [
                "service": service,
                ]
            self.success(command, retAsDict: ret);
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func getTransportInfo(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0

        if let streamHandler: PluginStreamHandler = mStreamDict[id] {
            let ret: NSDictionary = streamHandler.getTransportInfoDict();
            self.success(command, retAsDict: ret);
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func streamWrite(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let data = command.arguments[1] as? String ?? ""
        let rawData = data.data(using: String.Encoding.utf8)

        if let streamHandler: PluginStreamHandler = mStreamDict[id] {
            do {
                let written  = try streamHandler.mStream.writeData(rawData!);
                let ret: NSDictionary = [
                    "written": written,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func openChannel(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let cookie = command.arguments[1] as? String ?? ""


        if let streamHandler: PluginStreamHandler = mStreamDict[id] {
            do {
                let channel  = try streamHandler.mStream.openChannel(cookie: cookie);
                let ret: NSDictionary = [
                    "channel": channel,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func closeChannel(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let channel = command.arguments[1] as? Int ?? 0

        if let streamHandler: PluginStreamHandler = mStreamDict[id] {
            do {
                try streamHandler.mStream.closeChannel(channel);
                let ret: NSDictionary = [
                    "channel": channel,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func writeChannel(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let channel = command.arguments[1] as? Int ?? 0
        let data = command.arguments[2] as? String ?? ""
        let rawData = data.data(using: String.Encoding.utf8)

        if let streamHandler: PluginStreamHandler = mStreamDict[id] {
            do {
                let written  = try streamHandler.mStream.writeChannel(channel, data: rawData!);
                let ret: NSDictionary = [
                    "channel": channel,
                    "written": written,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func pendChannel(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let channel = command.arguments[1] as? Int ?? 0


        if let streamHandler: PluginStreamHandler = mStreamDict[id] {
            do {
                try streamHandler.mStream.pendChannel(channel);
                let ret: NSDictionary = [
                    "channel": channel,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func resumeChannel(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let channel = command.arguments[1] as? Int ?? 0


        if let streamHandler: PluginStreamHandler = mStreamDict[id] {
            do {
                try streamHandler.mStream.resumeChannel(channel);
                let ret: NSDictionary = [
                    "channel": channel,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func openPortForwarding(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let service = command.arguments[1] as? String ?? ""
        let _protocol = command.arguments[2] as? Int ?? 0
        let host = command.arguments[3] as? String ?? ""
        let port = command.arguments[4] as? String ?? ""

        if let streamHandler: PluginStreamHandler = mStreamDict[id] {
            do {
                let pfId = try streamHandler.mStream.openPortForwarding(service: service, ptotocol: PortForwardingProtocol(rawValue: _protocol)!, host: host, port: port);
                let ret: NSDictionary = [
                    "pfId": pfId,
                    "service": service,
                    "protocol": _protocol,
                    "host": host,
                    "port": port,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }

    func closePortForwarding(_ command: CDVInvokedUrlCommand) {
        let id = command.arguments[0] as? Int ?? 0
        let pfId = command.arguments[1] as? Int ?? 0

        if let streamHandler: PluginStreamHandler = mStreamDict[id] {
            do {
                try streamHandler.mStream.closePortForwarding(pfId);
                let ret: NSDictionary = [
                    "pfId": pfId,
                    ]
                self.success(command, retAsDict: ret);
            }
            catch {
                self.error(command, retAsString: "error");
            }
        }
        else {
            self.error(command, retAsString: "error");
        }
    }
}