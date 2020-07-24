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

import * as Proto from "../../../proto/emulator_controller_pb";
import * as Rtc from "../../../proto/rtc_service_pb";

import JsepProtocol from "./jsep_protocol_driver.js";
import {
  RtcService,
  EmulatorControllerService,
} from "./emulator_web_client";
import { Badge } from "@material-ui/core";

jest.mock("./emulator_web_client");

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  RtcService.mockClear();
  EmulatorControllerService.mockClear();
});

describe("Basic jsep protocol with polling.", () => {
  const rtcServiceInstance = new RtcService("http://foo");
  const emulatorServiceInstance = new EmulatorControllerService("http://foo");
  const jsep = new JsepProtocol(emulatorServiceInstance, rtcServiceInstance, true);

  const guid = new Rtc.RtcId();
  guid.setGuid("abcde");

  const jsepMsg = new Rtc.JsepMsg();
  jsepMsg.setId(guid);
  jsepMsg.setMessage(JSON.stringify({bye: 'we are done here!'}));

  const requestRtcStream = jest.fn((request, metadata, callback) => {
    callback(null, guid);
  });
  const receiveJsepMessage = jest.fn((request, metadata, callback) => {
     callback(null, jsepMsg);
  });


  rtcServiceInstance.requestRtcStream = requestRtcStream;
  rtcServiceInstance.receiveJsepMessage = receiveJsepMessage;

  it("calls request rtc stream", () => {
    jsep.startStream();
    expect(requestRtcStream).toHaveBeenCalledTimes(1);
    expect(receiveJsepMessage).toHaveBeenCalledTimes(1);
  });

  it("Notifies listeners of a disconnect", ()=> {
    const disconnect  = jest.fn();
    jsep.on("disconnected", disconnect);
    jsep.startStream();
    expect(disconnect).toHaveBeenCalledTimes(1);
  })

});
