import re

file_path = r"c:\ansh jha app work\project\src\components\edit-profile-dialog.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Transform DialogContent and replace DialogHeader with Wafa-style header
pattern_header = re.compile(
    r'<DialogContent className="sm:max-w\[425px\].*?<ScrollArea className="max-h\[70vh\]">',
    re.DOTALL
)

new_header = """<DialogContent className="fixed inset-0 w-full h-full max-w-none bg-white text-black p-0 border-none m-0 rounded-none z-[100] flex flex-col font-sans">
      <form onSubmit={handleSave} className="flex flex-col h-full">
       {/*  Wafa Style Header */}
       <header className="px-5 pt-10 pb-4 flex items-center justify-between bg-white sticky top-0 z-[110] border-b border-gray-50 pt-safe shrink-0">
         <button type="button" onClick={() => setOpen(false)} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
         </button>
         
         <h1 className="text-[13px] font-black uppercase tracking-tight text-gray-900">Modify Persona</h1>
         
         <Button 
          type="submit" 
          disabled={isSubmitting || isUploading}
          className="h-10 px-6 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold uppercase text-[10px] shadow-lg active:scale-95 transition-all"
         >
          {isSubmitting ? <Loader className="h-3 w-3 animate-spin" /> : 'Save'}
         </Button>
       </header>

       <ScrollArea className="flex-1 overflow-y-auto no-scrollbar">"""

content = pattern_header.sub(new_header, content)

# 2. Remove DialogFooter and the extra form/dialog closing tags inside it
pattern_footer = re.compile(
    r'<DialogFooter className="p-8 pt-4">.*?</DialogFooter>',
    re.DOTALL
)

content = pattern_footer.sub("", content)

# 3. Fix the closing tags at the bottom of the form
# We need to make sure the form and ScrollArea close correctly
# In the original file, it was </ScrollArea> then DialogFooter then </form> then </DialogContent>
# In our new version, it should be </ScrollArea> then </form> then </DialogContent>

# Already handled by removing DialogFooter if </form> and </DialogContent> were outside it.
# Let's check the current tail.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Redesign applied successfully.")
