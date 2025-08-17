param($PublishDir, $RobotsTag)

$FilesToCopyIntoBrand = "web.config","robots.txt","layout.css","manifest.json","host.html","parentHeight.js","privacy-policy.html","terms-of-service.html"
$WorkingDirectory = (Get-Item .).FullName
$RegexSingleLine=[System.Text.RegularExpressions.RegexOptions]::Singleline
$BuildDir="$($WorkingDirectory)/$($PublishDir)"
$blue="`e[0;36m"
$green="`e[0;32m"
$reset="`e[0m"

function Get-BuiltContent([string] $File)
{
    Write-Host "Getting built content from $($green)$($File)$($reset)"
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
    Write-Host "Writing whitelabel content to $($blue)$($Brand)$($reset)/$($green)$($FileName)$($reset)"
    [System.IO.File]::WriteAllText($File, $AllContent, [System.Text.Encoding]::UTF8)
}

function Set-RobotsTagHeaderInWebConfig([string] $File)
{
    $AllContent = Get-Content -Path $File -Raw -Encoding UTF8
    $AllContent = [System.Text.RegularExpressions.Regex]::Replace($AllContent, "$RobotsTag", $RobotsTag, $RegexSingleLine)

    $Brand = $([System.IO.Path]::GetFileName([System.IO.Path]::GetDirectoryName($File)))
    $FileName = $([System.IO.Path]::GetFileName($File))

    Write-Host "Writing updated $($green)web.config$($reset) to $($blue)$($Brand)$($reset)/$($green)$($FileName)$($reset)"
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
        Write-Host "Replacing content in $($blue)$($Directory.Name)$($reset)"

        Set-BuiltContent -File "$($Directory.FullName)/index.html" -Content $BuiltContent
        $FilesToCopyIntoBrand | ForEach-Object {
            $FileToCopy = "$($WorkingDirectory)/public/$_"

            Write-Host "Copying $($green)$($_)$($reset) to $($blue)$($Directory.Name)$($reset)"
            Copy-Item $FileToCopy "$($Directory.FullName)/$_"
        }

        Set-RobotsTagHeaderInWebConfig -File "$($Directory.FullName)/web.config"
    }
