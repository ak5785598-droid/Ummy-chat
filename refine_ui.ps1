# Fix RoomPlayDialog.tsx
$playPath = 'c:\Users\HP\Downloads\project\src\components\room-play-dialog.tsx'
$playContent = Get-Content -LiteralPath $playPath -Raw
# Clean up the bad insertion
$playContent = $playContent.Replace("onPlayLocalMusic?: (file: File) => void;`r`n  onClearChat?: () => void;", "onPlayLocalMusic?: (file: File) => void;")
$playContent = $playContent.Replace("toast({ title: 'Frequency Purified', description: 'Chat history cleared.' });`r`n    if (onClearChat) onClearChat();", "toast({ title: 'Frequency Purified', description: 'Chat history cleared.' });")
$playContent = $playContent.Replace("onPlayLocalMusic?: (file: File) => void;`r`n  onClearChat?: () => void;", "onPlayLocalMusic?: (file: File) => void;") # second pass just in case

# Now correctly add onClearChat
$playContent = $playContent.Replace('onPlayLocalMusic?: (file: File) => void;', "onPlayLocalMusic?: (file: File) => void;`n  onClearChat?: () => void;")
$playContent = $playContent.Replace("onPlayLocalMusic`r`n`: RoomPlayDialogProps) {", "onPlayLocalMusic,`n  onClearChat`n}: RoomPlayDialogProps) {") # Handle potential previous mess
$playContent = $playContent.Replace('onPlayLocalMusic', "onPlayLocalMusic, onClearChat") # Simpler for the destructuring
$playContent = $playContent.Replace("toast({ title: 'Frequency Purified', description: 'Chat history cleared.' });", "toast({ title: 'Frequency Purified', description: 'Chat history cleared.' });`n    if (onClearChat) onClearChat();")

# Fix RoomClient.tsx
$clientPath = 'c:\Users\HP\Downloads\project\src\app\rooms\[slug]\room-client.tsx'
$clientContent = Get-Content -LiteralPath $clientPath -Raw
# Add state
if ($clientContent -notlike "*showAnnouncements*") {
    $clientContent = $clientContent.Replace('const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());', "const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());`n  const [showAnnouncements, setShowAnnouncements] = useState(true);")
}
# Pass onClearChat prop
$clientContent = $clientContent.Replace('onPlayLocalMusic={handlePlayLocalMusic}', "onPlayLocalMusic={handlePlayLocalMusic}`n     onClearChat={() => setShowAnnouncements(false)}")

# Adjust background scaling
$clientContent = $clientContent.Replace('className="object-cover opacity-60 animate-in fade-in duration-1000"', 'className="object-contain opacity-60 animate-in fade-in duration-1000"')

# Save back with UTF8 no BOM (default for Set-Content usually ok)
$playContent.Replace("`r`n", "`n") | Set-Content -LiteralPath $playPath -NoNewline
$clientContent.Replace("`r`n", "`n") | Set-Content -LiteralPath $clientPath -NoNewline

Write-Host "Done! Files fixed."
