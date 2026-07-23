"""
Video Background Remover
Usage: python video-bg-remove.py input.mp4 output.mp4
"""
import sys, os, shutil, tempfile, subprocess
from pathlib import Path
from rembg import remove
from PIL import Image

FFMPEG = r"C:\Users\HP\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe"

def main():
    if len(sys.argv) < 3:
        print("Usage: python video-bg-remove.py input.mp4 output.mp4")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        sys.exit(1)

    tmp_dir = tempfile.mkdtemp(prefix="rembg_")
    frames_in = os.path.join(tmp_dir, "frames")
    frames_out = os.path.join(tmp_dir, "nobg")
    os.makedirs(frames_in)
    os.makedirs(frames_out)

    print(f"[1/4] Extracting frames from {input_path}...")
    subprocess.run([
        FFMPEG, "-i", input_path, "-qscale:v", "2",
        os.path.join(frames_in, "frame_%06d.png")
    ], check=True, capture_output=True)

    frame_files = sorted(Path(frames_in).glob("*.png"))
    total = len(frame_files)
    print(f"[2/4] Removing background from {total} frames...")

    for i, fp in enumerate(frame_files):
        with open(fp, "rb") as f:
            input_data = f.read()
        output_data = remove(input_data, session=None)
        out_file = os.path.join(frames_out, fp.name)
        with open(out_file, "wb") as f:
            f.write(output_data)
        pct = (i + 1) / total * 100
        print(f"  Frame {i+1}/{total} ({pct:.0f}%)", end="\r")

    print(f"\n[3/4] Rebuilding video...")
    subprocess.run([
        FFMPEG, "-framerate", "30",
        "-i", os.path.join(frames_out, "frame_%06d.png"),
        "-c:v", "libx264", "-pix_fmt", "yuva420p",
        "-y", output_path
    ], check=True, capture_output=True)

    print(f"[4/4] Cleaning up...")
    shutil.rmtree(tmp_dir, ignore_errors=True)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"\nDone! Output: {output_path} ({size_mb:.1f} MB)")

if __name__ == "__main__":
    main()
