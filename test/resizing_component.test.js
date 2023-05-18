
/**
 * @jest-environment jsdom
 */
/*
 * Copyright 2023 The Android Open Source Project
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
import React from "react";
import { render, act, waitFor, fireEvent, getByText } from "@testing-library/react";
import ResizingComponent from "../src/components/emulator/views/resizing_component"
import { toBeInTheDocument, toHaveBeenCalledWith } from '@testing-library/jest-dom';



describe("ResizingComponent", () => {
  it("renders children", () => {
    const { getByText } = render(
      <ResizingComponent>
        <p>Hello, world!</p>
      </ResizingComponent>
    );
    expect(getByText("Hello, world!")).toBeInTheDocument();
  });

});
