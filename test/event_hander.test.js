
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

import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import withMouseKeyHandler from "../src/components/emulator/views/event_handler";
import * as Proto from "../src/proto/emulator_controller_pb";
import * as Rtc from "../src/proto/rtc_service_pb";

import JsepProtocol from "../src/components/emulator/net/jsep_protocol_driver";
import {
  RtcService,
  EmulatorControllerService,
} from "../src/proto/emulator_web_client";

jest.mock("../src/proto/emulator_web_client");
jest.mock("../src/components/emulator/net/jsep_protocol_driver");

class FakeEmulator extends React.Component {
  render() {
    return (
      <div
        data-testid="fake"
        style={{ height: "200px", width: "200px", backgroundColor: "#555" }}
      ></div>
    );
  }
}

const fakeMouseEvent = (tp, x, y, props = {}) => {
  const event = new MouseEvent(tp, {
    bubbles: true,
    cancelable: true,
    ...props,
  });

  Object.defineProperty(event, "offsetX", { get: () => x });
  Object.defineProperty(event, "offsetY", { get: () => y });
  return event;
};

const fakeTouchEvent = (tp, x, y, force, props = {}) => {
  const event = new TouchEvent(tp, {
    bubbles: true,
    cancelable: true,
    ...props,
  });

  Object.defineProperty(event, "changedTouches", {
    get: () => [
      { clientX: x, clientY: y, radiusX: 4, radiusY: 4, force: force },
    ],
  });
  return event;
};

const TestView = withMouseKeyHandler(FakeEmulator);
describe("The event handler", () => {
  const rtcServiceInstance = new RtcService("http://foo");
  const emulatorServiceInstance = new EmulatorControllerService("http://foo");
  let jsep, fakeScreen;

  beforeEach(() => {
    jsep = new JsepProtocol(emulatorServiceInstance, rtcServiceInstance, true);

    render(<TestView emulator={emulatorServiceInstance} jsep={jsep} />);
    fakeScreen = screen.getByTestId("fake").parentElement;
    Object.defineProperty(fakeScreen, "clientWidth", { get: () => 200 });
    Object.defineProperty(fakeScreen, "clientHeight", { get: () => 200 });

    expect(fakeScreen).toBeInTheDocument();
  });

  test("Forwards mouse events", () => {
    fireEvent(fakeScreen, fakeMouseEvent("mousedown", 10, 10));
    fireEvent(fakeScreen, fakeMouseEvent("mouseup", 20, 20));

    // Shipped out a mouse event
    expect(jsep.send.mock.calls[0][0]).toBe("mouse");
    expect(jsep.send).toHaveBeenCalledTimes(2);
  });

  test("Forwards keyboard events", () => {
    fireEvent.keyDown(fakeScreen, { key: "Enter", code: "Enter" });
    fireEvent.keyUp(fakeScreen, { key: "Enter", code: "Enter" });

    // Shipped out a keyboard event
    expect(jsep.send.mock.calls[0][0]).toBe("keyboard");
    expect(jsep.send).toHaveBeenCalledTimes(2);
  });

  test("Forwards touch events", () => {
    fireEvent(fakeScreen, fakeTouchEvent("touchstart", 10, 10, 1));
    fireEvent(fakeScreen, fakeTouchEvent("touchmove", 20, 20, 2));
    fireEvent(fakeScreen, fakeTouchEvent("touchend", 30, 30, 0));

    // Shipped out a touch event
    expect(jsep.send.mock.calls[0][0]).toBe("touch");
    expect(jsep.send).toHaveBeenCalledTimes(3);
  });

  test("Normalizes touch pressure of 1.0 to EV_MAX", () => {
    fireEvent(fakeScreen, fakeTouchEvent("touchstart", 10, 10, 1.0));

    // EV_MAX = 0x7fff
    expect(jsep.send.mock.calls[0][1]["array"].flat(3)[3]).toBe(0x7fff);
  });


  test("Normalizes touch pressure of 0.0 to EV_MIN", () => {
    fireEvent(fakeScreen, fakeTouchEvent("touchstart", 10, 10, 0.0));

    // So the result we test against is a protobuf message. Protobuf
    // is optimized to not ship the value 0 and will set it to "null".
    expect(jsep.send.mock.calls[0][1]["array"].flat(3)[3]).toBe(null);
  });

  test("Normalizes touch pressure of 0.5 to an integer of half EV_MAX", () => {
    fireEvent(fakeScreen, fakeTouchEvent("touchstart", 10, 10, 0.5));
    expect(jsep.send.mock.calls[0][1]["array"].flat(3)[3]).toBe(16384);
  });
});
