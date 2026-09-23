ARG BUILD_FROM=ghcr.io/home-assistant/aarch64-base:3.22
FROM golang:1.25-alpine AS builder

WORKDIR /src
RUN apk add --no-cache ca-certificates
COPY app/ .
RUN go build -trimpath -buildvcs=false -ldflags="-s -w" -o /out/archivist .

FROM ${BUILD_FROM}

RUN apk add --no-cache ca-certificates jq
COPY --from=builder /out/archivist /usr/bin/archivist
COPY run.sh /run.sh
RUN chmod +x /run.sh

EXPOSE 5056
CMD ["/run.sh"]
