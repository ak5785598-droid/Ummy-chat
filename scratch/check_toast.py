import os

def check_use_toast(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'useToast' in content and 'import' in content and 'use-toast' not in content:
                            print(f"Missing import in: {path}")
                        if 'useToast(' in content and 'const { toast } = useToast()' not in content:
                            # This might miss some cases, but let's see
                            if 'function useToast' not in content:
                                print(f"Missing initialization in: {path}")
                except Exception as e:
                    pass

check_use_toast('src')
