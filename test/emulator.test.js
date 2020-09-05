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
import "@testing-library/jest-dom";
import "babel-polyfill";
import { EventEmitter } from "events";
import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import Emulator from "../src/components/emulator/emulator";
import * as Proto from "../src/proto/emulator_controller_pb";
import * as Rtc from "../src/proto/rtc_service_pb";
import {
  RtcService,
  EmulatorControllerService,
} from "../src/proto/emulator_web_client";

jest.mock("../src/proto/emulator_web_client");

// See https://github.com/testing-library/react-testing-library/issues/470
// As well as https://github.com/facebook/react/issues/10389
// All because of the "muted" tag on our video element inside webrtc_view
const renderIgnoringUnstableFlushDiscreteUpdates = (component) => {
  // tslint:disable: no-console
  const originalError = console.error;
  const error = jest.fn();
  console.error = error;
  const result = render(component);
  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith(
    "Warning: unstable_flushDiscreteUpdates: Cannot flush updates when React is already rendering.%s",
    expect.any(String)
  );
  console.error = originalError;
  // tslint:enable: no-console
  return result;
};

describe("The emulator", () => {
  let fakeScreen;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    RtcService.mockClear();
    EmulatorControllerService.mockClear();
  });

  test("Creates gRPC services", async () => {
    let state;
    renderIgnoringUnstableFlushDiscreteUpdates(
      <Emulator uri="/test" width={300} height={300} />
    );

    expect(EmulatorControllerService).toHaveBeenCalled();
    expect(RtcService).toHaveBeenCalled();
    // Shipped out a gps call
  });
  test("Tries to establish a webrtc connection", async () => {
    let state;

    renderIgnoringUnstableFlushDiscreteUpdates(
      <Emulator
        uri="/test"
        width={300}
        height={300}
        onStateChange={(e) => {
          state = e;
        }}
      />
    );

    await waitFor(() => state === "connecting");
    expect(RtcService).toHaveBeenCalled();
  });

  test("Sends a gps location to the emulator", async () => {
    // Let's go to Seattle!
    renderIgnoringUnstableFlushDiscreteUpdates(
      <Emulator
        uri="/test"
        width={300}
        height={300}
        gps={{ latitude: 47.6062, longitude: 122.3321 }}
      />
    );

    const setGps = EmulatorControllerService.mock.instances[0].setGps;
    expect(setGps).toHaveBeenCalled();

    const location = new Proto.GpsState();
    location.setLatitude(47.6062);
    location.setLongitude(122.3321);
    location.setAltitude(undefined);
    location.setBearing(undefined);
    location.setSpeed(undefined);
    expect(setGps).toHaveBeenCalledWith(location);
  });

  test("The png view requests images", async () => {
    let pngCall = false
    EmulatorControllerService.mockImplementation(() => {
      return {
        streamScreenshot: jest.fn((request) => {
            pngCall = true
          return { on: jest.fn(), cancel: jest.fn() };
        }),
        getStatus: jest.fn(() => {}),
      };
    });

    render(<Emulator uri="/test" width={300} height={300} view="png" />);
    expect(pngCall).toBeTruthy()
  });
});
