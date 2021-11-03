# Azure Container Apps Sample - multi-container communication

The following sample shows how to use Azure Container Apps to have one container call another within the environment.  This is possible both with or without [Dapr](https://dapr.io).  Dapr will provide mTLS, auto-retries, and additional telemetry if enabled.  

The `nodeApp` (container-1-node) is an express.js API that will call a `/hello` endpoint.  This route will call the `dotnetApp` (container-2-dotnet) to return a message.  
  
Without Dapr - `main` branch  
With Dapr - `dapr` branch

I can call the dotnet-app from the node-app by calling it's FQDN. Even though I use the FQDN, calls within the environment will stay within the environment and network traffic will not leave.

```js
const dotnetFQDN = process.env.DOTNET_FQDN;
// ...
var data = await axios.get(`http://${dotnetFQDN}`);
res.send(`${JSON.stringify(data.data)}`);
```
  
## Deploy and Run

### Deploy via GitHub Actions (recommended)

1. Fork the sample repo
2. Create the following required [encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-an-environment) for the sample

  | Name | Value |
  | ---- | ----- |
  | AZURE_CREDENTIALS | The JSON credentials for an Azure subscription. [Learn more](https://docs.microsoft.com/azure/developer/github/connect-from-azure?tabs=azure-portal%2Cwindows#create-a-service-principal-and-add-it-as-a-github-secret) |
  | RESOURCE_GROUP | The name of the resource group to create |
  | PACKAGES_TOKEN | A GitHub personal access token with the `packages:read` scope. [Learn more](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) |

### Deploy via CLI

```bash
# Login to the CLI
az login
az extension add \
  --source https://workerappscliextension.blob.core.windows.net/azure-cli-extension/containerapp-0.2.0-py2.py3-none-any.whl
az provider register --namespace Microsoft.Web

# Create a resource group
az group create \
  --name 'sample-rg' \
  --location canadacentral

az monitor log-analytics workspace create \
  --resource-group 'sample-rg' \
  --workspace-name 'logs-for-sample'

LOG_ANALYTICS_WORKSPACE_CLIENT_ID=`az monitor log-analytics workspace show --query customerId -g $RESOURCE_GROUP -n $LOG_ANALYTICS_WORKSPACE --out tsv`
LOG_ANALYTICS_WORKSPACE_CLIENT_SECRET=`az monitor log-analytics workspace get-shared-keys --query primarySharedKey -g $RESOURCE_GROUP -n $LOG_ANALYTICS_WORKSPACE --out tsv`

# Create a container app environment
az containerapp env create \
  --name 'sample-env'\
  --resource-group 'sample-rg' \
  --logs-workspace-id $LOG_ANALYTICS_WORKSPACE_CLIENT_ID \
  --logs-workspace-key $LOG_ANALYTICS_WORKSPACE_CLIENT_SECRET \
  --location canadacentral

# Deploy the container-2-dotnet dotnet-app
az containerapp create \
  --name dotnet-app \
  --resource-group 'sample-rg' \
  --environment 'sample-env' \
  --image 'ghcr.io/jeffhollan/container-sample-node-to-csharp/dotnet:main' \
  --target-port 80 \
  --ingress 'internal'

DOTNET_FQDN=az containerapp show \
  --resource-group 'sample-rg' \
  --name dotnet-app \
  --query configuration.ingress.fqdn

# Deploy the container-1-node node-app
az containerapp create \
  --name node-app \
  --resource-group 'sample-rg' \
  --environment 'sample-env' \
  --image 'ghcr.io/jeffhollan/container-sample-node-to-csharp/node:main' \
  --target-port 3000 \
  --ingress 'external' \
  --environment-variables DOTNET_FQDN=$DOTNET_FQDN
  --query configuration.ingress.fqdn
```

