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
import PropTypes from "prop-types";
import React from "react";
import useResizeObserver from "@react-hook/resize-observer";

function useSize(target, onResize) {
  const [size, setSize] = React.useState();

  React.useLayoutEffect(() => {
    if (target) {
      const newSize = target.getBoundingClientRect();
      console.log(`Resizing to ${JSON.stringify(newSize)}`)
      setSize(newSize);
      if (onResize) {
        onResize(newSize);
      }
    }
  }, [target]);

  // Where the magic happens
  useResizeObserver(target, (entry) => {
    setSize(entry.contentRect);
    if (onResize) {
      console.log(`Resizing to ${JSON.stringify(entry.contentRect)}`)
      onResize(entry.contentRect);
    }
  });
  return size;
}

function ResizingComponent({ children, onResize, "data-testid": dataTestId, }) {
  // const ref = useRef();
  const [target, setTarget] = React.useState();
  const size = useSize(target, onResize);

  return (
    <div style={{ width: "100%", height: "100%" }} ref={setTarget} data-testid={dataTestId}>
      <div style={{ width: size?.width, height: size?.height }}>{children}</div>
    </div>
  );
}

ResizingComponent.propTypes = {
  onResize: PropTypes.func,
  "data-testid": PropTypes.string,
};

export default ResizingComponent;
