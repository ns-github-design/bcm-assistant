FROM node:22

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    apt-transport-https \
    gnupg \
    lsb-release \
    libc6 \
    libgcc-s1 \
    libgssapi-krb5-2 \
    libicu72 \
    libssl3 \
    libstdc++6 \
    zlib1g \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pre-install globally
RUN npm install -g @azure/mcp@latest

# Verify binary exists after install
RUN azmcp --version || true

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS="http://+:5000" \
    AzureAd__Instance="https://login.microsoftonline.com/" \
    AzureAd__TenantId="d1d6dae2-2b71-414c-955c-230dc4440ef9" \
    AzureAd__ClientId="5c64ac36-268e-44bf-b4c7-34c4d941b4b9" \
    AZURE_MCP_DANGEROUSLY_DISABLE_HTTPS_REDIRECTION="true" \
    AZURE_MCP_DANGEROUSLY_ENABLE_FORWARDED_HEADERS="true" \
    AzureAd__ClientCredentials__0__SourceType="SignedAssertionFromManagedIdentity" \
    AzureAd__ClientCredentials__0__ManagedIdentityClientId="291e2a71-01d9-4e05-b8ba-4dadab196917"



EXPOSE 5000

# Use azmcp binary directly (not npx)
CMD ["azmcp", "server", "start", \
     "--transport", "http", \
     "--read-only"] 
    #  \
    #  "--dangerously-disable-http-incoming-auth"]


    