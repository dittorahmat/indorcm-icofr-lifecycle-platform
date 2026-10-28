<#
.SYNOPSIS
    Creates a new git worktree with branch and links node_modules automatically.
.EXAMPLE
    .\scripts\worktree-new.ps1 -Branch "perf/my-feature" -Path "..\my-worktree"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Branch,
    [Parameter(Mandatory=$true)]
    [string]$Path,
    [string]$Base = "HEAD"
)

$ErrorActionPreference = "Stop"

Write-Host "Creating git worktree at $Path on branch $Branch from $Base..." -ForegroundColor Cyan
git worktree add -b $Branch $Path $Base

$rootNodeModules = Join-Path (Get-Location) "node_modules"
$targetNodeModules = Join-Path $Path "node_modules"

if (Test-Path $rootNodeModules) {
    Write-Host "Linking node_modules junction to $targetNodeModules..." -ForegroundColor Cyan
    cmd /c mklink /J "$targetNodeModules" "$rootNodeModules"
}

Write-Host "Worktree ready at $Path" -ForegroundColor Green
