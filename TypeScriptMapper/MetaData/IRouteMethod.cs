using Microsoft.AspNetCore.Mvc.Routing;

namespace TypeScriptMapper.MetaData;

public interface IRouteMethod : ITypeScriptMember
{
    HttpMethodAttribute? RouteAttribute { get; }
    List<TypeScriptParameter> Parameters { get; }
}