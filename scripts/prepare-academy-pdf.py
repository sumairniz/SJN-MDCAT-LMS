#!/usr/bin/env python3
"""Validate and web-optimize ANY Academy Resources PDF before private R2 publishing.

Runs on a trusted upload-processing host with qpdf 11+, NOT in a student request.
The original remains unchanged; publishing/updating a resource is a separate,
authorized operation performed only after output validation.
Usage:
 python3 scripts/prepare-academy-pdf.py source.pdf --output output-linearized.pdf
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys


def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1048576), b''):
            h.update(block)
    return h.hexdigest()


def validated_qpdf(*args):
    result = subprocess.run(['qpdf', *map(str, args)], capture_output=True,
                            text=True, timeout=120, check=False)
    if result.returncode:
        raise RuntimeError('qpdf validation failed: ' + (result.stderr or result.stdout)[:400])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--max-mb', type=int, default=50)
    args = parser.parse_args()
    source, target = args.source.resolve(), args.output.resolve()
    if source == target or not source.is_file() or source.suffix.lower() != '.pdf':
        parser.error('source must be an existing PDF and cannot equal output')
    if target.suffix.lower() != '.pdf' or target.exists():
        parser.error('output must be a new .pdf path; originals cannot be overwritten')
    if args.max_mb <= 0 or source.stat().st_size > args.max_mb * 1048576:
        parser.error('source exceeds configured PDF size limit')
    if not shutil.which('qpdf'):
        parser.error('qpdf must be installed on the trusted processing host')
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_name(target.name + '.partial')
    if temp.exists():
        parser.error('unfinished output exists; investigate before retrying')
    try:
        validated_qpdf('--check', source)
        validated_qpdf('--linearize', source, temp)
        validated_qpdf('--check', temp)
        validated_qpdf('--check-linearization', temp)
        temp.replace(target)
    finally:
        temp.unlink(missing_ok=True)
    print(json.dumps({
        'source_bytes': source.stat().st_size,
        'optimized_bytes': target.stat().st_size,
        'source_sha256': sha256(source),
        'optimized_sha256': sha256(target),
        'web_linearized': True,
        'original_preserved': True
    }, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.TimeoutExpired) as err:
        print(str(err), file=sys.stderr)
        sys.exit(1)
