import csv
import math
from pathlib import Path
import re
import shutil
from datetime import datetime
from typing import Any, Callable, Mapping, TypeVar, overload

from app.constants import DT_FORMAT

T = TypeVar("T")


@overload
def apply_camelcase(raw: dict[str, Any]) -> dict[str, Any]: ...


@overload
def apply_camelcase(raw: list[str]) -> list[str]: ...


@overload
def apply_camelcase(raw: str) -> str: ...


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
def apply_snake_case(raw: dict[str, Any]) -> dict[str, Any]: ...


@overload
def apply_snake_case(raw: list[str]) -> list[str]: ...


@overload
def apply_snake_case(raw: str) -> str: ...


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


def open_and_process_csv(
    p: Path, decoder: Callable[[Mapping[str, Any]], T], encoding: str = "utf-8"
) -> list[T]:
    """
    Reads a passed csv file, which is assumed to have a header row, and returns
    decoded rows.

    Args:
        p (Path): Path to the csv file to read.
        decoder (Callable[[Mapping[str, Any]], T]): Decoder to run on each row
            of the csv file.
        encoding (str, optional): Encoding of the csv file. Defaults to "utf-8".

    Raises:
        ValueError: If the passed Path is not a csv file.

    Returns:
        list[T]: List of the decoded rows from the file.
    """
    result = list[T]()
    if p.suffix != ".csv":
        raise ValueError(f"{p} is not a csv file.")
    with open(p, encoding=encoding) as file:
        reader = csv.DictReader(file)
        for row in reader:
            result.append(decoder(row))
    return result


def run_cli_transaction_file_search(
    file_contents: dict[str, T],
    display_func: Callable[[T], None],
) -> None:
    """
    Creates a CLI search app for transactions grouped by date. User will be prompted
    to enter dates, which should be the keys for file_contents, and can search/browse
    through dates.

    Args:
        file_contents (dict[str, T]): Dictionary containing DT_FORMAT keys and whatever
            values you've assembled from your file(s)
        display_func (Callable[[T], None]): The function to call to display results
            of the user's search.
    """
    sorted_dates = [datetime.strptime(dt, DT_FORMAT) for dt in file_contents.keys()]
    sorted_dates.sort()
    sorted_datestrs = [datetime.strftime(dt, DT_FORMAT) for dt in sorted_dates]
    search_val: str | None = None
    while True:
        u = input("Enter date (Q to quit, J for next date, K for previous date): ")
        if u.lower() == "q":
            print("Quitting search...")
            break
        elif u.lower() == "k":
            if search_val is not None:
                cur_idx = sorted_datestrs.index(search_val)
                if cur_idx - 1 < 0:
                    print("No previous orders.")
                else:
                    search_val = sorted_datestrs[cur_idx - 1]
            else:
                search_val = sorted_datestrs[-1]
        elif u.lower() == "j":
            if search_val is not None:
                cur_idx = sorted_datestrs.index(search_val)
                if cur_idx + 1 >= len(sorted_datestrs):
                    print("No subsequent orders.")
                else:
                    search_val = sorted_datestrs[cur_idx + 1]
            else:
                search_val = sorted_datestrs[0]
        else:
            try:
                search_val = datetime.strptime(u, DT_FORMAT).strftime(DT_FORMAT)
            except Exception:
                print(f"{u} has invalid date format. Expected format is YYYY-MM-DD.")
        if search_val is not None:
            hits = file_contents.get(search_val)
            sh_dims = shutil.get_terminal_size()
            x = math.floor((sh_dims.columns - 10) / 2)
            print(f"{'=' * x} Results: {'=' * x}")
            if not hits:
                print(f"No matching orders found for {search_val}")
            else:
                display_func(hits)
            print("=" * sh_dims.columns)
