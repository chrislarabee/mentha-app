import re
from typing import Any, overload


@overload
def apply_camelcase(raw: dict[str, Any]) -> dict[str, Any]:
    ...


@overload
def apply_camelcase(raw: list[str]) -> list[str]:
    ...


@overload
def apply_camelcase(raw: str) -> str:
    ...


def apply_camelcase(
    raw: dict[str, Any] | list[str] | str,
) -> dict[str, Any] | list[str] | str:
    def _apply_to_field(f: str) -> str:
        x = f.replace("_", " ").strip().split(" ")
        x = [x[0], *[y.title() for y in x[1:]]]
        return "".join(x)

    if isinstance(raw, dict):
        return {_apply_to_field(k): v for k, v in raw.items()}
    elif isinstance(raw, list):
        return [_apply_to_field(e) for e in raw]
    else:
        return _apply_to_field(raw)


@overload
def apply_snake_case(raw: dict[str, Any]) -> dict[str, Any]:
    ...


@overload
def apply_snake_case(raw: list[str]) -> list[str]:
    ...


@overload
def apply_snake_case(raw: str) -> str:
    ...


def apply_snake_case(
    raw: dict[str, Any] | list[str] | str,
) -> dict[str, Any] | list[str] | str:
    def _apply_to_field(f: str) -> str:
        parts: list[str] = re.findall("[a-zA-Z][^A-Z]*", f)
        return "_".join([p.lower() for p in parts])

    if isinstance(raw, dict):
        return {_apply_to_field(k): v for k, v in raw.items()}
    elif isinstance(raw, list):
        return [_apply_to_field(e) for e in raw]
    else:
        return _apply_to_field(raw)
