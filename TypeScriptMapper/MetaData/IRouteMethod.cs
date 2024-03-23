using Microsoft.AspNetCore.Mvc.Routing;
using TypeScriptMapper.Controllers;

namespace TypeScriptMapper.MetaData;

public interface IRouteMethod : ITypeScriptMember
{
    HttpMethodAttribute? RouteAttribute { get; }
    List<TypeScriptParameter> Parameters { get; }
    string? FileUploadPropertyName { get; }
    List<AddHeaderAttribute> Headers { get; }
}