# Registers the "911DrivingSlotCheck" scheduled task.
# Run this yourself in an elevated (Administrator) PowerShell window.
# It will prompt for your WINDOWS account password (not your driving-school password)
# so the task can run even when you're logged off.

$ErrorActionPreference = 'Stop'

$taskName = '911DrivingSlotCheck'
$scriptDir = $PSScriptRoot
$nodeExe = (Get-Command node).Source

$action = New-ScheduledTaskAction -Execute $nodeExe -Argument 'check-slots.js' -WorkingDirectory $scriptDir

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -MultipleInstances IgnoreNew

$cred = Get-Credential -Message "Enter your WINDOWS login (this account, not the driving school site) so the task can run while logged off"

Register-ScheduledTask -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -User $cred.UserName `
    -Password $cred.GetNetworkCredential().Password `
    -RunLevel Highest `
    -Force

Write-Host "Task '$taskName' registered. It will run every 30 minutes, logged on or not."
Write-Host "Test it immediately with: Start-ScheduledTask -TaskName '$taskName'"
