param($FilePath)

$BeginningToken="<!-- BEGIN LOCAL ONLY CONTENT -->"
$EndingToken="<!-- END LOCAL ONLY CONTENT -->"
$InsideBlock = $false

$FileContent = Get-Content -Path $FilePath
$FilteredContent = $FileContent | Where-Object {
    $Line = $_

    if ($Line.Trim() -eq $BeginningToken)
    {
        $InsideBlock = $true
    }
    elseif ($Line.Trim() -eq $EndingToken)
    {
        $InsideBlock = $false
    }
    else
    {
        return $Line
    }
}
$FilteredContent | Out-File -FilePath "$($FilePath)"