$path = 'c:\Users\HP\Downloads\project\src\app\profile\[id]\page.tsx';
$content = Get-Content -Raw -LiteralPath $path;

# Fix Public Profile P tag (Line 262 approx)
$publicPTarget = '<p className="text-\[9px\] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity" onClick=\{handleCopyId\}>'
$publicPReplace = '<p className="flex items-center gap-2" onClick={handleCopyId}>'

# Fix Own Profile P tag (Line 513 approx)
$ownPTarget = '<p className="text-\[10px\] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity" onClick=\{\(\) =\> \{ if \(typeof navigator !== ''undefined'' && navigator\.clipboard\) \{ navigator\.clipboard\.writeText\(\(profile as any\)\.accountNumber\)\.then\(\(\) =\> toast\(\{title: ''ID Copied''\}\)\); \} \}\}>'
$ownPReplace = '<p className={cn("text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity", profile.idColor === "red" ? "text-red-500" : profile.idColor === "blue" ? "text-blue-500" : profile.idColor === "purple" ? "text-purple-600" : "text-gray-400")} onClick={() => { if (typeof navigator !== ''undefined'' && navigator.clipboard) { navigator.clipboard.writeText((profile as any).accountNumber).then(() => toast({title: ''ID Copied''})); } }}>'

# Clean up redundant span in Public (if any)
$redundantSpanTarget = '<span className=\{cn\("text-\[10px\] font-bold uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity", profile\.idColor === "red" \? "text-red-500" : profile\.idColor === "blue" \? "text-blue-500" : profile\.idColor === "purple" \? "text-purple-600" : "text-gray-400"\) \} onClick=\{handleCopyId\}>ID:\{profile\.accountNumber\} <Copy className="h-2\.5 w-2\.5 opacity-40" />\{profile\.isBudgetId && \(<Badge className="ml-1 bg-amber-500 h-3 text-\[7px\] px-1 text-white border-none shrink-0 pointer-events-none uppercase">BUDGET</Badge>\)\}</span>'
$redundantSpanReplace = '<span className={cn("text-[10px] font-bold uppercase tracking-tight", profile.idColor === "red" ? "text-red-500" : profile.idColor === "blue" ? "text-blue-500" : profile.idColor === "purple" ? "text-purple-600" : "text-gray-400")}>ID:{profile.accountNumber} <Copy className="h-2.5 w-2.5 opacity-40" />{profile.isBudgetId && (<Badge className="ml-1 bg-amber-500 h-3 text-[7px] px-1 text-white border-none shrink-0 pointer-events-none uppercase">BUDGET</Badge>)}</span>'

# Actually, I'll just use a much simpler regex for the P tags to avoid escaping hell
$content = $content -replace 'text-\[10px\] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity', 'text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity text-gray-400'

# Then replace the text-gray-400 with the conditional color
$content = $content -replace 'text-gray-400"(?= onClick)', '{cn("text-gray-400", profile.idColor === "red" ? "text-red-500" : profile.idColor === "blue" ? "text-blue-500" : profile.idColor === "purple" ? "text-purple-600" : "text-gray-400")}"'
# Wait, that might replace too much.

# I'll try one more time with a very targeted literal replace for the whole block
$content = $content.Replace('            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity" onClick={() => { if (typeof navigator !== ''undefined'' && navigator.clipboard) { navigator.clipboard.writeText((profile as any).accountNumber).then(() => toast({title: ''ID Copied''})); } }}>', '            <p className={cn("text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity", profile.idColor === "red" ? "text-red-500" : profile.idColor === "blue" ? "text-blue-500" : profile.idColor === "purple" ? "text-purple-600" : "text-gray-400")} onClick={() => { if (typeof navigator !== ''undefined'' && navigator.clipboard) { navigator.clipboard.writeText((profile as any).accountNumber).then(() => toast({title: ''ID Copied''})); } }}>')

# And for the public one
$content = $content.Replace('          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity" onClick={handleCopyId}>', '          <p className="flex items-center gap-2" onClick={handleCopyId}>')

$content | Set-Content -LiteralPath $path;
