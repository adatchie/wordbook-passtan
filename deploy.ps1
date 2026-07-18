# Deploy web prototype to GitHub Pages (docs folder on main)
$ErrorActionPreference = 'Continue'
Set-Location 'C:\wordbook'

if (-not (Test-Path .git)) {
    git init
}

gh auth setup-git --hostname github.com

git config user.name "adatchie"
git config user.email "adatchie@gmail.com"

$remotes = git remote
if (-not ($remotes -contains 'origin')) {
    git remote add origin https://github.com/adatchie/wordbook
}

# Build a clean docs/ folder from web-prototype for GitHub Pages
if (Test-Path docs) {
    Remove-Item docs -Recurse -Force
}
New-Item -ItemType Directory -Path docs | Out-Null
robocopy web-prototype docs /E /XF test-node.js

git add .
git commit -m "Deploy web prototype to GitHub Pages via docs"
if (-not $?) {
    Write-Host "Commit skipped (nothing to commit or already committed)"
}
git push -u origin main
if (-not $?) {
    throw "Failed to push main"
}

$json = '{"source":{"branch":"main","path":"/docs"}}'
$tmp = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tmp -Value $json -NoNewline -Encoding ASCII

gh api repos/adatchie/wordbook/pages 2>$null
if ($?) {
    Write-Host "GitHub Pages already enabled; updating source"
    gh api repos/adatchie/wordbook/pages --method PUT --input $tmp
} else {
    Write-Host "Enabling GitHub Pages with docs source"
    gh api repos/adatchie/wordbook/pages --method POST --input $tmp
}

Remove-Item $tmp

Write-Host "Deployed to https://adatchie.github.io/wordbook"
Write-Host "It may take 1-2 minutes for GitHub Pages to publish."
