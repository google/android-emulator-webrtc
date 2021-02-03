FROM debian:buster-slim

ARG VERS=3.12.4
ARG ARCH=linux-x86_64
ARG GRPC_WEB=1.2.1

RUN echo "Building protoc Cloud Builder ${VERS}-${ARCH}" && \
    apt-get update -y && apt-get upgrade -y && \
    apt-get install wget unzip -y && \
    apt-get clean -y && \
    rm -rf /var/lib/apt/lists/* && \
    wget "https://github.com/protocolbuffers/protobuf/releases/download/v${VERS}/protoc-${VERS}-${ARCH}.zip" && \
    unzip "protoc-${VERS}-${ARCH}.zip" -d protoc && \
    wget "https://github.com/grpc/grpc-web/releases/download/${GRPC_WEB}/protoc-gen-grpc-web-${GRPC_WEB}-${ARCH}" -O /protoc/bin/protoc-gen-grpc-web && \
    chmod a+x /protoc/bin/protoc-gen-grpc-web && \
    rm "protoc-${VERS}-${ARCH}.zip"

ENV PATH=$PATH:/protoc/bin/
ENTRYPOINT ["protoc"]
CMD ["--help"]
