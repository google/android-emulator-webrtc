/*
 * Copyright 2019 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import React, { useEffect, useRef, useState } from "react";

const EmulatorWebrtcView = ({
  jsep,
  onStateChange,
  onAudioStateChange,
  muted,
  volume,
  onError,
}) => {
  const [audio, setAudio] = useState(false);
  const videoRef = useRef(null);
  const [connect, setConnect] = useState("connecting");


  useEffect(() => {
    console.log("Webrtc state changed to: " + connect);
    if (onStateChange) {
      onStateChange(connect);
    }
  }, [connect]);


  useEffect(() => {
    console.log("Webrtc audio state changed to: " + audio);
    if (onAudioStateChange) {
      onAudioStateChange(audio);
    }
  }, [audio]);

  const onDisconnect = () => {
    setConnect("disconnected");
    setAudio(false);
  };

  const onConnect = (track) => {
    setConnect("connected");
    const video = videoRef.current;
    if (!video) {
      // Component was unmounted.
      return;
    }

    if (!video.srcObject) {
      video.srcObject = new MediaStream();
    }
    video.srcObject.addTrack(track);
    if (track.kind === "audio") {
      setAudio(true);
    }
  };

  const safePlay = () => {
    const video = videoRef.current;
    if (!video) {
      // Component was unmounted.
      return;
    }

    const possiblePromise = video.play();
    if (possiblePromise) {
      possiblePromise
        .then((_) => {
          console.debug("Automatic playback started!");
        })
        .catch((error) => {
          // Notify listeners that we cannot start.
          onError(error);
        });
    }
  };

  const onCanPlay = () => {
    safePlay();
  };

  const onContextMenu = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    jsep.on("connected", onConnect);
    jsep.on("disconnected", onDisconnect);
    jsep.startStream()

    setConnect("connecting");

    return () => {
      jsep.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      style={{
        display: "block",
        position: "relative",
        width: "100%",
        height: "100%",
        objectFit: "contain",
        objectPosition: "center",
      }}
      volume={volume}
      muted={muted}
      onContextMenu={onContextMenu}
      onCanPlay={onCanPlay}
    />
  );
};

EmulatorWebrtcView.propTypes = {
  jsep: PropTypes.object,
  onStateChange: PropTypes.func,
  onAudioStateChange: PropTypes.func,
  muted: PropTypes.bool,
  volume: PropTypes.number,
  onError: PropTypes.func,
};

EmulatorWebrtcView.defaultProps = {
  muted: true,
  volume: 1.0,
  onError: (e) => console.error("WebRTC error: " + e),
  onAudioStateChange: (e) =>
    console.log("Webrtc audio became available: " + e),
};

export default EmulatorWebrtcView;

