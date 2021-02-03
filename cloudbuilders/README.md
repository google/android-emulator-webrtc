# protoc with grpc-web

This tool defines a custom build step that allows the Cloud Build worker to run the
[protocol buffer compiler](https://github.com/protocolbuffers/protobuf), `protoc`.
with the protoc-gen-grpc-web plugin. You will need this builder to successfully compile
the distribution in the cloud.

## Building this builder

You will need to build this Builder and push it to a container registry before you may use it.
To build and push to Google Container Registry, run the following command in this directory:

```bash
gcloud builds submit . --config=cloudbuild.yaml
```

If you wish to specify a different version or architecture for the build, run the following:

```bash
gcloud builds submit . --config=cloudbuild.yaml --substitutions=_VERS=${VERS},_ARCH=${ARCH}
```

Where `${VERS}` and `${ARCH}` are defined to contain values for the release and architecture as listed on:

https://github.com/protocolbuffers/protobuf/releases

**NB** Due to inconsistent handling of URLs for release candidates, the build will fail when
referencing these ([issue](https://github.com/protocolbuffers/protobuf/issues/6522)).

