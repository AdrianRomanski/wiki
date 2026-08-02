# HTTP Network Adapter (`libs/wiki/infrastructure-http`)

`@wiki/infrastructure-http` implements the `HttpPort` interface for fetching remote web content, external documentation pages, and REST API resources over HTTP/HTTPS.

---

## 🎯 Architectural Layer & Domain Responsibility

- **Architectural Layer**: Infrastructure Adapter
- **Core Responsibility**: Provides concrete HTTP client capabilities using `fetch` or HTTP client libraries with error handling, timeout controls, and header management.
- **Implemented Port**: `HttpPort` (`@wiki/application-ports`)
- **Downstream Consumers**: Article extraction pipelines (`@wiki/application-article-extraction`), web research tools.

---

## ⚡ Domain Capabilities

- **Remote Resource Fetching**: Fetches external HTML pages, JSON payloads, or markdown documents over HTTPS.
- **Error & Timeout Handling**: Normalizes network timeouts, 404 responses, and HTTP errors into domain exceptions.

---

## 📁 Module Summary

| File / Folder | Primary Role & Responsibility |
| --- | --- |
| [`./src/lib/http-adapter.ts`](./src/lib/http-adapter.ts) | Concrete adapter class implementing `HttpPort`. |
