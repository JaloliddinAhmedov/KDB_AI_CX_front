# FinTech AI - Banking Customer Experience Platform

A enterprise-tier AI-Driven Customer Experience (CX) platform for banks, powered by Google Gemini AI, featuring an AI Training Center, Knowledge Base management, Live Banking Assistant (with Uzbek & English support), Transaction Risk Analyzer, and Support Ticket Co-Pilot.

---

## 📌 Architecture Overview

This project is designed as a **Full-Stack Application** with two implementation layers:

1. **Active Web Application**: Built with React/Express, Node.js, and Google Gemini `@google/genai` SDK.
2. **Spring Boot & Angular Architecture Guide**: Instructions for translating this system into Java Spring Boot (Backend) and Angular (Frontend) for corporate banking infrastructure.

---

## 🌐 Enterprise Proxy Configuration (Corporate Network Integration)

When working on a bank workstation connected behind an enterprise corporate proxy, all outbound API requests to Google Gemini must route through the proxy server.

### Option A: Running WITH Proxy (Ishdagi Kompyuter / Bank Proxysi Bilan)

To route Gemini requests through your company proxy, specify the proxy settings in your `.env` file or terminal environment:

#### 1. `.env` Faylida Sozlash:
```env
# Gemini API Key
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Proxy configuration (Bank / Enterprise Proxy)
HTTP_PROXY="http://proxy.yourbank.com:8080"
HTTPS_PROXY="http://proxy.yourbank.com:8080"
# Yoki maxsus proxy URL:
GEMINI_PROXY_URL="http://proxy.yourbank.com:8080"
```

#### 2. Linux / macOS Terminal Orqali Run Qilish:
```bash
export HTTP_PROXY="http://proxy.yourbank.com:8080"
export HTTPS_PROXY="http://proxy.yourbank.com:8080"
npm run dev
```

#### 3. Windows PowerShell Orqali Run Qilish:
```powershell
$env:HTTP_PROXY="http://proxy.yourbank.com:8080"
$env:HTTPS_PROXY="http://proxy.yourbank.com:8080"
npm run dev
```

---

### Option B: Running WITHOUT Proxy (Proxysiz Oddiy Rejim)

If you are running the application from a home network, cloud server, or direct connection without a proxy, simply leave proxy variables empty or omitted in `.env`:

```env
# Direct connection (No proxy required)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Proxy variables can be commented out or omitted:
# HTTP_PROXY=
# HTTPS_PROXY=
```

---

## 🍃 Spring Boot (Java) Backend Integration with Proxy

When implementing this backend in **Spring Boot (Java)** for your bank project:

### 1. Spring Boot Proxy Configuration (`application.yml`)
```yaml
gemini:
  api:
    key: ${GEMINI_API_KEY}
    url: https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent
proxy:
  enabled: true # Set to false when running WITHOUT proxy
  host: proxy.yourbank.com
  port: 8080
```

### 2. Spring Boot `RestTemplate` / `WebClient` with Proxy Bean (`GeminiConfig.java`)
```java
package com.bank.fintech.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.net.InetSocketAddress;
import java.net.Proxy;

@Configuration
public class GeminiConfig {

    @Value("${proxy.enabled:false}")
    private boolean proxyEnabled;

    @Value("${proxy.host:}")
    private String proxyHost;

    @Value("${proxy.port:8080}")
    private int proxyPort;

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        
        if (proxyEnabled && proxyHost != null && !proxyHost.isEmpty()) {
            Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyHost, proxyPort));
            requestFactory.setProxy(proxy);
            System.out.println("[Spring Boot] Operating via Proxy: " + proxyHost + ":" + proxyPort);
        } else {
            System.out.println("[Spring Boot] Operating in Direct mode (No Proxy).");
        }

        return new RestTemplate(requestFactory);
    }
}
```

### 3. Java JVM System Arguments (Alternative)
You can also run Spring Boot with standard JVM proxy parameters:
```bash
# WITH PROXY:
java -Dhttps.proxyHost=proxy.yourbank.com -Dhttps.proxyPort=8080 -jar bank-app.jar

# WITHOUT PROXY:
java -jar bank-app.jar
```

---

## 🅰️ Angular Frontend Integration

In Angular, create an HTTP service to call the Spring Boot / Express backend API:

### `gemini-ai.service.ts`
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeminiAiService {
  private apiUrl = '/api/gemini';

  constructor(private http: HttpClient) {}

  sendChatMessage(message: string, history: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat`, { message, history });
  }

  extractFaqs(rawContent: string, url?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/extract-faq`, { rawContent, url });
  }

  analyzeTransactions(transactions: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/analyze-transaction`, { transactions });
  }
}
```

---

## 🚀 Running the Web Application

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
3. **Build Production Asset**:
   ```bash
   npm run build
   ```

---

## ✨ Features Included

- **AI Training Center**: Scraping web URLs, uploading PDF/CSV/TXT documents, and training Gemini Q&A knowledge vectors.
- **AI Customer Assistant**: Dual English & Uzbek banking support for mortgages, APY savings rates, and fraud alerts.
- **Transaction Search**: Real-time transaction filtering with automated Gemini Fraud & Risk audit.
- **Customer Support Co-Pilot**: Auto-drafting polite, compliance-checked support responses.
