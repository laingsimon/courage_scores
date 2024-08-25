param([int] $MaxLines)

Function Get-Files($MaxLines)
{
    return Get-ChildItem -Recurse `
        | Where-Object { $_.Name.EndsWith(".cs") } `
        | Select-Object @{ label='name'; expression={$_.name} }, @{ label='lines'; expression={(Get-Content $_.FullName | Measure-Object -Line).Lines} } `
        | Where-Object { $_.lines -gt $MaxLines } `
        | Sort-Object -descending -property 'lines' `
        | Select-Object @{ label='row'; expression = {"| $($_.name) | $($_.lines) |"} }
}

$Files = Get-Files -MaxLines $MaxLines -MinLines 0
If ($Files.Length -gt 0)
{
    [Console]::Error.WriteLine("| File | Lines |")
    [Console]::Error.WriteLine("| --- | --- |")
    $Files | ForEach-Object { [Console]::Error.WriteLine($_.row) }
    [Console]::Error.WriteLine("There are $($Files.Length) file/s that exceed the $($MaxLines) line count")
}
else
{
    $FilesNearingLimit = Get-Files -MaxLines ($MaxLines - 100)
    If ($FilesNearingLimit.Length -gt 0)
    {
        [Console]::Error.WriteLine("| File Nearing Limit | Lines |")
        [Console]::Error.WriteLine("| --- | --- |")
        $FilesNearingLimit | ForEach-Object { [Console]::Error.WriteLine($_.row) }
    }
    
    Write-Output "All files have fewer than $($MaxLines) lines"
}

Exit $Files.Length
