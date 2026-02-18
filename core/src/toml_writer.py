"""
TOML Writer - Serialize Python dicts to TOML format.
Preserves structure for CMS content files.
"""

import tomli_w
from typing import Dict, Any
from pathlib import Path


def save_toml(data: Dict[str, Any], filepath: str) -> None:
    """
    Save dictionary to TOML file.

    Args:
        data: Dictionary to save
        filepath: Path to output file
    """
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "wb") as f:
        tomli_w.dump(data, f)


def dict_to_toml_string(data: Dict[str, Any]) -> str:
    """Convert dictionary to TOML string."""
    return tomli_w.dumps(data)
