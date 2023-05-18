import PropTypes from "prop-types";
import React, { useState, useEffect, useRef } from "react";
import * as Proto from "../../../proto/emulator_controller_pb";

const EmulatorPngView = ({
  emulator,
  onStateChange,
  poll,
  width,
  height,
  "data-testid": dataTestId,
}) => {
  const [png, setPng] = useState("");
  const [connect, setConnect] = useState("connecting");
  var screenShot = null;

  useEffect(() => {
    startStream();
    return () => {
      setConnect("disconnected");
      if (screenShot) {
        screenShot.cancel();
      }
    };
  }, [width, height]);

  useEffect(() => {
    console.log("Png state changed to: " + connect);
    if (onStateChange) {
      onStateChange(connect);
    }
  }, [connect]);

  const startStream = () => {
    setConnect("connecting");
    const request = new Proto.ImageFormat();
    if (!isNaN(width)) {
      request.setWidth(Math.floor(width));
    }
    if (!isNaN(height)) {
      request.setWidth(Math.floor(height));
    }

    if (poll && connect !== "disconnected") {
      emulator.getScreenshot(request, {}, (err, response) => {
        setConnect("connected");
        setPng("data:image/jpeg;base64," + response.getImage_asB64());
        startStream();
      });
    } else {
      var receivedImage = false;
      screenShot = emulator.streamScreenshot(request);
      screenShot.on("data", (response) => {
        receivedImage = true;
        setConnect("connected");
        setPng("data:image/jpeg;base64," + response.getImage_asB64());
      });
      screenShot.on("error", (e) => {
        console.warn("Screenshot stream broken", e);
        if (receivedImage) {
          setConnect("connecting");
          startStream();
        } else {
          setConnect("disconnected");
        }
      });
    }
  };

  const preventDragHandler = (e) => {
    e.preventDefault();
  };


  return (
    <div
      width={width}
      style={{
        display: "block",
        position: "relative",
        height: "100%",
        objectFit: "contain",
        objectPosition: "center",
      }}
      onDragStart={preventDragHandler}
    >
      <img
        src={png}
        width="100%"
        draggable="false"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
};

EmulatorPngView.propTypes = {
  emulator: PropTypes.object,
  onStateChange: PropTypes.func,
  poll: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  "data-testid": PropTypes.string,
};

export default EmulatorPngView;
