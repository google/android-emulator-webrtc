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
import { Badge } from "@material-ui/core";

jest.mock("../src/proto/emulator_web_client");

describe("Basic jsep protocol with polling.", () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    RtcService.mockClear();
    EmulatorControllerService.mockClear();
  });

  const guid = new Rtc.RtcId();
  guid.setGuid("abcde");

  const jsepMsg = new Rtc.JsepMsg();
  jsepMsg.setId(guid);
  jsepMsg.setMessage(JSON.stringify({ bye: "we are done here!" }));

  RtcService.mockImplementation(() => {
    return {
      requestRtcStream: jest.fn((request, metadata, callback) => {
        callback(null, guid);
      }),
      receiveJsepMessage: jest.fn((request, metadata, callback) => {
        callback(null, jsepMsg);
      }),
    };
  });
  const rtcServiceInstance = new RtcService("http://foo");
  const emulatorServiceInstance = new EmulatorControllerService("http://foo");
  const jsep = new JsepProtocol(
    emulatorServiceInstance,
    rtcServiceInstance,
    true
  );

  it("calls request rtc stream", () => {
    jsep.startStream();
    expect(rtcServiceInstance.requestRtcStream.mock.calls.length).toBe(1);
    expect(rtcServiceInstance.receiveJsepMessage.mock.calls.length).toBe(1);
  });

  it("Notifies listeners of a disconnect", () => {
    const disconnect = jest.fn();
    jsep.on("disconnected", disconnect);
    jsep.startStream();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
