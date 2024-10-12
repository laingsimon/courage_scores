param($PublishDir)

$FilesToCopyIntoBrand = "layout.css","web.config","manifest.json","host.html","parentHeight.js"
$WorkingDirectory = (Get-Item .).FullName
$RegexSingleLine=[System.Text.RegularExpressions.RegexOptions]::Singleline
$BuildDir="$($WorkingDirectory)/$($PublishDir)"
$blue="`e[0;36m"
$green="`e[0;32m"
$reset="`e[0m"

function Get-BuiltContent([string] $File)
{
    Write-Output "Getting built content from $($green)$($File)$($reset)"
    $AllContent = Get-Content -Path $File -Raw -Encoding UTF8
    $Match = [System.Text.RegularExpressions.Regex]::Match($AllContent, "<\/title>(.+)<\/head>", $RegexSingleLine)
    $BuiltContent = $Match.Groups[1].Value
    return $BuiltContent
}

function Set-BuiltContent([string] $File, [string] $Content)
{
    $AllContent = Get-Content -Path $File -Raw -Encoding UTF8
    $AllContent = [System.Text.RegularExpressions.Regex]::Replace($AllContent, "<\/title>(.+)<!-- Dynamic content end -->", "</title>$($Content)", $RegexSingleLine)

    $Brand = $([System.IO.Path]::GetFileName([System.IO.Path]::GetDirectoryName($File)))
    $FileName = $([System.IO.Path]::GetFileName($File))
    Write-Output "Writing whitelabel content to $($blue)$($Brand)$($reset)/$($green)$($FileName)$($reset)"
    [System.IO.File]::WriteAllText($File, $AllContent, [System.Text.Encoding]::UTF8)
}

function Remove-CustomHeaderFromWebConfig([string] $File)
{
    $AllContent = Get-Content -Path $File -Raw -Encoding UTF8
    $AllContent = [System.Text.RegularExpressions.Regex]::Replace($AllContent, "<customHeaders>(.+)<\/customHeaders>", "", $RegexSingleLine)

    $Brand = $([System.IO.Path]::GetFileName([System.IO.Path]::GetDirectoryName($File)))
    $FileName = $([System.IO.Path]::GetFileName($File))

    Write-Output "Writing updated $($green)web.config$($reset) to $($blue)$($Brand)$($reset)/$($green)$($FileName)$($reset)"
    [System.IO.File]::WriteAllText($File, $AllContent, [System.Text.Encoding]::UTF8)
}

$BuiltContent = Get-BuiltContent -File "$($BuildDir)/index.html"
Get-ChildItem -Path "$BuildDir" -Directory `
    | Where-Object {
        $Directory = $_
        return [System.IO.File]::Exists("$($Directory.FullName)/index.html")
    } `
    | ForEach-Object {
        $Directory = $_
        Write-Output "Replacing content in $($blue)$($Directory.Name)$($reset)"

        Set-BuiltContent -File "$($Directory.FullName)/index.html" -Content $BuiltContent
        $FilesToCopyIntoBrand | ForEach-Object {
            $FileToCopy = "$($WorkingDirectory)/public/$_"

            Write-Output "Copying $($green)$($_)$($reset) to $($blue)$($Directory.Name)$($reset)"
            Copy-Item $FileToCopy "$($Directory.FullName)/$_"
        }

        Remove-CustomHeaderFromWebConfig -File "$($Directory.FullName)/web.config"
    }
