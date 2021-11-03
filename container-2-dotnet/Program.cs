var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello from the .NET service in Azure Container Apps!");

app.Run();
