var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello from the .NET 6 container in Azure Container Apps with Dapr!");

app.Run();