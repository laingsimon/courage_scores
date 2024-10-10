$FilesToCopyIntoBrand = "layout.css","web.config","manifest.json","host.html","parentHeight.js"
$WorkingDirectory = (Get-Item .).FullName
$RegexSingleLine=[System.Text.RegularExpressions.RegexOptions]::Singleline

function Get-BuiltContent([string] $File)
{
    $AllContent = Get-Content -Path $File -Raw -Encoding UTF8
    $Match = [System.Text.RegularExpressions.Regex]::Match($AllContent, "<\/title>(.+)<\/head>", $RegexSingleLine)
    $BuiltContent = $Match.Groups[1].Value
    return $BuiltContent
}

function Set-BuiltContent([string] $File, [string] $Content)
{
    $AllContent = Get-Content -Path $File -Raw -Encoding UTF8
    $AllContent = [System.Text.RegularExpressions.Regex]::Replace($AllContent, "<\/title>(.+)<!-- Dynamic content end -->", "</title>$($Content)", $RegexSingleLine)

    Write-Host "Writing whitelabel content to $($File)"
    [System.IO.File]::WriteAllText($File, $AllContent, [System.Text.Encoding]::UTF8)
}

function Remove-CustomHeaderFromWebConfig([string] $File)
{
    $AllContent = Get-Content -Path $File -Raw -Encoding UTF8
    $AllContent = [System.Text.RegularExpressions.Regex]::Replace($AllContent, "<customHeaders>(.+)<\/customHeaders>", "", $RegexSingleLine)

    Write-Host "Writing updated web.config to $($File)"
    [System.IO.File]::WriteAllText($File, $AllContent, [System.Text.Encoding]::UTF8)
}

$BuiltContent = Get-BuiltContent -File "$($WorkingDirectory)/index.html"
Get-ChildItem -Path "$($WorkingDirectory)/public" -Directory `
    | Where-Object {
        $Directory = $_
        return [System.IO.File]::Exists("$($Directory.FullName)/index.html")
    } `
    | ForEach-Object {
        $Directory = $_
        Write-Host "Replacing content in $($Directory.Name)"

        Set-BuiltContent -File "$($Directory.FullName)/index.html" -Content $BuiltContent
        $FilesToCopyIntoBrand | ForEach-Object {
            $FileToCopy = "$($WorkingDirectory)/public/$_"

            Write-Host "Copying $($_) to $($Directory.Name)"
            Copy-Item $FileToCopy "$($Directory.FullName)/$_"
        }

        Remove-CustomHeaderFromWebConfig -File "$($Directory.FullName)/web.config"
    }