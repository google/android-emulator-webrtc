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

const RTCPeerConnectionMock = jest.fn().mockImplementation((cfg) => ({
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
  value: jest.fn().mockImplementation((cfg) => {
    let sdp = null;
    let signal = null;
    let state = null;
    return {
      ondatachannel: jest.fn(),
      createAnswer: jest.fn(() => {
        return new Promise((resolve) => {
          return { answer: "fake-answer" };
        });
      }),
      addEventListener: jest.fn(),
      addIceCandidate: jest.fn(),
      dispatchEvent: jest.fn(),
      setRemoteDescription: (desc) => {
        sdp = desc;
        state = "have-remote-offer";
        if (signal) signal();
      },
      setLocalDescription: jest.fn(),
      get currentRemoteDescription() {
        return sdp;
      },
      set onsignalingstatechange(fn) {
        signal = fn;
      },
      get signalingState() {
        return state;
      },
      close: jest.fn(),
    };
  }),
});

Object.defineProperty(window, "RTCIceCandidate", {
  writable: true,
  value: jest.fn().mockImplementation((cfg) => ({})),
});

Object.defineProperty(window, "RTCSessionDescription", {
  writable: true,
  value: jest.fn().mockImplementation((desc) => {
    return { sdp: desc };
  }),
});

const sdp = {
  sdp: "fakesdp1",
  type: "offer",
};

const sdp2 = {
  sdp: "fakesdp2",
  type: "offer",
};
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
  sdp,
];

const jsepProtocol = (messages) => {
  RtcService.mockClear();
  EmulatorControllerService.mockClear();

  let receive = jest.fn();
  for (var i = 0; i < messages.length; i++) {
    receive.mockImplementationOnce(receiveJsepMessage(messages[i]));
  }
  RtcService.mockImplementation(() => {
    return {
      requestRtcStream: requestRtcStream,
      receiveJsepMessage: receive,
      sendJsepMessage: jest.fn((msg) => {
        console.log("Sending " + msg);
      }),
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
    // All candidates are queued.
    expect(jsep.old_emu_patch.candidates.length).toBe(2);
    expect(jsep.old_emu_patch.sdp).not.toBeNull();
  });

  it("Flush message queue after bye", () => {
    let msg = Array.from(candidates_and_sdp);
    msg.push({ bye: "we're done" });
    const { jsep } = jsepProtocol(msg);

    jsep.startStream();
    expect(jsep.old_emu_patch.candidates.length).toBe(0);
    expect(jsep.old_emu_patch.sdp).toBe(null);
    expect(jsep.peerConnection).toBe(null);
  });

  it("Out of order messages handled after start", () => {
    let msg = Array.from(candidates_and_sdp);
    msg.push({ start: { foo: "bar" } });
    const { jsep } = jsepProtocol(msg);

    jsep.startStream();
    expect(jsep.old_emu_patch.candidates.length).toBe(0);
    expect(jsep.peerConnection).not.toBeNull();
    expect(jsep.peerConnection.currentRemoteDescription).not.toBeNull();
    // Peer connection was initialized with rtc config
    expect(RTCPeerConnection.mock.calls[0][0]).toStrictEqual({ foo: "bar" });
  });

  it.skip("Never handles sdp twice / (async problem)", async () => {
    // 2nd jsep gets dropped.
    let { rtc, jsep } = jsepProtocol([sdp, sdp2, { start: { foo: "bar" } }]);
    jsep.startStream();
    expect(jsep.old_emu_patch.candidates.length).toBe(0);
    expect(jsep.old_emu_patch.sdp).toBeNull();
    expect(jsep.old_emu_patch.answer).toBe(true);
    expect(jsep.peerConnection).not.toBeNull();
    expect(jsep.peerConnection.currentRemoteDescription.sdp.sdp).toBe(sdp.sdp);
    // Peer connection was initialized with rtc config
    expect(RTCPeerConnection.mock.calls[0][0]).toStrictEqual({ foo: "bar" });
    expect(rtc.sendJsepMessage.mock.calls[0]).toBe(1);
  });
});
