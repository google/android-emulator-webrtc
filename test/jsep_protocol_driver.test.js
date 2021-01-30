/*
 * Copyright 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { jest } from "@jest/globals";
import "regenerator-runtime/runtime"; // Somehow needed for jest to be happy with ES6

import * as Proto from "../src/proto/emulator_controller_pb";
import * as Rtc from "../src/proto/rtc_service_pb";
import { render, waitFor, screen } from "@testing-library/react";
import JsepProtocol from "../src/components/emulator/net/jsep_protocol_driver.js";
import {
  RtcService,
  EmulatorControllerService,
} from "../src/proto/emulator_web_client";

jest.mock("../src/proto/emulator_web_client");

const jsepMessage = (object, uid) => {
  const guid = new Rtc.RtcId();
  guid.setGuid(uid);

  const jsepMsg = new Rtc.JsepMsg();
  jsepMsg.setId(guid);
  jsepMsg.setMessage(JSON.stringify(object));
  return jsepMsg;
};

const requestRtcStream = jest.fn((request, metadata, callback) => {
  const guid = new Rtc.RtcId();
  guid.setGuid("abcde");

  callback(null, guid);
});

const receiveJsepMessage = (message) => {
  const jsepMsg = jsepMessage(message);
  return jest.fn((request, metadata, callback) => {
    callback(null, jsepMsg);
  });
};

const RTCPeerConnectionMock =jest.fn().mockImplementation((cfg) => ({
  ondatachannel: jest.fn(),
  createAnswer: jest.fn(),
  addEventListener: jest.fn(),
  addIceCandidate: jest.fn(),
  dispatchEvent: jest.fn(),
  setRemoteDescription: jest.fn(),
  setLocalDescription: jest.fn(),
  close: jest.fn(),
}));

Object.defineProperty(window, "RTCPeerConnection", {
  writable: true,
  value: jest.fn().mockImplementation((cfg) => ({
    ondatachannel: jest.fn(),
    createAnswer: jest.fn(),
    addEventListener: jest.fn(),
    addIceCandidate: jest.fn(),
    dispatchEvent: jest.fn(),
    setRemoteDescription: jest.fn(),
    setLocalDescription: jest.fn(),
    close: jest.fn(),
  })),
});

Object.defineProperty(window, "RTCIceCandidate", {
  writable: true,
  value: jest.fn().mockImplementation((cfg) => ({})),
});

Object.defineProperty(window, "RTCSessionDescription", {
  writable: true,
  value: jest.fn().mockImplementation((desc) => ({})),
});

const candidates_and_sdp = [
  {
    candidate:
      "candidate:4205781435 1 udp 2122260223 10.146.0.6 37608 typ host generation 0 ufrag Er9W network-id 1 network-cost 50",
    sdpMLineIndex: 1,
    sdpMid: "1",
  },
  {
    candidate:
      "candidate:3022839115 1 tcp 1518280447 10.146.0.6 36959 typ host tcptype passive generation 0 ufrag Er9W network-id 1 network-cost 50",
    sdpMLineIndex: 0,
    sdpMid: "0",
  },
  {
    sdp:
      "v=0\r\no=- 6049686612136058523 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1 2\r\na=msid-semantic: WMS grpcAudio grpcVideo\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 123 125 122 124\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9     IN IP4 0.0.0.0\r\na=ice-ufrag:+lF9\r\na=ice-pwd:VeOkyt0WX8PVaLhifDCc1EsM\r\na=ice-options:trickle\r\na=fingerprint:sha-256 0F:1C:76:63:6C:F0:6D:BE:76:F0:5C:0E:99:01:A0:63:F2:66:32:E3:13:00:88:B0:8D:54:CC:94:22:31:E3:3F\r\na=setup:actpass\r\na=mid:0\r\na=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:13 urn:3gpp:video-orientation\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r\na=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=sendrecv\r\na=msid:grpcVideo grpcVideo\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtpmap:97 rtx/90000\r\n a=fmtp:97 apt=96\r\na=rtpmap:98 VP9/90000\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98 profile-id=0\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:100 VP9/90000\r\na=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\na=    rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=fmtp:100 profile-id=2\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100\r\na=rtpmap:127 AV1X/90000\r\na=rtcp-fb:127 goog-remb\r\na=rtcp-fb:127 transport-cc\r\na=rtcp-fb:127 ccm fir\r\na=rtcp-fb:127 nack\r\na=rtcp-fb:127 nack pli\r\na=rtpmap:123 rtx/90000    r\na=fmtp:123 apt=127\r\na=rtpmap:125 red/90000\r\na=rtpmap:122 rtx/90000\r\na=fmtp:122 apt=125\r\na=rtpmap:124 ulpfec/90000\r\na=ssrc-group:FID 88992511 2042214614\r\na=ssrc:88992511 cname:8DC+SxtOpt7FLaE7\r\na=ssrc:88992511 msid:grpcVideo grpcVideo\r\na=ssrc:88992511 mslabel:grpcVideo\r\na=ssrc:88992511 label:grpcVideo\r\n    a=ssrc:2042214614 cname:8DC+SxtOpt7FLaE7\r\na=ssrc:2042214614 msid:grpcVideo grpcVideo\r\na=ssrc:2042214614 mslabel:grpcVideo\r\na=ssrc:2042214614 label:grpcVideo\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 102 0 8 106 105 13 110 112 113 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:+lF9\r\na=ice-pwd:VeO    kyt0WX8PVaLhifDCc1EsM\r\na=ice-options:trickle\r\na=fingerprint:sha-256 0F:1C:76:63:6C:F0:6D:BE:76:F0:5C:0E:99:01:A0:63:F2:66:32:E3:13:00:88:B0:8D:54:CC:94:22:31:E3:3F\r\na=setup:actpass\r\na=mid:1\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-ti    me\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=sendrecv\r\na=msid:grpcAudio grpcAudio\r\na=rtcp-mu    x\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:9 G722/8000\r\na=rtpmap:102 ILBC/8000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000    \r\na=rtpmap:110 telephone-event/48000\r\na=rtpmap:112 telephone-event/32000\r\na=rtpmap:113 telephone-event/16000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:563165060 cname:8DC+SxtOpt7FLaE7\r\na=ssrc:563165060 msid:grpcAudio grpcAudio\r\na=ssrc:563165060 mslabel:grpcAudio\r\na=ssrc:563165060 label:grpcAudio\r\nm=applica    tion 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:+lF9\r\na=ice-pwd:VeOkyt0WX8PVaLhifDCc1EsM\r\na=ice-options:trickle\r\na=fingerprint:sha-256 0F:1C:76:63:6C:F0:6D:BE:76:F0:5C:0E:99:01:A0:63:F2:66:32:E3:13:00:88:B0:8D:54:CC:94:22:31:E3:3F\r\na=setup:actpass\r\na=mid:2\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n",
    type: "offer",
  },
];

const jsepProtocol = (messages) => {
  let receive = jest.fn();
  for (var i = 0; i < messages.length; i++) {
    receive.mockImplementationOnce(receiveJsepMessage(messages[i]));
  }
  RtcService.mockImplementation(() => {
    return {
      requestRtcStream: requestRtcStream,
      receiveJsepMessage: receive,
    };
  });
  const rtcServiceInstance = new RtcService("http://foo");
  const emulatorServiceInstance = new EmulatorControllerService("http://foo");
  return {
    rtc: rtcServiceInstance,
    jsep: new JsepProtocol(emulatorServiceInstance, rtcServiceInstance, true),
  };
};

describe("Basic jsep protocol with polling.", () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    RtcService.mockClear();
    EmulatorControllerService.mockClear();
  });

  it("calls request rtc stream", () => {
    const { rtc, jsep } = jsepProtocol([{ bye: "we're done" }]);
    jsep.startStream();
    expect(rtc.requestRtcStream.mock.calls.length).toBe(1);
    expect(rtc.receiveJsepMessage.mock.calls.length).toBe(1);
  });

  it("Notifies listeners of a disconnect", () => {
    const { jsep } = jsepProtocol([{ bye: "we're done" }]);

    const disconnect = jest.fn();
    jsep.on("disconnected", disconnect);
    jsep.startStream();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("Does not process messages before start", () => {
    const { jsep } = jsepProtocol(candidates_and_sdp);

    jsep.startStream();
    // All messages are queued.
    expect(jsep.message_queue.length).toBe(3);

    // Message queue is flushed after start.
    jsep.startStream();
    expect(jsep.message_queue.length).toBe(0);
  });

  it("Flush message queue after bye", () => {
    let msg = Array.from(candidates_and_sdp);
    msg.push({ bye: "we're done" });
    const { jsep } = jsepProtocol(msg);

    jsep.startStream();
    expect(jsep.message_queue.length).toBe(0);
    expect(jsep.peerConnection).toBe(null);
  });

  it("Out of order messages handled after start", () => {
    let msg = Array.from(candidates_and_sdp);
    msg.push({ start: {foo:'bar'} });
    const { jsep } = jsepProtocol(msg);

    jsep.startStream();
    expect(jsep.message_queue.length).toBe(0);
    expect(jsep.peerConnection).not.toBeNull();

    // Peer connection was initialized with rtc config
    expect(RTCPeerConnection.mock.calls[0][0]).toStrictEqual({foo : 'bar'});
  });
});
