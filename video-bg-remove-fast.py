"""
Fast Video BG Remover - Optimized for CPU
Uses u2net_human_seg model (faster) + lower processing resolution
"""
import sys, os, shutil, tempfile, subprocess
from pathlib import Path
from PIL import Image
import io

FFMPEG = r"C:\Users\HP\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"
PROGRESS_FILE = os.path.join(tempfile.gettempdir(), "rembg_progress.txt")

def main():
    if len(sys.argv) < 3:
        print("Usage: python video-bg-remove-fast.py input.mp4 output.webm")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    tmp_dir = tempfile.mkdtemp(prefix="rembg_")
    frames_in = os.path.join(tmp_dir, "frames")
    frames_out = os.path.join(tmp_dir, "nobg")
    os.makedirs(frames_in)
    os.makedirs(frames_out)

    print(f"[1/4] Extracting frames at 24fps (fewer frames = faster)...")
    subprocess.run([
        FFMPEG, "-i", input_path, "-vf", "fps=24,scale=512:-1",
        "-qscale:v", "2",
        os.path.join(frames_in, "frame_%06d.png")
    ], check=True, capture_output=True)

    frame_files = sorted(Path(frames_in).glob("*.png"))
    total = len(frame_files)
    print(f"[2/4] Removing background from {total} frames (model: u2net_human_seg)...")

    from rembg import remove, new_session
    session = new_session("u2net_human_seg")

    for i, fp in enumerate(frame_files):
        with open(fp, "rb") as f:
            input_data = f.read()
        output_data = remove(input_data, session=session, bgcolor=(0, 0, 0, 0))
        out_file = os.path.join(frames_out, fp.name)
        with open(out_file, "wb") as f:
            f.write(output_data)
        if (i + 1) % 10 == 0 or (i + 1) == total:
            pct = (i + 1) / total * 100
            print(f"  [{i+1}/{total}] {pct:.0f}%")

    print(f"\n[3/4] Rebuilding transparent video (VP9 + alpha)...")
    subprocess.run([
        FFMPEG, "-framerate", "24",
        "-i", os.path.join(frames_out, "frame_%06d.png"),
        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
        "-auto-alt-ref", "0",
        "-b:v", "2M",
        "-y", output_path
    ], check=True, capture_output=True)

    print(f"[4/4] Cleaning up...")
    shutil.rmtree(tmp_dir, ignore_errors=True)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"\nDone! Output: {output_path} ({size_mb:.1f} MB)")

if __name__ == "__main__":
    main()
