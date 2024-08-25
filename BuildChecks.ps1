param([int] $ErrorThreshold, [int] $WarningThreshold)

Function Get-Files($MinLines, $MaxLines)
{
    # Write-Host "Finding files with > $($MinLines) lines and <= $($MaxLines)..."
    return Get-ChildItem -Recurse `
        | Where-Object { $_.Name.EndsWith(".cs") } `
        | Select-Object @{ label='name'; expression={$_.name} }, @{ label='lines'; expression={(Get-Content $_.FullName | Measure-Object -Line).Lines} } `
        | Where-Object { $_.lines -gt $MinLines -and $_lines -le $MaxLines } `
        | Sort-Object -descending -property 'lines' `
        | Select-Object @{ label='row'; expression = {"| $($_.name) | $($_.lines) |" } }
}

Function Print-Files($Files) 
{
    [Console]::Error.WriteLine("| File | Lines |")
    [Console]::Error.WriteLine("| --- | --- |")
    $Files | ForEach-Object { [Console]::Error.WriteLine($_.row) }
}

$FilesOverThreshold = Get-Files -MinLines $ErrorThreshold -MaxLines [int]::MaxValue
If ($ErrorThreshold -gt 0 -and $FilesOverThreshold.Length -gt 0)
{
    [Console]::Error.WriteLine("Files exceeding limit")
    Print-Files -Files $FilesOverThreshold
    [Console]::Error.WriteLine("There are $($FilesOverThreshold.Length) file/s that have more than $($ErrorThreshold) lines")
}

If ($ErrorThreshold -le 0 -or $ErrorThreshold -eq $null) 
{
    $FilesNearingLimit = Get-Files -MinLines $WarningThreshold -MaxLines [int]::MaxValue
}
else
{
    $FilesNearingLimit = Get-Files -MinLines $WarningThreshold -MaxLines $ErrorThreshold
}

If ($WarningThreshold -gt 0 -and $FilesNearingLimit.Length -gt 0)
{
    [Console]::Error.WriteLine("Files approaching limit")
    Print-Files -Files $FilesNearingLimit
}

Exit $FilesOverThreshold.Length
