FROM golang:1.25-alpine AS builder

WORKDIR /src
RUN apk add --no-cache ca-certificates
COPY app/ .
RUN go mod tidy
RUN go build -trimpath -buildvcs=false -ldflags="-s -w" -o /out/archivist .

FROM alpine:3.22

ARG BUILD_VERSION=dev
ARG BUILD_ARCH
LABEL io.hass.version="${BUILD_VERSION}" io.hass.type="app" io.hass.arch="${BUILD_ARCH}"

RUN apk add --no-cache ca-certificates jq ffmpeg
COPY --from=builder /out/archivist /usr/bin/archivist
COPY run.sh /run.sh
RUN chmod +x /run.sh

EXPOSE 5056
CMD ["/run.sh"]
