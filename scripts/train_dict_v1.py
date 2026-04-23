from __future__ import annotations

import argparse
from pathlib import Path
import sys


DEFAULT_DICT_SIZE = 48 * 1024


def load_zstandard():
    try:
        import zstandard as zstd  # type: ignore
    except ModuleNotFoundError:
        print(
            "Missing python package 'zstandard'. Install with: python3 -m pip install --target /tmp/zstdpy zstandard",
            file=sys.stderr,
        )
        raise
    return zstd


def collect_samples(samples_dir: Path) -> list[bytes]:
    samples: list[bytes] = []
    for path in sorted(samples_dir.glob("*.txt")):
        text = path.read_text(encoding="utf-8")
        segments = [segment.strip() for segment in text.splitlines() if segment.strip()]
        segments.append(text.strip())
        for segment in segments:
            data = segment.encode("utf-8")
            if data:
                samples.append(data)
    if not samples:
        raise SystemExit(f"No training samples found in {samples_dir}")
    return samples


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--samples-dir",
        default="protocol/dict_v1/samples",
        help="Directory containing UTF-8 sample text files.",
    )
    parser.add_argument(
        "--output",
        default="src/assets/dict_v1.bin",
        help="Where to write the dictionary bytes.",
    )
    parser.add_argument(
        "--dict-size",
        type=int,
        default=DEFAULT_DICT_SIZE,
        help="Requested dictionary size in bytes.",
    )
    args = parser.parse_args()

    zstd = load_zstandard()
    samples_dir = Path(args.samples_dir)
    samples = collect_samples(samples_dir)
    total_bytes = sum(len(sample) for sample in samples)
    dict_size = min(args.dict_size, max(1024, total_bytes // 8))

    dictionary = zstd.train_dictionary(dict_size, samples)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(dictionary.as_bytes())

    print(
        f"trained dict_v1: samples={len(samples)} total_bytes={total_bytes} dict_size={len(dictionary.as_bytes())} output={output_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
