FROM debian:buster-slim

ARG VERS=23.1
ARG ARCH=linux-x86_64
ARG GRPC_WEB=1.4.2
ARG JS=3.21.2

RUN echo "Building protoc Cloud Builder ${VERS}-${ARCH}" && \
    apt-get update && \
    apt-get install wget unzip make g++ -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN wget "https://github.com/protocolbuffers/protobuf/releases/download/v${VERS}/protoc-${VERS}-${ARCH}.zip" && \
    unzip "protoc-${VERS}-${ARCH}.zip" -d protoc && rm "protoc-${VERS}-${ARCH}.zip" && \
    wget "https://github.com/grpc/grpc-web/releases/download/${GRPC_WEB}/protoc-gen-grpc-web-${GRPC_WEB}-$(printf $ARCH | sed s/aarch_64/aarch64/)" -O /protoc/bin/protoc-gen-grpc-web && \
    chmod a+x /protoc/bin/protoc-gen-grpc-web && \
    wget "https://github.com/protocolbuffers/protobuf-javascript/releases/download/v${JS}/protobuf-javascript-${JS}-${ARCH}.zip" && \
    unzip "protobuf-javascript-${JS}-${ARCH}.zip" -d protoc-gen-js && rm "protobuf-javascript-${JS}-${ARCH}.zip"

ENV PATH=$PATH:/protoc/bin/:/protoc-gen-js/bin/

ENTRYPOINT ["protoc"]
CMD ["--help"]
