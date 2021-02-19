/*
 * Copyright 2021 The Android Open Source Project
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
import React from "react";
import EmulatorPngView from "../src/components/emulator/views/simple_png_view";
import { resize } from "./fake_events";
import { render, screen } from "@testing-library/react";
import { EmulatorControllerService } from "../src/proto/emulator_web_client";
import { EventEmitter } from "events";

jest.mock("../src/proto/emulator_web_client");

const googleLogo =
  "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";
const googleImage = new Proto.Image();
googleImage.setImage(Uint8Array.from(atob(googleLogo), (c) => c.charCodeAt(0)));

const stream = new EventEmitter();
describe("A simple png view", () => {
  EmulatorControllerService.mockImplementation(() => {
    let count = 0;
    return {
      getScreenshot: jest.fn((a, b, response) => {
        count++;
        if (count < 2) response(null, googleImage);
      }),
      streamScreenshot: jest.fn((request) => {
        stream.removeAllListeners();
        return {
          on: (name, fn) => {
            stream.on(name, fn);
          },
          cancel: jest.fn(),
        };
      }),
      getStatus: jest.fn(() => {}),
    };
  });

  beforeEach(()=>{
    stream.removeAllListeners();
  })

  it("Get screenshot renders an image.", () => {
    const emulatorServiceInstance = new EmulatorControllerService("http://foo");
    const { container } = render(
      <EmulatorPngView emulator={emulatorServiceInstance} poll={true} />
    );
    const pngView = container.querySelector("img");
    expect(pngView.src).toBe("data:image/jpeg;base64," + googleLogo);
  });

  it("A resize triggers a new stream request.", () => {
    const emulatorServiceInstance = new EmulatorControllerService("http://foo");
    render(
      <div data-testid="pngdiv">
        <EmulatorPngView emulator={emulatorServiceInstance} />
      </div>
    );

    // Initial stream request + resize event after mount.
    expect(emulatorServiceInstance.streamScreenshot).toHaveBeenCalledTimes(2);

    let pngview = screen.getByTestId("pngdiv").childNodes[0];
    pngview.getBoundingClientRect = jest.fn();
    pngview.getBoundingClientRect.mockReturnValueOnce({
      width: 120,
      height: 120,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    });

    // A resize triggers a new stream request.
    resize(200, 300);
    expect(emulatorServiceInstance.streamScreenshot).toHaveBeenCalledTimes(3);
  });


  it("Has a connected state after the first image arrives", () => {
    const emulatorServiceInstance = new EmulatorControllerService("http://foo");
    const changeState = jest.fn()
    render(<EmulatorPngView emulator={emulatorServiceInstance} onStateChange={changeState}/>);
    expect(changeState).toHaveBeenCalledWith("connecting");
    stream.emit("data", googleImage);
    expect(changeState).toHaveBeenCalledWith("connected");
  });

  it("Attempts to reconnect if the server disconnects", () => {
    const emulatorServiceInstance = new EmulatorControllerService("http://foo");
    render(<EmulatorPngView emulator={emulatorServiceInstance} />);
    expect(emulatorServiceInstance.streamScreenshot).toHaveBeenCalledTimes(2);
    stream.emit("data", googleImage);
    stream.emit("error", "fda");
    expect(emulatorServiceInstance.streamScreenshot).toHaveBeenCalledTimes(3);
  });

  it("Gives up on the second failure.", () => {
    const emulatorServiceInstance = new EmulatorControllerService("http://foo");
    const changeState = jest.fn()
    render(<EmulatorPngView emulator={emulatorServiceInstance} onStateChange={changeState}/>);
    expect(emulatorServiceInstance.streamScreenshot).toHaveBeenCalledTimes(2);

    // Connect
    stream.emit("data", googleImage);

    // First break, we attempt a reconnect.
    stream.emit("error", "fda");
    expect(emulatorServiceInstance.streamScreenshot).toHaveBeenCalledTimes(3);
    expect(changeState).not.toHaveBeenCalledWith("disconnected");

    // We could not reconnect, so we fail.
    stream.emit("error", "fda");
    expect(changeState).toHaveBeenCalledWith("disconnected");
  });
});
